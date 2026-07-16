import { Link } from "react-router-dom"

import { siteConfig } from "@/config/site"

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-[var(--site-width)] gap-12 px-site py-12 md:grid-cols-12 md:py-16">
        <div className="md:col-span-5">
          <Link to="/" className="text-sm font-semibold tracking-[-0.03em]">
            {siteConfig.name}
          </Link>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
            {siteConfig.disclaimer}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:col-span-4 md:col-start-9">
          <div>
            <p className="eyebrow">Index</p>
            <ul className="mt-4 space-y-2 text-xs">
              {siteConfig.navigation.map((item) => (
                <li key={item.href}>
                  <Link className="underline-offset-4 hover:underline" to={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Information</p>
            <p className="mt-4 text-xs leading-relaxed">Established online<br />2026 — ongoing</p>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-border pt-4 text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground md:col-span-12">
          <span>For study and appreciation</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
