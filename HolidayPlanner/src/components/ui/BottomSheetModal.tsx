import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../theme/ThemeContext';
import { computeSheetHeightBounds, computeDraggedHeight } from '../../utils/bottomSheetHeight';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function BottomSheetModal({ visible, onClose, children, style }: Props) {
  const { colors, radius, isDark } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const bounds = computeSheetHeightBounds(screenHeight);

  // Kept in a ref (updated every render) so the PanResponder's handlers --
  // created once via useRef below -- always see the latest bounds instead of
  // closing over whatever screenHeight happened to be on first mount.
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  const heightAnim = useRef(new Animated.Value(bounds.default)).current;
  const heightRef = useRef(bounds.default);
  const dragStartHeightRef = useRef(bounds.default);

  useEffect(() => {
    if (visible) {
      const { default: defaultHeight } = computeSheetHeightBounds(screenHeight);
      heightAnim.setValue(defaultHeight);
      heightRef.current = defaultHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, screenHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartHeightRef.current = heightRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const { min, max } = boundsRef.current;
        const next = computeDraggedHeight(dragStartHeightRef.current, gestureState.dy, min, max);
        heightAnim.setValue(next);
        heightRef.current = next;
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={[
            styles.sheetOuter,
            { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
            style,
          ]}
        >
          <Animated.View style={[styles.sheetInner, { height: heightAnim }]}>
            <View
              {...panResponder.panHandlers}
              style={[styles.handleTouchArea, { userSelect: 'none' } as any]}
            >
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>
            {children}
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheetOuter: { overflow: 'hidden' },
  sheetInner: { padding: 24 },
  handleTouchArea: { paddingVertical: 12, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2 },
});
