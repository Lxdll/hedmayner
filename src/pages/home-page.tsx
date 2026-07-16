import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

const archiveSections = [
  {
    index: "01",
    title: "Collections",
    description: "Season-by-season runway research, silhouettes, and collection notes.",
    href: "/collections",
  },
  {
    index: "02",
    title: "Seen",
    description: "Documenting the work in editorials, performance, film, and daily life.",
    href: "/seen",
  },
  {
    index: "03",
    title: "Shop",
    description: "A considered edit of pre-owned pieces looking for their next chapter.",
    href: "/shop",
  },
] as const

export function HomePage() {
  return (
    <>
      <section className="page-shell flex min-h-[calc(100svh-5rem)] flex-col justify-between py-8 md:min-h-[calc(100svh-6rem)] md:py-12">
        <div className="flex items-start justify-between gap-6">
          <p className="eyebrow max-w-48">Independent fashion archive<br />Tel Aviv — Paris</p>
          <p className="eyebrow text-right">Issue No. 001<br />2026</p>
        </div>

        <div className="py-20">
          <h1 className="display-title">
            HED MAYNER
            <span className="block text-right font-normal italic">Archive</span>
          </h1>
        </div>

        <div className="grid gap-8 border-t border-border pt-4 md:grid-cols-12">
          <p className="text-xs uppercase tracking-[0.12em] md:col-span-3">Collections / Seen / Shop</p>
          <p className="max-w-xl text-lg leading-snug tracking-[-0.025em] md:col-span-5 md:col-start-7 md:text-2xl">
            A living index devoted to proportion, gesture, and the radical possibilities of dress.
          </p>
          <ArrowDownRight className="hidden size-6 justify-self-end md:col-span-1 md:block" aria-hidden="true" />
        </div>
      </section>

      <section className="border-y border-border bg-foreground text-background">
        <div className="page-shell py-20 md:py-32">
          <div className="grid gap-10 md:grid-cols-12">
            <p className="eyebrow md:col-span-3">The archive</p>
            <p className="text-[clamp(2rem,5vw,5rem)] leading-[0.95] tracking-[-0.055em] md:col-span-8">
              Clothes occupy space. This archive studies the space around them.
            </p>
          </div>
        </div>
      </section>

      <section className="page-shell py-20 md:py-32">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="eyebrow">Explore</p>
            <h2 className="mt-4 text-3xl tracking-[-0.045em] md:text-5xl">Three ways in</h2>
          </div>
          <span className="hidden text-xs text-muted-foreground md:block">Updated irregularly</span>
        </div>

        <div className="border-b border-border">
          {archiveSections.map((section) => (
            <Link
              key={section.href}
              to={section.href}
              className="group grid gap-4 border-t border-border py-6 transition-colors hover:bg-muted md:grid-cols-12 md:items-center md:px-4 md:py-10"
            >
              <span className="eyebrow md:col-span-1">{section.index}</span>
              <h3 className="text-4xl tracking-[-0.05em] md:col-span-4 md:text-6xl">{section.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:col-span-4 md:col-start-7">
                {section.description}
              </p>
              <ArrowUpRight className="size-5 md:col-span-1 md:justify-self-end" aria-hidden="true" />
            </Link>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <Button asChild variant="outline">
            <Link to="/about">Read about the project</Link>
          </Button>
        </div>
      </section>
    </>
  )
}
