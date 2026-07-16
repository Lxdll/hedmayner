import { useEffect } from "react"
import { Link, NavLink, useLocation } from "react-router-dom"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

export function MobileMenu() {
  const location = useLocation()
  const isOpen = useUIStore((state) => state.isMobileMenuOpen)
  const close = useUIStore((state) => state.closeMobileMenu)

  useEffect(() => {
    close()
  }, [close, location.pathname])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent aria-describedby="mobile-menu-description">
        <SheetTitle asChild>
          <Link to="/" className="pr-16 text-sm font-semibold tracking-[-0.03em]">
            HED MAYNER <span className="font-normal">ARCHIVE</span>
          </Link>
        </SheetTitle>
        <SheetDescription id="mobile-menu-description" className="sr-only">
          Main site navigation
        </SheetDescription>

        <nav className="mt-24 flex flex-1 flex-col" aria-label="Mobile navigation">
          {siteConfig.navigation.map((item, index) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-baseline justify-between border-t border-border py-4 text-[clamp(2rem,10vw,3.5rem)] font-medium leading-none tracking-[-0.06em]",
                  isActive && "italic",
                )
              }
            >
              <span>{item.label}</span>
              <span className="text-[0.625rem] font-normal tracking-[0.16em] text-muted-foreground">
                0{index + 1}
              </span>
            </NavLink>
          ))}
        </nav>

        <p className="max-w-xs border-t border-border pt-4 text-[0.625rem] uppercase leading-relaxed tracking-[0.12em] text-muted-foreground">
          Independent and unofficial archive
        </p>
      </SheetContent>
    </Sheet>
  )
}
