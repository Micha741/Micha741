import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';

import { useStyles } from '../lib/settings';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vždy viditelný obsah pod úchytem (např. spoušť). */
  peek: ReactNode;
  title: string;
  children: ReactNode;
  bottomInset: number;
};

/**
 * Spodní zasouvací lišta: úchyt + stálá část (peek); po vytažení nahoru
 * (tažením nebo klepnutím na úchyt) se ukáže obsah s nastavením.
 */
export default function BottomSheet({ open, onOpenChange, peek, title, children, bottomInset }: Props) {
  const [contentHeight, setContentHeight] = useState(0);
  const anim = useRef(new Animated.Value(0)).current; // 0 = zavřeno, 1 = otevřeno
  const dragStart = useRef(0);

  useEffect(() => {
    Animated.spring(anim, { toValue: open ? 1 : 0, useNativeDriver: false, bounciness: 0, speed: 18 }).start();
  }, [open, anim]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        anim.stopAnimation((v) => (dragStart.current = v));
      },
      onPanResponderMove: (_, g) => {
        const h = Math.max(1, contentHeightRef.current);
        anim.setValue(Math.min(1, Math.max(0, dragStart.current - g.dy / h)));
      },
      onPanResponderRelease: (_, g) => {
        const h = Math.max(1, contentHeightRef.current);
        const value = dragStart.current - g.dy / h;
        const next = g.vy < -0.3 ? true : g.vy > 0.3 ? false : value > 0.5;
        onOpenChangeRef.current(next);
        Animated.spring(anim, { toValue: next ? 1 : 0, useNativeDriver: false, bounciness: 0, speed: 18 }).start();
      },
    })
  ).current;

  const contentHeightRef = useRef(0);
  contentHeightRef.current = contentHeight;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const styles = useStyles((c) => ({
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderTopWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    handleArea: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
    handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: c.textMuted, opacity: 0.6 },
    handleText: { color: c.textMuted, fontSize: 11, marginTop: 4 },
    content: { maxHeight: 360 },
    measure: { position: 'absolute', left: 0, right: 0, opacity: 0 },
  }));

  const height = anim.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] });

  return (
    <View style={styles.sheet}>
      <Pressable {...pan.panHandlers} onPress={() => onOpenChange(!open)} style={styles.handleArea} hitSlop={8}>
        <View style={styles.handle} />
        <Text style={styles.handleText}>{open ? `▾ ${title}` : `▴ ${title}`}</Text>
      </Pressable>
      <Animated.View style={{ height, overflow: 'hidden' }}>
        <ScrollView style={styles.content} nestedScrollEnabled>
          {children}
        </ScrollView>
      </Animated.View>
      {/* Neviditelná kopie obsahu pro změření výšky */}
      <View
        pointerEvents="none"
        style={styles.measure}
        onLayout={(e) => setContentHeight(Math.min(360, e.nativeEvent.layout.height))}
      >
        {children}
      </View>
      <View style={{ paddingBottom: bottomInset }}>{peek}</View>
    </View>
  );
}
