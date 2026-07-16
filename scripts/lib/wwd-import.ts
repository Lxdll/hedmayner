import { createHash } from "node:crypto"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { load } from "cheerio"
import sharp from "sharp"
import { z } from "zod"

import {
  collectionManifestSchema,
  type CollectionManifest,
  type RunwayImage,
} from "../../src/features/collections/collection-manifest.ts"

const importPlanImageSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  credit: z.string().min(1),
  sourcePageUrl: z.url(),
  imageUrl: z.url(),
})

export const importPlanSchema = z.object({
  version: z.literal(1),
  collection: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  season: z.string().min(1),
  year: z.string().regex(/^\d{4}$/),
  galleryUrl: z.url(),
  discoveredAt: z.iso.datetime(),
  credit: z.string().min(1),
  images: z.array(importPlanImageSchema).min(1),
})

export type ImportPlan = z.infer<typeof importPlanSchema>
export type ImportPlanImage = z.infer<typeof importPlanImageSchema>

type ImageCandidate = {
  url: string
  width: number
}

const REQUEST_HEADERS = {
  Accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/jpeg,image/png;q=0.9,*/*;q=0.5",
  "User-Agent": "HED-MAYNER-ARCHIVE/1.0 (authorized private-study importer)",
}

const ACCESS_CONTROL_STATUSES = new Set([401, 403, 429])
const IMAGE_EXTENSIONS = /\.(?:avif|jpe?g|png|webp)(?:$|\?)/i
const EXCLUDED_IMAGE_TOKENS = /(?:avatar|favicon|icon|logo|placeholder|sprite)/i

export class AccessControlError extends Error {}

export function assertAllowedUrl(rawUrl: string, kind: "page" | "image") {
  const url = new URL(rawUrl)
  const isWwdHost = url.hostname === "wwd.com" || url.hostname.endsWith(".wwd.com")
  const isVerifiedImageHost = url.hostname === "pmcwwd.files.wordpress.com"

  if (url.protocol !== "https:") {
    throw new Error(`Only HTTPS URLs are allowed: ${rawUrl}`)
  }

  if (kind === "page" && !isWwdHost) {
    throw new Error(`Gallery pages must be hosted on wwd.com: ${rawUrl}`)
  }

  if (kind === "image" && !isWwdHost && !isVerifiedImageHost) {
    throw new Error(`Unverified image host: ${url.hostname}`)
  }

  return url
}

function normalizeUrl(value: string | undefined, baseUrl: string) {
  if (!value) return null

  try {
    return new URL(value.trim(), baseUrl).toString()
  } catch {
    return null
  }
}

export function parseSrcset(value: string | undefined, baseUrl: string) {
  if (!value) return []

  return value
    .split(",")
    .map((entry): ImageCandidate | null => {
      const [rawUrl, descriptor] = entry.trim().split(/\s+/)
      const url = normalizeUrl(rawUrl, baseUrl)
      if (!url) return null

      const width = descriptor?.endsWith("w") ? Number.parseInt(descriptor, 10) : 0
      return { url, width: Number.isFinite(width) ? width : 0 }
    })
    .filter((candidate): candidate is ImageCandidate => candidate !== null)
}

function isAllowedImageCandidate(candidate: ImageCandidate) {
  try {
    assertAllowedUrl(candidate.url, "image")
    return IMAGE_EXTENSIONS.test(candidate.url) && !EXCLUDED_IMAGE_TOKENS.test(candidate.url)
  } catch {
    return false
  }
}

function collectStructuredImageUrls(value: unknown, baseUrl: string, output: ImageCandidate[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectStructuredImageUrls(item, baseUrl, output))
    return
  }

  if (!value || typeof value !== "object") return

  for (const [key, nestedValue] of Object.entries(value)) {
    if (["contentUrl", "thumbnailUrl", "image"].includes(key) && typeof nestedValue === "string") {
      const url = normalizeUrl(nestedValue, baseUrl)
      if (url) output.push({ url, width: 0 })
    } else {
      collectStructuredImageUrls(nestedValue, baseUrl, output)
    }
  }
}

export function extractImageCandidates(html: string, pageUrl: string) {
  const $ = load(html)
  const candidates: ImageCandidate[] = []

  $("img, source").each((_, element) => {
    const node = $(element)
    const width = Number.parseInt(node.attr("width") ?? "0", 10) || 0

    for (const attribute of ["srcset", "data-srcset"]) {
      candidates.push(...parseSrcset(node.attr(attribute), pageUrl))
    }

    for (const attribute of ["src", "data-src", "data-lazy-src", "data-original"]) {
      const url = normalizeUrl(node.attr(attribute), pageUrl)
      if (url) candidates.push({ url, width })
    }
  })

  for (const selector of [
    'meta[property="og:image"]',
    'meta[property="og:image:secure_url"]',
    'meta[name="twitter:image"]',
  ]) {
    const url = normalizeUrl($(selector).attr("content"), pageUrl)
    if (url) candidates.push({ url, width: 0 })
  }

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      collectStructuredImageUrls(JSON.parse($(element).text()), pageUrl, candidates)
    } catch {
      // Ignore malformed third-party structured data.
    }
  })

  return candidates.filter(isAllowedImageCandidate)
}

export function extractBestImage(html: string, pageUrl: string) {
  const candidates = extractImageCandidates(html, pageUrl)
  const unique = new Map<string, ImageCandidate>()

  for (const candidate of candidates) {
    const key = `${new URL(candidate.url).hostname}${new URL(candidate.url).pathname}`
    const current = unique.get(key)
    if (!current || candidate.width > current.width) unique.set(key, candidate)
  }

  return [...unique.values()].sort((left, right) => {
    const widthDifference = right.width - left.width
    if (widthDifference !== 0) return widthDifference
    return Number(/hed[-_ ]mayner/i.test(right.url)) - Number(/hed[-_ ]mayner/i.test(left.url))
  })[0]
}

export function getGalleryRoot(rawUrl: string) {
  const url = assertAllowedUrl(rawUrl, "page")
  const match = url.pathname.match(/^(.*\/gallery\/[^/]+\/)/)
  if (!match?.[1]) throw new Error("The URL is not a WWD gallery URL")
  return new URL(match[1], url.origin).toString()
}

function pageOrder(url: string) {
  const pathname = new URL(url).pathname.replace(/\/$/, "")
  const match = pathname.match(/-(\d+)$/)
  return match?.[1] ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER
}

export function extractGalleryPageUrls(html: string, galleryUrl: string, seedUrl?: string) {
  const $ = load(html)
  const root = new URL(getGalleryRoot(galleryUrl))
  const urls = new Set<string>()

  if (seedUrl && new URL(seedUrl).pathname !== root.pathname) {
    urls.add(assertAllowedUrl(seedUrl, "page").toString())
  }

  $("a[href]").each((_, element) => {
    const url = normalizeUrl($(element).attr("href"), root.toString())
    if (!url) return

    const parsed = new URL(url)
    if (parsed.hostname === root.hostname && parsed.pathname.startsWith(root.pathname) && parsed.pathname !== root.pathname) {
      urls.add(parsed.toString())
    }
  })

  return [...urls].sort((left, right) => pageOrder(left) - pageOrder(right))
}

function cleanText(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? ""
}

export function extractPageMetadata(html: string) {
  const $ = load(html)
  const title = cleanText($('meta[property="og:title"]').attr("content")) || cleanText($("title").text()) || "Runway look"
  const selectors = [
    'meta[name="photographer"]',
    'meta[name="credit"]',
    ".pmc-gallery__slide-image-credit",
    '[class*="image-credit"]',
    '[class*="photo-credit"]',
  ]
  const credit = selectors
    .map((selector) => cleanText($(selector).attr("content") ?? $(selector).first().text()))
    .find(Boolean) ?? "WWD"

  return { title, credit }
}

const embeddedGalleryImageSchema = z.object({
  image: z.url(),
  alt: z.string().optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  image_credit: z.string().optional(),
  position: z.number().int().positive(),
  url: z.url(),
  fullWidth: z.number().int().positive().optional(),
  sizes: z.record(
    z.string(),
    z.object({
      src: z.url(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
  ).optional(),
})

const embeddedGallerySchema = z.object({
  gallery: z.array(embeddedGalleryImageSchema),
})

export function extractEmbeddedGallery(html: string) {
  const $ = load(html)
  let embeddedValue: unknown

  $("script").each((_, element) => {
    const script = $(element).text().trim()
    const assignmentStart = script.indexOf("var pmcGalleryExports =")
    if (assignmentStart === -1) return

    const objectStart = script.indexOf("{", assignmentStart)
    const objectEnd = script.lastIndexOf("}")
    if (objectStart === -1 || objectEnd === -1) return

    try {
      embeddedValue = JSON.parse(script.slice(objectStart, objectEnd + 1))
    } catch {
      embeddedValue = undefined
    }
  })

  const result = embeddedGallerySchema.safeParse(embeddedValue)
  if (!result.success) return []

  return result.data.gallery
    .map((item): Omit<ImportPlanImage, "order"> & { position: number } | null => {
      const candidates: ImageCandidate[] = [
        { url: item.image, width: item.fullWidth ?? 0 },
        ...Object.values(item.sizes ?? {}).map((size) => ({ url: size.src, width: size.width })),
      ]
      const best = candidates
        .filter(isAllowedImageCandidate)
        .sort((left, right) => right.width - left.width)[0]
      if (!best) return null

      return {
        position: item.position,
        title: cleanText(item.alt) || cleanText(item.title) || `Runway look ${item.position}`,
        credit: cleanText(item.image_credit) || "WWD",
        sourcePageUrl: item.url,
        imageUrl: best.url,
      }
    })
    .filter((item): item is Omit<ImportPlanImage, "order"> & { position: number } => item !== null)
    .sort((left, right) => left.position - right.position)
}

function describeCollection(slug: string) {
  const year = slug.match(/(\d{4})$/)?.[1]
  if (!year) throw new Error(`Collection slug must end in a four-digit year: ${slug}`)

  const words = slug
    .replace(`-${year}`, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  const season = words.join(" ")
  return { year, season, title: `${season} ${year}` }
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function fetchWithPolicy(rawUrl: string, kind: "page" | "image", fetchImpl: typeof fetch = fetch) {
  assertAllowedUrl(rawUrl, kind)
  let lastError: unknown

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl(rawUrl, { headers: REQUEST_HEADERS, redirect: "follow" })

      if (ACCESS_CONTROL_STATUSES.has(response.status)) {
        throw new AccessControlError(`Access stopped with status ${response.status}: ${rawUrl}`)
      }

      if (response.status >= 500 && attempt < 2) {
        await delay(500 * (attempt + 1))
        continue
      }

      if (!response.ok) throw new Error(`Request failed with status ${response.status}: ${rawUrl}`)
      return response
    } catch (error) {
      if (error instanceof AccessControlError) throw error
      lastError = error
      if (attempt < 2) await delay(500 * (attempt + 1))
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Request failed: ${rawUrl}`)
}

export async function discoverCollection(options: {
  collection: string
  url: string
  fetchImpl?: typeof fetch
  requestDelayMs?: number
}) {
  const fetchImpl = options.fetchImpl ?? fetch
  const requestDelayMs = options.requestDelayMs ?? 1_500
  const galleryUrl = getGalleryRoot(options.url)
  const rootResponse = await fetchWithPolicy(galleryUrl, "page", fetchImpl)
  const rootHtml = await rootResponse.text()
  const embeddedImages = extractEmbeddedGallery(rootHtml)
  const pageUrls = extractGalleryPageUrls(rootHtml, galleryUrl, options.url)
  const pages = pageUrls.length > 0 ? pageUrls : [options.url]
  const discoveredImages: Omit<ImportPlanImage, "order">[] = embeddedImages.map((image) => ({
    title: image.title,
    credit: image.credit,
    sourcePageUrl: image.sourcePageUrl,
    imageUrl: image.imageUrl,
  }))
  const seenImages = new Set<string>()

  for (const [index, pageUrl] of embeddedImages.length > 0 ? [] : pages.entries()) {
    if (index > 0) await delay(requestDelayMs)
    const html = pageUrl === galleryUrl ? rootHtml : await (await fetchWithPolicy(pageUrl, "page", fetchImpl)).text()
    const image = extractBestImage(html, pageUrl)
    if (!image) continue

    const imageKey = `${new URL(image.url).hostname}${new URL(image.url).pathname}`
    if (seenImages.has(imageKey)) continue
    seenImages.add(imageKey)

    const metadata = extractPageMetadata(html)
    discoveredImages.push({ ...metadata, sourcePageUrl: pageUrl, imageUrl: image.url })
  }

  if (discoveredImages.length === 0) {
    throw new Error("No authorized runway images were discovered. Use the WWD download package or API instead.")
  }

  const description = describeCollection(options.collection)
  const credits = [...new Set(discoveredImages.map((image) => image.credit))]
  return importPlanSchema.parse({
    version: 1,
    collection: options.collection,
    ...description,
    galleryUrl,
    discoveredAt: new Date().toISOString(),
    credit: credits.join(" / "),
    images: discoveredImages.map((image, index) => ({ ...image, order: index + 1 })),
  })
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("jpeg")) return "jpg"
  if (contentType.includes("png")) return "png"
  if (contentType.includes("webp")) return "webp"
  if (contentType.includes("avif")) return "avif"
  throw new Error(`Unsupported image content type: ${contentType}`)
}

async function existingOriginal(originalDirectory: string, id: string) {
  try {
    const filenames = await readdir(originalDirectory)
    const filename = filenames.find((candidate) => candidate.startsWith(`${id}.`))
    if (!filename) return null
    return { filename, buffer: await readFile(path.join(originalDirectory, filename)) }
  } catch {
    return null
  }
}

async function createResponsiveSources(buffer: Buffer, width: number, id: string, collection: string, webDirectory: string) {
  const widths = [...new Set([Math.min(960, width), Math.min(1_800, width)])].sort((left, right) => left - right)
  const sources: RunwayImage["sources"] = []

  for (const targetWidth of widths) {
    const filename = `${id}-${targetWidth}.webp`
    await sharp(buffer)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(path.join(webDirectory, filename))
    sources.push({ src: `/media/collections/${collection}/${filename}`, width: targetWidth })
  }

  return sources
}

export async function downloadCollection(options: {
  plan: ImportPlan
  rootDirectory: string
  fetchImpl?: typeof fetch
  requestDelayMs?: number
}) {
  const plan = importPlanSchema.parse(options.plan)
  const fetchImpl = options.fetchImpl ?? fetch
  const requestDelayMs = options.requestDelayMs ?? 1_500
  const originalDirectory = path.join(options.rootDirectory, ".archive", "originals", plan.collection)
  const webDirectory = path.join(options.rootDirectory, "public", "media", "collections", plan.collection)
  await mkdir(originalDirectory, { recursive: true })
  await mkdir(webDirectory, { recursive: true })

  const images: RunwayImage[] = []
  const seenHashes = new Set<string>()

  for (const [index, plannedImage] of plan.images.entries()) {
    const id = String(plannedImage.order).padStart(3, "0")
    const existing = await existingOriginal(originalDirectory, id)
    let buffer: Buffer

    if (existing) {
      buffer = existing.buffer
    } else {
      if (index > 0) await delay(requestDelayMs)
      const response = await fetchWithPolicy(plannedImage.imageUrl, "image", fetchImpl)
      const contentType = response.headers.get("content-type") ?? ""
      if (!contentType.startsWith("image/")) throw new Error(`Expected an image response: ${plannedImage.imageUrl}`)
      buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.byteLength < 10_000) throw new Error(`Image response is unexpectedly small: ${plannedImage.imageUrl}`)
      await writeFile(path.join(originalDirectory, `${id}.${extensionFromContentType(contentType)}`), buffer)
    }

    const metadata = await sharp(buffer).metadata()
    if (!metadata.width || !metadata.height) throw new Error(`Image dimensions are missing for look ${plannedImage.order}`)

    const sha256 = createHash("sha256").update(buffer).digest("hex")
    if (seenHashes.has(sha256)) continue
    seenHashes.add(sha256)

    const sources = await createResponsiveSources(buffer, metadata.width, id, plan.collection, webDirectory)
    const largestSource = sources.at(-1)
    if (!largestSource) throw new Error(`No responsive image was generated for look ${plannedImage.order}`)

    images.push({
      id,
      order: images.length + 1,
      width: metadata.width,
      height: metadata.height,
      alt: `Hed Mayner ${plan.title} runway look ${String(images.length + 1).padStart(2, "0")}`,
      credit: plannedImage.credit,
      sourcePageUrl: plannedImage.sourcePageUrl,
      sha256,
      src: largestSource.src,
      sources,
    })
  }

  const manifest: CollectionManifest = collectionManifestSchema.parse({
    version: 1,
    slug: plan.collection,
    title: `Hed Mayner ${plan.title}`,
    season: plan.season,
    year: plan.year,
    sourceName: "WWD",
    sourceUrl: plan.galleryUrl,
    credit: plan.credit,
    updatedAt: new Date().toISOString(),
    imageCount: images.length,
    images,
  })

  await writeFile(path.join(webDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}

export async function readImportPlan(planPath: string) {
  return importPlanSchema.parse(JSON.parse(await readFile(planPath, "utf8")))
}

export async function writeImportPlan(planPath: string, plan: ImportPlan) {
  await mkdir(path.dirname(planPath), { recursive: true })
  await writeFile(planPath, `${JSON.stringify(importPlanSchema.parse(plan), null, 2)}\n`)
}
