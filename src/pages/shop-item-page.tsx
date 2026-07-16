import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"

function formatProductName(value: string | undefined) {
  if (!value) return "Uncatalogued piece"
  return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ShopItemPage() {
  const { slug } = useParams<{ slug: string }>()

  return (
    <div className="page-shell py-12 md:py-20">
      <Link to="/shop" className="eyebrow inline-flex items-center gap-2 hover:underline">
        <ArrowLeft className="size-3" /> Back to shop
      </Link>
      <div className="grid gap-10 pt-12 md:grid-cols-12 md:pt-20">
        <div className="relative aspect-[3/4] bg-muted md:col-span-7">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Product image pending
          </span>
        </div>
        <div className="md:col-span-4 md:col-start-9 md:pt-4">
          <p className="eyebrow text-muted-foreground">Archive preview</p>
          <h1 className="mt-5 text-4xl leading-none tracking-[-0.05em] md:text-5xl">{formatProductName(slug)}</h1>
          <div className="mt-10 border-y border-border py-5 text-sm">
            <div className="flex justify-between"><span>Availability</span><span>Not for sale</span></div>
            <div className="mt-3 flex justify-between"><span>Condition</span><span>Pending</span></div>
          </div>
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            Product details, provenance, measurements, condition notes, and purchasing tools will be introduced with the marketplace.
          </p>
          <Button className="mt-10 w-full" disabled>Currently unavailable</Button>
        </div>
      </div>
    </div>
  )
}
