// Imports: Dependencies
import React, { useCallback, useRef, useMemo } from 'react';
import { Animated, ViewStyle } from 'react-native';

// Imports: Helper Functions
import { clamp } from '../helpers/helpers';

// Imports: TypeScript Types
import { TSliderType } from '@jefelewis/unison-types';

/**
 * low and high state variables are fallbacks for props (props are not required).
 * This hook ensures that current low and high are not out of [min, max] range.
 * It returns an object which contains:
 * - ref containing correct low, high, min, max and step to work with.
 * - setLow and setHigh setters
 * @param lowProp
 * @param highProp
 * @param min
 * @param max
 * @param step
 * @returns {{inPropsRef: React.MutableRefObject<{high: (*|number), low: (*|number)}>, setLow: (function(number): undefined), setHigh: (function(number): undefined)}}
 */

// React Hook: Use Low High
export const useLowHigh = (lowProp: number, highProp: number, min: number, max: number, step: number): any => {
  // Valid Low Prop
  const validLowProp: number = lowProp === undefined ? min : clamp(lowProp, min, max);

  // Valid High Prop
  const validHighProp: number = highProp === undefined ? max : clamp(highProp, min, max);

  // Props: Ref
  const inPropsRef = useRef({ low: validLowProp, high: validHighProp });

  // Ref: Props
  const { low: lowState, high: highState } = inPropsRef.current;

  const inPropsRefPrev = { lowPrev: lowState, highPrev: highState };

  // Props have higher priority. If no props are passed, use internal state variables.
  const low: number = clamp(lowProp === undefined ? lowState : lowProp, min, max);
  const high: number = clamp(highProp === undefined ? highState : highProp, min, max);

  // Always update values of refs so pan responder will have updated values
  Object.assign(inPropsRef.current, { low, high, min, max, step });

  // Set Low
  const setLow = (value: number): number => (inPropsRef.current.low = value);

  // Set High
  const setHigh = (value: number): number => (inPropsRef.current.high = value);

  return { inPropsRef, inPropsRefPrev, setLow, setHigh };
};

/**
 * Sets the current value of widthRef and calls the callback with new width parameter.
 * @param widthRef
 * @param callback
 * @returns {function({nativeEvent: *}): void}
 */

// React Hook: Use Width Layout
export const useWidthLayout = (widthRef: any, callback: any) => {
  return useCallback(
    ({ nativeEvent }) => {
      const {
        layout: { width },
      } = nativeEvent;

      // Ref: Width
      const { current: w } = widthRef;

      if (w !== width) {
        widthRef.current = width;

        if (callback) {
          callback(width);
        }
      }
    },
    [callback, widthRef],
  );
};

// React Hook: Use Selected Rail
export const useSelectedRail = (inPropsRef: any, containerWidthRef: any, thumbWidth: number, type: TSliderType): [any, () => void] => {
  // React Hooks: Refs
  const { current: left } = useRef<Animated.Value>(new Animated.Value(0));
  const { current: right } = useRef<Animated.Value>(new Animated.Value(0));

  // Update
  const update = useCallback(() => {
    // Ref: Props
    const { low, high, min, max } = inPropsRef.current;

    // Container Width
    const { current: containerWidth } = containerWidthRef;

    // Full Scale
    const fullScale: number = (max - min) / (containerWidth - thumbWidth);

    // Let Value
    const leftValue: number = (low - min) / fullScale;

    // Right Value
    const rightValue: number = (max - high) / fullScale;

    // Ref: Set Value (Left)
    left.setValue(type === 'Single' ? 0 : leftValue);

    // Ref: Set Value (Right)
    right.setValue(type === 'Single' ? containerWidth - thumbWidth - leftValue : rightValue);
  }, [inPropsRef, containerWidthRef, type, thumbWidth, left, right]);

  // Styles
  const styles = useMemo(
    () => ({
      position: 'absolute',
      left: left,
      right: right,
    }),
    [left, right],
  );

  return [styles, update];
};
