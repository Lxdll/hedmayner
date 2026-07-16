import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

import { collectionCatalog } from "@/features/collections/collection-catalog"
import { useCollectionManifest } from "@/features/collections/use-collection-manifest"

function CollectionStatus({ slug }: { slug: string }) {
  const manifest = useCollectionManifest(slug)

  if (manifest.isPending) return <span>Checking</span>
  if (manifest.data) return <span>{manifest.data.imageCount} looks</span>
  return <span>Index pending</span>
}

export function CollectionsPage() {
  return (
    <div className="page-shell py-12 md:py-20">
      <header className="grid min-h-[42vh] content-between gap-16 border-b border-border pb-8 md:grid-cols-12">
        <p className="eyebrow md:col-span-3">01 / Collection archive</p>
        <h1 className="display-title md:col-span-12">Collections</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:col-span-4 md:col-start-9">
          A chronological study of runway collections and presentations. Entries will expand as source material is verified.
        </p>
      </header>

      <div className="py-12 md:py-20">
        <div className="mb-6 grid grid-cols-12 text-muted-foreground">
          <span className="eyebrow col-span-2">Year</span>
          <span className="eyebrow col-span-7">Season</span>
          <span className="eyebrow col-span-3 text-right">Status</span>
        </div>
        <div className="border-b border-border">
          {collectionCatalog.map((item) => (
            <Link
              key={item.slug}
              to={`/collections/${item.slug}`}
              className="group grid grid-cols-12 items-center border-t border-border py-5 md:py-7"
            >
              <span className="col-span-2 text-sm">{item.year}</span>
              <span className="col-span-7 text-xl tracking-[-0.03em] md:text-3xl">{item.season}</span>
              <span className="col-span-3 flex items-center justify-end gap-3 text-right text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
                <span className="hidden sm:inline"><CollectionStatus slug={item.slug} /></span>
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
