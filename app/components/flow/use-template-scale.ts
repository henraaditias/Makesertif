import { useEffect, useRef, useState } from "react";

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
