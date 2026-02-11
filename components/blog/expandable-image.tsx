"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ExpandableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  caption?: string;
}

export function ExpandableImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  caption,
}: ExpandableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label={`Expand image: ${alt || "blog image"}`}
        className="group relative block w-full cursor-zoom-in"
        onClick={() => setIsOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          priority={priority}
        />
      </button>

      {caption && (
        <figcaption className="mt-2 text-sm italic text-center text-gray-500">{caption}</figcaption>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Expanded image"}
          className="fixed inset-0 z-[100] bg-black/90 p-4 sm:p-8"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex h-full w-full items-center justify-center">
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="max-h-[92vh] w-auto max-w-[96vw] rounded-md object-contain"
              onClick={(e) => e.stopPropagation()}
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
