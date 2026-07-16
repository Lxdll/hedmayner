import { Menu } from "lucide-react"
import { Link, NavLink } from "react-router-dom"

import { MobileMenu } from "@/components/layout/mobile-menu"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

export function Header() {
  const openMobileMenu = useUIStore((state) => state.openMobileMenu)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95">
      <div className="mx-auto flex h-20 max-w-[var(--site-width)] items-center justify-between px-site md:h-24">
        <Link
          to="/"
          className="max-w-40 text-sm font-semibold leading-[0.95] tracking-[-0.03em] md:max-w-none md:text-base"
          aria-label={`${siteConfig.name} home`}
        >
          HED MAYNER <span className="font-normal">ARCHIVE</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {siteConfig.navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "border-b border-transparent py-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] transition-colors hover:border-foreground",
                  isActive && "border-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={openMobileMenu}
          aria-label="Open menu"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </div>
      <MobileMenu />
    </header>
  )
}
