import { useState } from "react"

import type { CollectionManifest, RunwayImage } from "@/features/collections/collection-manifest"
import { RunwayLightbox } from "@/features/collections/runway-lightbox"

function imageSrcSet(image: RunwayImage) {
  return image.sources.map((source) => `${source.src} ${source.width}w`).join(", ")
}

function RunwayImageTile({ image, onOpen }: { image: RunwayImage; onOpen: () => void }) {
  const [hasError, setHasError] = useState(false)

  return (
    <figure>
      <button
        type="button"
        className="relative block w-full bg-muted text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
        onClick={onOpen}
        aria-label={`Open ${image.alt}`}
      >
        {hasError ? (
          <span className="absolute inset-0 flex items-center justify-center p-8 text-center text-[0.625rem] uppercase tracking-[0.14em] text-muted-foreground">
            Local image unavailable
          </span>
        ) : (
          <img
            src={image.src}
            srcSet={imageSrcSet(image)}
            sizes="(min-width: 768px) 50vw, 100vw"
            width={image.width}
            height={image.height}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
            onError={() => setHasError(true)}
          />
        )}
      </button>
      <figcaption className="flex items-start justify-between gap-4 border-t border-border pt-2 text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
        <span>Look {String(image.order).padStart(2, "0")}</span>
        <span className="text-right">{image.credit}</span>
      </figcaption>
    </figure>
  )
}

export function RunwayGallery({ manifest }: { manifest: CollectionManifest }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  return (
    <>
      <section className="py-16 md:py-24" aria-label={`${manifest.title} runway looks`}>
        <div className="mb-8 flex items-end justify-between border-b border-border pb-3">
          <p className="eyebrow">Complete runway</p>
          <p className="eyebrow text-muted-foreground">{manifest.imageCount} looks</p>
        </div>
        <div className="grid gap-x-5 gap-y-12 md:grid-cols-2 md:gap-y-20">
          {manifest.images.map((image, index) => (
            <RunwayImageTile key={image.sha256} image={image} onOpen={() => setSelectedIndex(index)} />
          ))}
        </div>
      </section>

      <RunwayLightbox
        images={manifest.images}
        selectedIndex={selectedIndex}
        onSelectedIndexChange={setSelectedIndex}
      />
    </>
  )
}
