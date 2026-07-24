export interface SheetHeightBounds {
  min: number;
  max: number;
  default: number;
}

export function computeSheetHeightBounds(screenHeight: number): SheetHeightBounds {
  return {
    min: Math.max(280, screenHeight * 0.3),
    max: screenHeight * 0.94,
    default: screenHeight * 0.88,
  };
}

export function clampSheetHeight(proposed: number, min: number, max: number): number {
  return Math.min(Math.max(proposed, min), max);
}

// Dragging up (finger moves up, dy negative) grows the sheet; dragging down shrinks it.
export function computeDraggedHeight(startHeight: number, dy: number, min: number, max: number): number {
  return clampSheetHeight(startHeight - dy, min, max);
}
