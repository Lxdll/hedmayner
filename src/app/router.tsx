import { createBrowserRouter } from "react-router-dom"

import { SiteLayout } from "@/components/layout/site-layout"
import { AboutPage } from "@/pages/about-page"
import { CollectionDetailPage } from "@/pages/collection-detail-page"
import { CollectionsPage } from "@/pages/collections-page"
import { HomePage } from "@/pages/home-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { SeenDetailPage } from "@/pages/seen-detail-page"
import { SeenPage } from "@/pages/seen-page"
import { ShopItemPage } from "@/pages/shop-item-page"
import { ShopPage } from "@/pages/shop-page"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "collections", element: <CollectionsPage /> },
      { path: "collections/:season", element: <CollectionDetailPage /> },
      { path: "seen", element: <SeenPage /> },
      { path: "seen/:slug", element: <SeenDetailPage /> },
      { path: "shop", element: <ShopPage /> },
      { path: "shop/:slug", element: <ShopItemPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])
