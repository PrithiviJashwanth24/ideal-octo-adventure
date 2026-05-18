import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius, Spacing } from '../../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'gold' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function GoldButton({
  title,
  onPress,
  variant = 'gold',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  fullWidth = false,
}: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300 }).start();
  };

  const paddingV = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;
  const paddingH = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  if (variant === 'gold') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isLoading}
          activeOpacity={1}
          style={style}
        >
          <LinearGradient
            colors={['#E8C84A', '#C8A020', '#A07818']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.base,
              { paddingVertical: paddingV, paddingHorizontal: paddingH },
              (disabled || isLoading) && styles.disabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0A0A0B" />
            ) : (
              <Text style={[styles.goldText, { fontSize }]}>{title}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
        activeOpacity={1}
        style={[
          styles.base,
          { paddingVertical: paddingV, paddingHorizontal: paddingH },
          variant === 'outline' && styles.outline,
          variant === 'ghost' && styles.ghost,
          variant === 'danger' && styles.danger,
          (disabled || isLoading) && styles.disabled,
          style,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={variant === 'outline' ? Colors.gold.primary : Colors.text.primary} />
        ) : (
          <Text
            style={[
              styles.text,
              { fontSize },
              variant === 'outline' && { color: Colors.gold.primary },
              variant === 'ghost' && { color: Colors.text.secondary },
              variant === 'danger' && { color: Colors.error },
            ]}
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  goldText: {
    fontWeight: '700',
    color: '#0A0A0B',
    letterSpacing: 0.5,
  },
  text: {
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gold.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  disabled: {
    opacity: 0.4,
  },
});
