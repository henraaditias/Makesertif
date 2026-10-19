import { useState, type DragEvent } from "react";

export function useFileDrop(onFile: (file: File) => void) {
  const [dragging, setDragging] = useState(false);

  const dropProps = {
    onDragEnter: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setDragging(false);
      }
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
  };

  return { dragging, dropProps };
}
