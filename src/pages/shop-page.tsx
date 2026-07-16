import { Link } from "react-router-dom"

const pieces = [
  { name: "Oversized Wool Coat", season: "Archive placeholder", price: "—", slug: "oversized-wool-coat", tone: "bg-[#d8d6d1]" },
  { name: "Pleated Volume Trouser", season: "Archive placeholder", price: "—", slug: "pleated-volume-trouser", tone: "bg-[#b8b5af]" },
  { name: "Layered Cotton Shirt", season: "Archive placeholder", price: "—", slug: "layered-cotton-shirt", tone: "bg-[#e7e5e0]" },
] as const

export function ShopPage() {
  return (
    <div className="page-shell py-12 md:py-20">
      <header className="grid min-h-[44vh] content-between gap-16 border-b border-border pb-8 md:grid-cols-12">
        <p className="eyebrow md:col-span-3">03 / Pre-owned edit</p>
        <h1 className="display-title md:col-span-12">Shop</h1>
        <div className="md:col-span-4 md:col-start-9">
          <p className="text-sm leading-relaxed text-muted-foreground">
            A future marketplace for authenticated, pre-owned pieces. No items are currently available for purchase.
          </p>
        </div>
      </header>

      <section className="py-12 md:py-20">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-3">
          <p className="eyebrow">Preview index</p>
          <p className="eyebrow text-muted-foreground">3 references</p>
        </div>
        <div className="grid gap-x-5 gap-y-14 md:grid-cols-3">
          {pieces.map((piece, index) => (
            <Link key={piece.slug} to={`/shop/${piece.slug}`} className="group">
              <div className={`aspect-[3/4] ${piece.tone} relative overflow-hidden`}>
                <span className="absolute left-4 top-4 text-[0.625rem] uppercase tracking-[0.14em]">Sample 0{index + 1}</span>
                <span className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-[-90deg] whitespace-nowrap text-xs uppercase tracking-[0.3em] text-black/40">
                  Image pending
                </span>
              </div>
              <div className="mt-4 flex justify-between gap-4 border-t border-border pt-3">
                <div>
                  <h2 className="text-sm">{piece.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{piece.season}</p>
                </div>
                <span className="text-sm">{piece.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
