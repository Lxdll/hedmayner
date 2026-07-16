export type CollectionCatalogItem = {
  year: string
  season: string
  title: string
  slug: string
}

export const collectionCatalog: readonly CollectionCatalogItem[] = [
  { year: "2026", season: "Fall / Winter", title: "Fall Winter 2026", slug: "fall-winter-2026" },
  { year: "2026", season: "Spring / Summer", title: "Spring Summer 2026", slug: "spring-summer-2026" },
  { year: "2025", season: "Fall / Winter", title: "Fall Winter 2025", slug: "fall-winter-2025" },
  { year: "2025", season: "Spring / Summer", title: "Spring Summer 2025", slug: "spring-summer-2025" },
  { year: "2024", season: "Fall / Winter", title: "Fall Winter 2024", slug: "fall-winter-2024" },
  { year: "2024", season: "Spring / Summer", title: "Spring Summer 2024", slug: "spring-summer-2024" },
  { year: "2023", season: "Fall / Winter", title: "Fall Winter 2023", slug: "fall-winter-2023" },
  { year: "2023", season: "Spring / Summer", title: "Spring Summer 2023", slug: "spring-summer-2023" },
  { year: "2022", season: "Fall / Winter", title: "Fall Winter 2022", slug: "fall-winter-2022" },
  { year: "2022", season: "Spring / Summer", title: "Spring Summer 2022", slug: "spring-summer-2022" },
] as const

export function getCollectionBySlug(slug: string | undefined) {
  return collectionCatalog.find((collection) => collection.slug === slug)
}
