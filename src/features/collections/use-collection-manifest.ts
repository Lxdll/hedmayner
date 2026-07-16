import { useQuery } from "@tanstack/react-query"

import {
  collectionManifestSchema,
  type CollectionManifest,
} from "@/features/collections/collection-manifest"

async function fetchCollectionManifest(slug: string): Promise<CollectionManifest | null> {
  const response = await fetch(`/media/collections/${slug}/manifest.json`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Collection manifest request failed with status ${response.status}`)
  }

  return collectionManifestSchema.parse(await response.json())
}

export function useCollectionManifest(slug: string | undefined) {
  return useQuery({
    queryKey: ["collection-manifest", slug],
    queryFn: () => fetchCollectionManifest(slug ?? ""),
    enabled: Boolean(slug),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  })
}
