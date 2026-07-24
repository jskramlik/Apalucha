import {
  computeSheetHeightBounds,
  clampSheetHeight,
  computeDraggedHeight,
  shouldDismissOnRelease,
} from '../bottomSheetHeight';

describe('computeSheetHeightBounds', () => {
  it('derives min/max/default proportionally from screen height', () => {
    expect(computeSheetHeightBounds(1000)).toEqual({ min: 300, max: 940, default: 880 });
  });

  it('floors min at 280 for very short screens', () => {
    const bounds = computeSheetHeightBounds(500);
    expect(bounds.min).toBe(280);
  });
});

describe('clampSheetHeight', () => {
  it('returns the value unchanged when within bounds', () => {
    expect(clampSheetHeight(500, 300, 900)).toBe(500);
  });

  it('clamps to min when below it', () => {
    expect(clampSheetHeight(100, 300, 900)).toBe(300);
  });

  it('clamps to max when above it', () => {
    expect(clampSheetHeight(1200, 300, 900)).toBe(900);
  });

  it('treats the boundary values themselves as within range', () => {
    expect(clampSheetHeight(300, 300, 900)).toBe(300);
    expect(clampSheetHeight(900, 300, 900)).toBe(900);
  });
});

describe('computeDraggedHeight', () => {
  it('grows the sheet when dragging up (negative dy)', () => {
    expect(computeDraggedHeight(500, -100, 300, 900)).toBe(600);
  });

  it('shrinks the sheet when dragging down (positive dy)', () => {
    expect(computeDraggedHeight(500, 100, 300, 900)).toBe(400);
  });

  it('clamps the result to the max bound', () => {
    expect(computeDraggedHeight(850, -200, 300, 900)).toBe(900);
  });

  it('clamps the result to the min bound', () => {
    expect(computeDraggedHeight(350, 200, 300, 900)).toBe(300);
  });
});

describe('shouldDismissOnRelease', () => {
  it('does not dismiss for a small, slow drag', () => {
    expect(shouldDismissOnRelease(20, 0.2)).toBe(false);
  });

  it('dismisses on a large downward drag regardless of speed', () => {
    expect(shouldDismissOnRelease(150, 0.1)).toBe(true);
  });

  it('dismisses on a fast flick regardless of distance', () => {
    expect(shouldDismissOnRelease(10, 2)).toBe(true);
  });

  it('dismisses on a moderate drag combined with a moderate flick', () => {
    expect(shouldDismissOnRelease(70, 0.9)).toBe(true);
  });

  it('does not dismiss on a moderate drag alone without enough speed', () => {
    expect(shouldDismissOnRelease(70, 0.5)).toBe(false);
  });
});
