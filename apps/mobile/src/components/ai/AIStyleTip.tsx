import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const TIPS = [
  "Wear your most expensive item with your cheapest — that's quiet luxury.",
  "The 33% rule: if you haven't worn it in 6 months, it's wardrobe debt.",
  "Confidence adds 40% to any outfit. Wear what you feel powerful in.",
  "Neutral foundations. Statement accessories. That's the formula.",
  "Cost-per-wear: a $500 shoe worn 100 times costs $5. Buy quality.",
  "Your wardrobe is 80% filler. Your core 20% does all the work.",
  "Fit is everything. A $30 shirt tailored beats a $300 shirt off-the-rack.",
];

export function AIStyleTip() {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const fadeAnim = new Animated.Value(1);

  const rotateTip = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(212,175,55,0.06)', 'transparent']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.aiIcon}>✦</Text>
        <Text style={styles.label}>AI STYLE INTELLIGENCE</Text>
      </View>
      <Animated.Text style={[styles.tip, { opacity: fadeAnim }]} onPress={rotateTip}>
        "{TIPS[tipIndex]}"
      </Animated.Text>
      <Text style={styles.tapHint}>Tap to rotate tip</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.lg,
    overflow: 'hidden',
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiIcon: { color: Colors.gold.primary, fontSize: 14 },
  label: { ...Typography.luxe, color: Colors.text.tertiary },
  tip: { ...Typography.h4, color: Colors.text.primary, lineHeight: 24, fontStyle: 'italic' },
  tapHint: { ...Typography.body3, color: Colors.text.tertiary },
});
