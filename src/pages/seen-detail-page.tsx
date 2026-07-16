import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"

function formatSlug(value: string | undefined) {
  if (!value) return "Uncatalogued appearance"
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function SeenDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <article className="page-shell py-12 md:py-20">
      <Link to="/seen" className="eyebrow inline-flex items-center gap-2 hover:underline">
        <ArrowLeft className="size-3" /> Back to seen
      </Link>
      <header className="grid min-h-[60vh] content-end gap-8 border-b border-border pb-8 pt-24 md:grid-cols-12">
        <p className="eyebrow md:col-span-3">Seen / Record</p>
        <h1 className="text-[clamp(3.5rem,10vw,9.5rem)] font-medium leading-[0.84] tracking-[-0.07em] md:col-span-12">
          {formatSlug(slug)}
        </h1>
      </header>
      <div className="grid gap-12 py-16 md:grid-cols-12 md:py-24">
        <p className="eyebrow md:col-span-3">Details pending</p>
        <p className="max-w-xl text-xl leading-relaxed tracking-[-0.02em] md:col-span-6 md:col-start-6">
          Credits, context, original publication details, and verified imagery will be added to this record.
        </p>
      </div>
    </article>
  )
}
