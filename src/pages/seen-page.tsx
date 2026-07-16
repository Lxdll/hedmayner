import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

const entries = [
  { type: "Editorial", title: "Volume and Movement", publication: "Archive note", slug: "volume-and-movement" },
  { type: "Worn", title: "On Stage", publication: "Appearance index", slug: "on-stage" },
  { type: "Street", title: "Outside the Show", publication: "Street record", slug: "outside-the-show" },
] as const

export function SeenPage() {
  return (
    <div className="page-shell py-12 md:py-20">
      <header className="grid min-h-[52vh] content-between gap-16 border-b border-border pb-8 md:grid-cols-12">
        <p className="eyebrow md:col-span-3">02 / Cultural index</p>
        <h1 className="display-title md:col-span-12">Seen</h1>
        <p className="max-w-lg text-xl leading-snug tracking-[-0.025em] md:col-span-5 md:col-start-7 md:text-3xl">
          The clothes, encountered beyond the runway.
        </p>
      </header>

      <section className="grid gap-8 py-16 md:grid-cols-12 md:py-24">
        <p className="eyebrow md:col-span-3">Recent records</p>
        <div className="border-b border-border md:col-span-9">
          {entries.map((entry, index) => (
            <Link key={entry.slug} to={`/seen/${entry.slug}`} className="group block border-t border-border py-6 md:py-8">
              <div className="mb-12 flex justify-between text-[0.625rem] uppercase tracking-[0.14em] text-muted-foreground">
                <span>{entry.type}</span>
                <span>0{index + 1}</span>
              </div>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl tracking-[-0.045em] md:text-5xl">{entry.title}</h2>
                  <p className="mt-2 text-xs text-muted-foreground">{entry.publication}</p>
                </div>
                <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
