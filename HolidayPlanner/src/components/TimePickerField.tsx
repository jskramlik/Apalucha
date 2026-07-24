import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, PanResponder, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  pointToAngle,
  angleToPoint,
  hourToAngle,
  angleToHour,
  minuteToAngle,
  angleToMinute,
  to24Hour,
  from24Hour,
  parseTime24,
  formatTime24,
} from '../utils/clockDial';

const DIAL_SIZE = 260;
const DIAL_RADIUS = DIAL_SIZE / 2;
const TICK_RADIUS = 90;
const KNOB_SIZE = 44;

const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_LABELS = Array.from({ length: 12 }, (_, i) => i * 5);

interface Props {
  placeholder: string;
  value: string;
  onChange: (time: string) => void;
  style?: StyleProp<ViewStyle>;
}

type Mode = 'hour' | 'minute';

export default function TimePickerField({ placeholder, value, onChange, style }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>('hour');
  const [hour12, setHour12] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const dialRef = useRef<View>(null);
  const dialCenterRef = useRef({ x: 0, y: 0 });

  const open = () => {
    const parsed = parseTime24(value);
    const now = new Date();
    const { hour24, minute: m } = parsed ?? { hour24: now.getHours(), minute: now.getMinutes() };
    const { hour12: h12, period: p } = from24Hour(hour24);
    setHour12(h12);
    setMinute(m);
    setPeriod(p);
    setMode('hour');
    setVisible(true);
  };

  const measureDial = () => {
    dialRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      dialCenterRef.current = { x: pageX + width / 2, y: pageY + height / 2 };
    });
  };

  const applyTouch = (pageX: number, pageY: number) => {
    const { x: cx, y: cy } = dialCenterRef.current;
    const angle = pointToAngle(pageX - cx, pageY - cy);
    if (modeRef.current === 'hour') {
      setHour12(angleToHour(angle));
    } else {
      setMinute(angleToMinute(angle));
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => applyTouch(gestureState.x0, gestureState.y0),
      onPanResponderMove: (_, gestureState) => applyTouch(gestureState.moveX, gestureState.moveY),
      onPanResponderRelease: () => {
        if (modeRef.current === 'hour') setMode('minute');
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const confirm = () => {
    onChange(formatTime24(to24Hour(hour12, period), minute));
    setVisible(false);
  };

  const currentAngle = mode === 'hour' ? hourToAngle(hour12) : minuteToAngle(minute);
  const knobPoint = angleToPoint(currentAngle, TICK_RADIUS);
  const handMidPoint = angleToPoint(currentAngle, TICK_RADIUS / 2);
  const dialLabels = mode === 'hour' ? HOUR_LABELS : MINUTE_LABELS;
  const labelAngleFor = (v: number) => (mode === 'hour' ? hourToAngle(v) : minuteToAngle(v));

  return (
    <>
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderColor: colors.border }, style]}
        onPress={open}
      >
        <Text style={[typography.body, { color: value ? colors.textPrimary : colors.textMuted }]}>{value || placeholder}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.overlay }]} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.surface, borderRadius: radius.xl }]} onPress={() => {}}>
            <View style={styles.readoutRow}>
              <TouchableOpacity onPress={() => setMode('hour')}>
                <Text style={[styles.readoutText, { color: mode === 'hour' ? colors.primary : colors.textPrimary }]}>
                  {String(hour12).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.readoutText, { color: colors.textPrimary }]}>:</Text>
              <TouchableOpacity onPress={() => setMode('minute')}>
                <Text style={[styles.readoutText, { color: mode === 'minute' ? colors.primary : colors.textPrimary }]}>
                  {String(minute).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
              <View style={styles.periodToggle}>
                <TouchableOpacity
                  onPress={() => setPeriod('AM')}
                  style={[styles.periodButton, { borderColor: colors.border }, period === 'AM' && { backgroundColor: colors.primary }]}
                >
                  <Text style={[typography.small, { color: period === 'AM' ? colors.primaryText : colors.textPrimary }]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPeriod('PM')}
                  style={[styles.periodButton, { borderColor: colors.border }, period === 'PM' && { backgroundColor: colors.primary }]}
                >
                  <Text style={[typography.small, { color: period === 'PM' ? colors.primaryText : colors.textPrimary }]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              ref={dialRef}
              onLayout={measureDial}
              {...panResponder.panHandlers}
              style={[styles.dial, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <View style={[styles.centerDot, { backgroundColor: colors.primary }]} />
              {dialLabels.map(v => {
                const { x, y } = angleToPoint(labelAngleFor(v), TICK_RADIUS);
                return (
                  <Text
                    key={v}
                    style={[
                      typography.body,
                      styles.tickLabel,
                      { color: colors.textPrimary, left: DIAL_RADIUS + x - 14, top: DIAL_RADIUS + y - 10 },
                    ]}
                  >
                    {String(v).padStart(2, '0')}
                  </Text>
                );
              })}
              <View
                style={[
                  styles.hand,
                  {
                    backgroundColor: colors.primary,
                    left: DIAL_RADIUS + handMidPoint.x - 1,
                    top: DIAL_RADIUS + handMidPoint.y - TICK_RADIUS / 2,
                    transform: [{ rotate: `${currentAngle}deg` }],
                  },
                ]}
              />
              <View
                style={[
                  styles.knob,
                  {
                    backgroundColor: colors.primary,
                    left: DIAL_RADIUS + knobPoint.x - KNOB_SIZE / 2,
                    top: DIAL_RADIUS + knobPoint.y - KNOB_SIZE / 2,
                  },
                ]}
              >
                <Text style={[typography.small, { color: colors.primaryText }]}>
                  {mode === 'hour' ? String(hour12).padStart(2, '0') : String(minute).padStart(2, '0')}
                </Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={() => setVisible(false)} style={{ padding: spacing.sm }}>
                <Text style={[typography.body, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirm} style={{ padding: spacing.sm }}>
                <Text style={[typography.body, { color: colors.primary, fontWeight: '700' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: { padding: 14, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sheet: { padding: 20, width: 300, alignItems: 'center' },
  readoutRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 4 },
  readoutText: { fontSize: 36, fontWeight: '700' },
  periodToggle: { marginLeft: 12, gap: 4 },
  periodButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  dial: { width: DIAL_SIZE, height: DIAL_SIZE, borderRadius: DIAL_SIZE / 2, borderWidth: StyleSheet.hairlineWidth },
  centerDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, left: DIAL_RADIUS - 3, top: DIAL_RADIUS - 3 },
  tickLabel: { position: 'absolute', width: 28, textAlign: 'center' },
  hand: { position: 'absolute', width: 2, height: TICK_RADIUS },
  knob: { position: 'absolute', width: KNOB_SIZE, height: KNOB_SIZE, borderRadius: KNOB_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 20, width: '100%' },
});
