import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { getCollectionBySlug } from "@/features/collections/collection-catalog"
import { RunwayGallery } from "@/features/collections/runway-gallery"
import { useCollectionManifest } from "@/features/collections/use-collection-manifest"

function formatSeason(value: string | undefined) {
  if (!value) return "Uncatalogued collection"
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function CollectionDetailPage() {
  const { season } = useParams<{ season: string }>()
  const collection = getCollectionBySlug(season)
  const title = collection?.title ?? formatSeason(season)
  const manifest = useCollectionManifest(season)

  return (
    <div className="page-shell py-12 md:py-20">
      <Link to="/collections" className="eyebrow inline-flex items-center gap-2 hover:underline">
        <ArrowLeft className="size-3" /> Back to collections
      </Link>
      <header className="grid min-h-[58vh] content-end gap-10 border-b border-border pb-8 pt-24 md:grid-cols-12">
        <p className="eyebrow md:col-span-3">Collection study</p>
        <h1 className="text-[clamp(3.25rem,9vw,9rem)] font-medium leading-[0.86] tracking-[-0.07em] md:col-span-11">
          {title}
        </h1>
      </header>
      {manifest.isPending ? (
        <section className="min-h-80 py-16 md:py-24">
          <p className="eyebrow text-muted-foreground">Checking local archive</p>
        </section>
      ) : null}

      {manifest.isError ? (
        <section className="grid gap-12 py-16 md:grid-cols-12 md:py-24">
          <p className="eyebrow md:col-span-3">Local archive error</p>
          <div className="md:col-span-5 md:col-start-7">
            <p className="text-2xl leading-snug tracking-[-0.035em]">The local collection manifest could not be read.</p>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Validate the generated manifest and local image files, then reload this page.
            </p>
          </div>
        </section>
      ) : null}

      {manifest.data === null ? (
        <section className="grid gap-12 py-16 md:grid-cols-12 md:py-24">
          <p className="eyebrow md:col-span-3">Archive note</p>
          <div className="md:col-span-5 md:col-start-7">
            <p className="text-2xl leading-snug tracking-[-0.035em]">This collection record is being assembled.</p>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Runway imagery, credits, context, and garment notes will appear here after source review.
            </p>
          </div>
        </section>
      ) : null}

      {manifest.data ? (
        <>
          <RunwayGallery manifest={manifest.data} />
          <footer className="grid gap-8 border-t border-border py-8 md:grid-cols-12">
            <p className="eyebrow md:col-span-3">Source and credit</p>
            <div className="space-y-3 text-sm leading-relaxed md:col-span-6 md:col-start-7">
              <p>{manifest.data.credit}</p>
              <p className="text-muted-foreground">Private study archive. Original credits and watermarks are preserved.</p>
              <a
                href={manifest.data.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="eyebrow inline-block border-b border-foreground pb-1"
              >
                View source on {manifest.data.sourceName}
              </a>
            </div>
          </footer>
        </>
      ) : null}
    </div>
  )
}
