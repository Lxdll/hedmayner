export const siteConfig = {
  name: "HED MAYNER ARCHIVE",
  shortName: "HMA",
  description:
    "An independent record of collections, cultural appearances, and pre-owned Hed Mayner pieces.",
  navigation: [
    { label: "Collections", href: "/collections" },
    { label: "Seen", href: "/seen" },
    { label: "Shop", href: "/shop" },
    { label: "About", href: "/about" },
  ],
  disclaimer:
    "An unofficial, independent archive created by admirers of the work. Not affiliated with Hed Mayner or its representatives.",
} as const

export type NavigationItem = (typeof siteConfig.navigation)[number]
