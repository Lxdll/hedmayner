import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"

import sharp from "sharp"

import {
  AccessControlError,
  assertAllowedUrl,
  downloadCollection,
  extractBestImage,
  extractEmbeddedGallery,
  extractGalleryPageUrls,
  fetchWithPolicy,
  importPlanSchema,
  parseSrcset,
} from "./wwd-import.ts"

const galleryRoot = "https://wwd.com/fashion-news/shows-reviews/gallery/hed-mayner-rtw-spring-1235703335/"
const seedPage = `${galleryRoot}hed-mayner-rtw-spring-2024-11/`

test("parseSrcset resolves URLs and retains declared widths", () => {
  assert.deepEqual(
    parseSrcset(
      "/wp-content/uploads/look.jpg?w=640 640w, /wp-content/uploads/look.jpg?w=1800 1800w",
      seedPage,
    ),
    [
      { url: "https://wwd.com/wp-content/uploads/look.jpg?w=640", width: 640 },
      { url: "https://wwd.com/wp-content/uploads/look.jpg?w=1800", width: 1800 },
    ],
  )
})

test("extractBestImage chooses the largest declared runway candidate", () => {
  const html = `
    <html><head><meta property="og:image" content="https://wwd.com/wp-content/uploads/hed-mayner-cover.jpg"></head>
    <body>
      <img src="https://wwd.com/wp-content/uploads/logo.png" width="120" />
      <img
        src="https://wwd.com/wp-content/uploads/hed-mayner-look.jpg?w=640"
        srcset="https://wwd.com/wp-content/uploads/hed-mayner-look.jpg?w=640 640w,
                https://wwd.com/wp-content/uploads/hed-mayner-look.jpg?w=1800 1800w"
      />
    </body></html>
  `

  assert.deepEqual(extractBestImage(html, seedPage), {
    url: "https://wwd.com/wp-content/uploads/hed-mayner-look.jpg?w=1800",
    width: 1800,
  })
})

test("gallery detail links are deduplicated and sorted by look number", () => {
  const html = `
    <a href="${galleryRoot}hed-mayner-rtw-spring-2024-12/">12</a>
    <a href="${galleryRoot}hed-mayner-rtw-spring-2024-2/">2</a>
    <a href="${galleryRoot}hed-mayner-rtw-spring-2024-2/">duplicate</a>
    <a href="https://example.com/unrelated/">external</a>
  `

  assert.deepEqual(extractGalleryPageUrls(html, galleryRoot, seedPage), [
    `${galleryRoot}hed-mayner-rtw-spring-2024-2/`,
    seedPage,
    `${galleryRoot}hed-mayner-rtw-spring-2024-12/`,
  ])
})

test("embedded WWD gallery data provides ordered highest-resolution images and credits", () => {
  const html = `
    <script>
      var pmcGalleryExports = {"gallery":[
        {"image":"https://wwd.com/wp-content/uploads/look-002.jpg","alt":"Look 2","image_credit":"Courtesy of Hed Mayner","position":2,"url":"${galleryRoot}","fullWidth":1024,"sizes":{"xl":{"src":"https://wwd.com/wp-content/uploads/look-002.jpg?w=1280","width":1280,"height":1920}}},
        {"image":"https://wwd.com/wp-content/uploads/look-001.jpg","title":"Look 1","image_credit":"Courtesy of Hed Mayner","position":1,"url":"${galleryRoot}","fullWidth":1024,"sizes":{"xl":{"src":"https://wwd.com/wp-content/uploads/look-001.jpg?w=1280","width":1280,"height":1920}}}
      ]};
    </script>
  `

  assert.deepEqual(extractEmbeddedGallery(html), [
    {
      position: 1,
      title: "Look 1",
      credit: "Courtesy of Hed Mayner",
      sourcePageUrl: galleryRoot,
      imageUrl: "https://wwd.com/wp-content/uploads/look-001.jpg?w=1280",
    },
    {
      position: 2,
      title: "Look 2",
      credit: "Courtesy of Hed Mayner",
      sourcePageUrl: galleryRoot,
      imageUrl: "https://wwd.com/wp-content/uploads/look-002.jpg?w=1280",
    },
  ])
})

