import * as Dialog from "@radix-ui/react-dialog"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import type { RunwayImage } from "@/features/collections/collection-manifest"

type RunwayLightboxProps = {
  images: RunwayImage[]
  selectedIndex: number | null
  onSelectedIndexChange: (index: number | null) => void
}

function imageSrcSet(image: RunwayImage) {
  return image.sources.map((source) => `${source.src} ${source.width}w`).join(", ")
}

export function RunwayLightbox({ images, selectedIndex, onSelectedIndexChange }: RunwayLightboxProps) {
  const pointerStartX = useRef<number | null>(null)
  const isOpen = selectedIndex !== null
  const currentImage = selectedIndex === null ? undefined : images[selectedIndex]

  const previous = () => {
    if (selectedIndex === null) return
    onSelectedIndexChange(Math.max(0, selectedIndex - 1))
  }

  const next = () => {
    if (selectedIndex === null) return
    onSelectedIndexChange(Math.min(images.length - 1, selectedIndex + 1))
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") previous()
      if (event.key === "ArrowRight") next()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  })

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onSelectedIndexChange(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content className="fixed inset-0 z-50 grid grid-rows-[auto_1fr_auto] bg-background p-site focus:outline-none">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <Dialog.Title className="eyebrow">Runway study</Dialog.Title>
              <Dialog.Description className="mt-1 text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
                Use arrow keys or swipe to navigate
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="outline" size="icon" aria-label="Close image viewer">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          {currentImage ? (
            <div
              className="flex min-h-0 touch-pan-y items-center justify-center py-4 md:py-6"
              onPointerDown={(event) => {
                pointerStartX.current = event.clientX
              }}
              onPointerUp={(event) => {
                if (pointerStartX.current === null) return
                const distance = event.clientX - pointerStartX.current
                pointerStartX.current = null
                if (distance > 50) previous()
                if (distance < -50) next()
              }}
            >
              <img
                src={currentImage.src}
                srcSet={imageSrcSet(currentImage)}
                sizes="100vw"
                alt={currentImage.alt}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-3 items-center border-t border-border pt-3">
            <Button
              variant="ghost"
              className="justify-self-start"
              onClick={previous}
              disabled={selectedIndex === 0}
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Previous
            </Button>
            <span className="eyebrow justify-self-center">
              {selectedIndex === null ? "00" : String(selectedIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </span>
            <Button
              variant="ghost"
              className="justify-self-end"
              onClick={next}
              disabled={selectedIndex === images.length - 1}
            >
              Next <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
