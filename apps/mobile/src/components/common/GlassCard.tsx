import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Shadows } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  variant?: 'dark' | 'light' | 'gold';
}

export function GlassCard({ children, style, intensity = 20, variant = 'dark' }: Props) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.overlay, variant === 'gold' && styles.goldOverlay]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  goldOverlay: {
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  content: {
    zIndex: 1,
  },
});
