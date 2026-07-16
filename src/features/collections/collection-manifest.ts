import { z } from "zod"

export const responsiveImageSourceSchema = z.object({
  src: z.string().startsWith("/media/collections/"),
  width: z.number().int().positive(),
})

export const runwayImageSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1),
  credit: z.string().min(1),
  sourcePageUrl: z.url(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  src: z.string().startsWith("/media/collections/"),
  sources: z.array(responsiveImageSourceSchema).min(1),
})

export const collectionManifestSchema = z
  .object({
    version: z.literal(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    season: z.string().min(1),
    year: z.string().regex(/^\d{4}$/),
    sourceName: z.literal("WWD"),
    sourceUrl: z.url(),
    credit: z.string().min(1),
    updatedAt: z.iso.datetime(),
    imageCount: z.number().int().nonnegative(),
    images: z.array(runwayImageSchema),
  })
  .refine((manifest) => manifest.imageCount === manifest.images.length, {
    message: "imageCount must match images length",
    path: ["imageCount"],
  })

export type ResponsiveImageSource = z.infer<typeof responsiveImageSourceSchema>
export type RunwayImage = z.infer<typeof runwayImageSchema>
export type CollectionManifest = z.infer<typeof collectionManifestSchema>
