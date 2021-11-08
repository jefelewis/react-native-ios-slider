// Is Low Closer
export const isLowCloser = (downX: number, lowPosition: number, highPosition: number): boolean => {
  // Positions Are Equal
  if (lowPosition === highPosition) {
    return downX < lowPosition;
  }
  // Positions Are Different
  else {
    // Distance From Low
    const distanceFromLow: number = Math.abs(downX - lowPosition);

    // Distance From High
    const distanceFromHigh: number = Math.abs(downX - highPosition);

    return distanceFromLow < distanceFromHigh;
  }
};

// Clamp
export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

// Get Value For Position
export const getValueForPosition = (
  positionInView: number,
  containerWidth: number,
  thumbWidth: number,
  min: number,
  max: number,
  step: number,
): number => {
  // Available Space
  const availableSpace: number = containerWidth - thumbWidth;

  // TODO (Rel? Step Unit)
  const relStepUnit: number = step / (max - min);

  // TODO (Rel? Position)
  let relPosition: number = (positionInView - thumbWidth / 2) / availableSpace;

  // TODO (Rel? Offset)
  const relOffset: number = relPosition % relStepUnit;

  // TODO (Decrement?)
  relPosition -= relOffset;

  // TODO (WHAT???)
  if (relOffset / relStepUnit >= 0.5) {
    // TODO (Increment?)
    relPosition += relStepUnit;
  }

  return clamp(min + Math.round(relPosition / relStepUnit) * step, min, max);
};
