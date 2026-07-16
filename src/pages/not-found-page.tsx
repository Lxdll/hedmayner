import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="page-shell flex min-h-[70vh] flex-col justify-between py-12 md:py-20">
      <div className="flex justify-between">
        <p className="eyebrow">Error</p>
        <p className="eyebrow">404</p>
      </div>
      <div>
        <h1 className="display-title">Not found</h1>
        <div className="mt-10 flex flex-col items-start justify-between gap-8 border-t border-border pt-5 md:flex-row md:items-center">
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            This record does not exist, has moved, or has not yet entered the archive.
          </p>
          <Button asChild variant="outline"><Link to="/">Return to index</Link></Button>
        </div>
      </div>
    </div>
  )
}
