import { useEffect, useRef, useState } from "react";

/**
 * Skala tampilan template: tinggi layer ÷ tinggi piksel asli gambar.
 * Dipakai edit-canvas & result supaya font (px natural) konsisten
 * dengan hasil render PDF (lihat app/lib/pdf.ts).
 * setState hanya di callback ResizeObserver (async), bukan sinkron di effect.
 */
export function useTemplateScale(dep: unknown) {
  const layerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const layer = layerRef.current;
    const img = imgRef.current;
    if (!layer || !img) return;
    const observer = new ResizeObserver(() => {
      const naturalHeight = img.naturalHeight;
      if (naturalHeight > 0) setScale(layer.clientHeight / naturalHeight);
    });
    observer.observe(layer);
    return () => observer.disconnect();
  }, [dep]);

  return { layerRef, imgRef, scale };
}