test("URL policy rejects unverified image hosts", () => {
  assert.throws(() => assertAllowedUrl("https://images.example.com/look.jpg", "image"), /Unverified image host/)
})

test("access-control responses stop immediately", async () => {
  let calls = 0
  const blockedFetch: typeof fetch = async () => {
    calls += 1
    return new Response("blocked", { status: 403 })
  }

  await assert.rejects(fetchWithPolicy(seedPage, "page", blockedFetch), AccessControlError)
  assert.equal(calls, 1)
})

test("server errors retry before succeeding", async () => {
  let calls = 0
  const recoveringFetch: typeof fetch = async () => {
    calls += 1
    return calls < 3 ? new Response("unavailable", { status: 503 }) : new Response("ok", { status: 200 })
  }

  const response = await fetchWithPolicy(seedPage, "page", recoveringFetch)
  assert.equal(response.status, 200)
  assert.equal(calls, 3)
})

test("download resumes from originals and removes duplicate images from the manifest", async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "hed-mayner-import-"))
  const originalDirectory = path.join(rootDirectory, ".archive", "originals", "spring-summer-2024")
  await mkdir(originalDirectory, { recursive: true })
  const image = await sharp({
    create: { width: 1_200, height: 1_600, channels: 3, background: "#d8d6d1" },
  }).jpeg().toBuffer()
  await writeFile(path.join(originalDirectory, "001.jpg"), image)
  await writeFile(path.join(originalDirectory, "002.jpg"), image)

  const plan = importPlanSchema.parse({
    version: 1,
    collection: "spring-summer-2024",
    title: "Spring Summer 2024",
    season: "Spring Summer",
    year: "2024",
    galleryUrl: galleryRoot,
    discoveredAt: "2026-07-14T00:00:00.000Z",
    credit: "Test photographer / WWD",
    images: [1, 2].map((order) => ({
      order,
      title: `Look ${order}`,
      credit: "Test photographer / WWD",
      sourcePageUrl: `${galleryRoot}look-${order}/`,
      imageUrl: `https://wwd.com/wp-content/uploads/hed-mayner-look-${order}.jpg`,
    })),
  })

  try {
    const manifest = await downloadCollection({ plan, rootDirectory, requestDelayMs: 0 })
    assert.equal(manifest.imageCount, 1)
    assert.equal(manifest.images[0]?.width, 1_200)
    assert.equal(manifest.images[0]?.sources.length, 2)
  } finally {
    await rm(rootDirectory, { recursive: true, force: true })
  }
})

test("download rejects a non-image response", async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "hed-mayner-non-image-"))
  const plan = importPlanSchema.parse({
    version: 1,
    collection: "spring-summer-2024",
    title: "Spring Summer 2024",
    season: "Spring Summer",
    year: "2024",
    galleryUrl: galleryRoot,
    discoveredAt: "2026-07-14T00:00:00.000Z",
    credit: "WWD",
    images: [{
      order: 1,
      title: "Look 1",
      credit: "WWD",
      sourcePageUrl: seedPage,
      imageUrl: "https://wwd.com/wp-content/uploads/hed-mayner-look-1.jpg",
    }],
  })
  const htmlFetch: typeof fetch = async () => new Response("not an image", {
    status: 200,
    headers: { "content-type": "text/html" },
  })

  try {
    await assert.rejects(
      downloadCollection({ plan, rootDirectory, fetchImpl: htmlFetch, requestDelayMs: 0 }),
      /Expected an image response/,
    )
  } finally {
    await rm(rootDirectory, { recursive: true, force: true })
  }
})
