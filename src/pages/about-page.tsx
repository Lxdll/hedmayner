import { siteConfig } from "@/config/site"

export function AboutPage() {
  return (
    <div className="page-shell py-12 md:py-20">
      <header className="grid min-h-[46vh] content-between gap-16 border-b border-border pb-8 md:grid-cols-12">
        <p className="eyebrow md:col-span-3">04 / Project notes</p>
        <h1 className="display-title md:col-span-12">About</h1>
      </header>

      <section className="grid gap-12 py-16 md:grid-cols-12 md:py-24">
        <p className="eyebrow md:col-span-3">Purpose</p>
        <div className="space-y-8 md:col-span-6 md:col-start-6">
          <p className="text-2xl leading-snug tracking-[-0.035em] md:text-4xl">
            An independent record built from admiration, research, and a desire to preserve context.
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            The archive brings together collection histories, public appearances, editorial references, and pre-owned garments. It is intended as a non-commercial resource for study until the shop is formally launched.
          </p>
        </div>
      </section>

      <section className="grid gap-12 border-t border-border py-16 md:grid-cols-12 md:py-24">
        <p className="eyebrow md:col-span-3">Independence</p>
        <div className="md:col-span-6 md:col-start-6">
          <p className="text-xl leading-relaxed tracking-[-0.02em]">{siteConfig.disclaimer}</p>
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            All trademarks, names, and future referenced imagery remain the property of their respective owners. Sources and credits should accompany every published record.
          </p>
        </div>
      </section>
    </div>
  )
}
