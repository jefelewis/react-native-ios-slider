// Imports: Dependencies
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Animated, Dimensions, PanResponder, PanResponderGestureState, StyleSheet, View } from 'react-native';

// Imports: React Hooks
import { useLowHigh, useWidthLayout, useSelectedRail } from './hooks/hooks';

// Imports: Helper Functions
import { clamp, getValueForPosition, isLowCloser } from './helpers/helpers';

// Imports: Styles
import { defaultStyles } from '../../styles/styles';

// Imports: TypeScript Types
import { TSliderType } from '@jefelewis/unison-types';

// TypeScript Type: Props
interface IProps {
  type: TSliderType;
  min: number;
  max: number;
  step: number;
  onChange: (low: number, high: number) => void;
  minRange?: number;
  disabled?: boolean;
  darkMode?: boolean;
}

// TypeScript Type: Gesture State Ref
interface IGestureStateRef {
  isLow: boolean;
  lastValue: number;
  lastPosition: number;
}

// React Native: Screen Dimensions
const { width } = Dimensions.get('window');

// Component: Slider
export const Slider = ({ type, min, max, step, onChange, minRange = 0, disabled = false, darkMode = false }: IProps): JSX.Element => {
  // React Hooks: State
  const [thumbWidth, setThumbWidth] = useState<number>(0);

  // TODO TODO TODO (SET STATE + FIX OVERLAP WITH NAMES)
  const [lowProp, setLowProp] = useState<number>(min);
  const [highProp, setHighProp] = useState<number>(max);

  // React Hooks: Refs
  const lowThumbXRef = useRef<Animated.Value>(new Animated.Value(0));
  const highThumbXRef = useRef<Animated.Value>(new Animated.Value(0));
  const pointerX = useRef<Animated.Value>(new Animated.Value(0)).current;
  const gestureStateRef = useRef<IGestureStateRef>({ isLow: true, lastValue: 0, lastPosition: 0 });
  const containerWidthRef = useRef<number>(0);

  // React Hooks: Use Low High
  const { inPropsRef, inPropsRefPrev, setLow, setHigh } = useLowHigh(lowProp, type === 'Single' ? max : highProp, min, max, step);

  // React Hooks: Use Selected Rail
  const [selectedRailStyle, updateSelectedRail] = useSelectedRail(inPropsRef, containerWidthRef, thumbWidth, type);

  // Update Thumbs
  const updateThumbs = useCallback(() => {
    // Ref: Container With
    const { current: containerWidth } = containerWidthRef;

    if (!thumbWidth || !containerWidth) {
      return;
    }

    // Ref: Props
    const { low, high } = inPropsRef.current;

    // Slider Type: Range
    if (type === 'Range') {
      // High Position
      const highPosition: number = ((high - min) / (max - min)) * (containerWidth - thumbWidth);

      // Ref: Set Value (High Thumb X)
      highThumbXRef.current.setValue(highPosition);
    }

    // Low Position
    const lowPosition: number = ((low - min) / (max - min)) * (containerWidth - thumbWidth);

    // Ref: Set Value (Low Thumb X)
    lowThumbXRef.current.setValue(lowPosition);

    // Update Selected Rail
    updateSelectedRail();

    // Props: On Change
    onChange?.(low, high);
  }, [type, inPropsRef, max, min, onChange, thumbWidth, updateSelectedRail]);

  // React Hooks: Lifecycle Methods
  useEffect(() => {
    // TODO (WHAT?)
    if ((lowProp !== undefined && lowProp !== inPropsRefPrev.lowPrev) || (highProp !== undefined && highProp !== inPropsRefPrev.highPrev)) {
      // Update Thumbs
      updateThumbs();
    }
  }, [highProp, inPropsRefPrev.lowPrev, inPropsRefPrev.highPrev, lowProp, inPropsRefPrev, updateThumbs]);

  useEffect(() => {
    // Update Thumbs
    updateThumbs();
  }, [updateThumbs]);

  // Handle Container Layout
  const handleContainerLayout = useWidthLayout(containerWidthRef, updateThumbs);

  // Handle Thumb Layout
  const handleThumbLayout = useCallback(
    ({ nativeEvent }) => {
      const {
        layout: { width: newWidth },
      } = nativeEvent;

      if (thumbWidth !== newWidth) {
        setThumbWidth(newWidth);
      }
    },
    [thumbWidth],
  );
  // React Native: Pan Handlers
  const { panHandlers } = useMemo(
    () =>
      // React Native: Pan Responder
      PanResponder.create({
        // On Start Should Set Pan Responder
        onStartShouldSetPanResponder: (): boolean => true,
        // On Start Should Set Pan Responder Capture
        onStartShouldSetPanResponderCapture: (): boolean => true,
        // On Move Should Set Pan Responder
        onMoveShouldSetPanResponder: (): boolean => true,
        // On Move Should Set Pan Responder Capture
        onMoveShouldSetPanResponderCapture: (): boolean => true,
        // On Pan Responder Termination Request
        onPanResponderTerminationRequest: (): boolean => true,
        // On Pan Responder Terminate
        onPanResponderTerminate: (): boolean => true,
        // On Should Block Native Responder
        onShouldBlockNativeResponder: (): boolean => true,
        // On Pan Responder Grant
        onPanResponderGrant: ({ nativeEvent }, gestureState: PanResponderGestureState): void => {
          // TODO (WHAT?) (REFACTOR WITH !disabled)
          if (disabled) {
            return;
          }

          // Gesture State: Number Of Active Touches (Currently On Screen)
          const { numberActiveTouches } = gestureState;

          if (numberActiveTouches > 1) {
            return;
          }

          // TODO (WHAT?)
          const { locationX: downX, pageX } = nativeEvent;

          // Container X
          const containerX: number = pageX - downX;

          // TODO (WHAT?)
          const { low, high, min, max } = inPropsRef.current;

          // Container Width
          const containerWidth: number = containerWidthRef.current;

          // Low Position
          const lowPosition: number = thumbWidth / 2 + ((low - min) / (max - min)) * (containerWidth - thumbWidth);

          // High Position
          const highPosition: number = thumbWidth / 2 + ((high - min) / (max - min)) * (containerWidth - thumbWidth);

          // Is Low
          const isLow: boolean = type === 'Single' || isLowCloser(downX, lowPosition, highPosition);

          // TODO (WHAT?)
          gestureStateRef.current.isLow = isLow;

          // Handle Position Change
          const handlePositionChange = (positionInView: number): void => {
            // TODO (WHAT?)
            const { low, high, min, max, step } = inPropsRef.current;

            // Min Value
            const minValue: number = isLow ? min : low + minRange;

            // Max Value
            const maxValue: number = isLow ? high - minRange : max;

            // Value
            const value: number = clamp(getValueForPosition(positionInView, containerWidth, thumbWidth, min, max, step), minValue, maxValue);

            // TODO (WHAT?)
            if (gestureStateRef.current.lastValue === value) {
              return;
            }

            // Available Space
            const availableSpace: number = containerWidth - thumbWidth;

            // Absolute Position
            const absolutePosition: number = ((value - min) / (max - min)) * availableSpace;

            // Ref: Last Value (Gesture State)
            gestureStateRef.current.lastValue = value;

            // Ref: Last Position (Gesture State)
            gestureStateRef.current.lastPosition = absolutePosition + thumbWidth / 2;

            // Ref: Set Value (Absolute Position)
            (isLow ? lowThumbXRef.current : highThumbXRef.current).setValue(absolutePosition);

            // Props: On Change
            onChange?.(isLow ? value : low, isLow ? high : value);

            // TODO (WHAT?)
            (isLow ? setLow : setHigh)(value);

            // Update Selected Rail
            updateSelectedRail();
          };

          // Handle Position Change
          handlePositionChange(downX);

          // Ref: Remove All Listeners (Pointer X)
          pointerX.removeAllListeners();

          // Ref: Add Listener (Pointer X)
          pointerX.addListener(({ value: pointerPosition }): void => {
            // Position In View
            const positionInView: number = pointerPosition - containerX;

            // Handle Position Change
            handlePositionChange(positionInView);
          });
        },
        // On Pan Responder Move
        onPanResponderMove: disabled ? undefined : Animated.event([null, { moveX: pointerX }], { useNativeDriver: false }),
        // On Pan Responder Release
        onPanResponderRelease: (): void => {
          return;
        },
      }),
    [disabled, pointerX, inPropsRef, thumbWidth, type, minRange, onChange, setLow, setHigh, updateSelectedRail],
  );

  return (
    <View style={{ width: width - 32 }}>
      <View onLayout={handleContainerLayout} style={styles.controlsContainer}>
        <View style={[styles.railsContainer, { marginHorizontal: thumbWidth / 2 }]}>
          <View style={[styles.railContainer, darkMode ? styles.railContainerDark : styles.railContainerLight]} />

          <Animated.View style={selectedRailStyle}>
            <View style={[styles.railSelectedContainer, darkMode ? styles.railSelectedContainerDark : styles.railSelectedContainerLight]} />
          </Animated.View>
        </View>

        <Animated.View style={{ transform: [{ translateX: lowThumbXRef.current }] }} onLayout={handleThumbLayout}>
          <View style={[styles.thumbContainer, darkMode ? styles.thumbContainerDark : styles.thumbContainerLight]} />
        </Animated.View>

        {type === 'Range' && (
          <Animated.View style={[styles.highThumbContainer, { transform: [{ translateX: highThumbXRef.current }] }]}>
            <View style={[styles.thumbContainer, darkMode ? styles.thumbContainerDark : styles.thumbContainerLight]} />
          </Animated.View>
        )}

        <View {...panHandlers} style={styles.touchableArea} collapsible={false} />
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  highThumbContainer: {
    position: 'absolute',
  },
  railsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelFixedContainer: {
    alignItems: 'flex-start',
  },
  labelFloatingContainer: {
    position: 'absolute',
    alignItems: 'flex-start',
    left: 0,
    right: 0,
  },
  touchableArea: {
    ...StyleSheet.absoluteFillObject,
  },
  railContainer: {
    flex: 1,
    height: 2,
    borderRadius: 2,
  },
  railContainerLight: {
    backgroundColor: defaultStyles.colorLightBorder,
  },
  railContainerDark: {
    backgroundColor: defaultStyles.colorDarkBorder,
  },
  railSelectedContainer: {
    height: 2,
    borderRadius: 2,
  },
  railSelectedContainerLight: {
    backgroundColor: defaultStyles.colorLightBlue,
  },
  railSelectedContainerDark: {
    backgroundColor: defaultStyles.colorDarkBlue,
  },
  thumbContainer: {
    height: 30,
    width: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 0.5,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 1,
    shadowOpacity: 0.1,
  },
  thumbContainerLight: {
    borderColor: defaultStyles.colorLightBorder,
  },
  thumbContainerDark: {
    borderColor: defaultStyles.colorDarkBorder,
  },
});
