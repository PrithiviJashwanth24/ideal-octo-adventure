import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const CARD_WIDTH = Dimensions.get('window').width * 0.62;

interface Props {
  outfit: any;
  label: string;
  onPress: () => void;
}

export function OutfitRecommendationCard({ outfit, label, onPress }: Props) {
  const items = outfit.items?.slice(0, 4) || [];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      {/* Item thumbnails grid */}
      <View style={styles.imageGrid}>
        {items.length > 0 ? (
          items.map((item: any, i: number) => (
            <Image
              key={item.id}
              source={{ uri: item.thumbnailUrl || item.images?.[0]?.url }}
              style={[styles.itemThumb, items.length === 1 && styles.itemThumbFull]}
              contentFit="cover"
            />
          ))
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>✦</Text>
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />
      </View>

      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={styles.typeLabel}>{label}</Text>
        {outfit.name && <Text style={styles.outfitName} numberOfLines={1}>{outfit.name}</Text>}
        {outfit.aiRationale && (
          <Text style={styles.rationale} numberOfLines={2}>{outfit.aiRationale}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  imageGrid: {
    height: CARD_WIDTH * 1.2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    position: 'relative',
  },
  itemThumb: {
    width: '50%',
    height: '50%',
  },
  itemThumbFull: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.tertiary,
  },
  placeholderText: { fontSize: 40, color: Colors.gold.primary },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  labelContainer: { padding: Spacing.md, gap: 4 },
  typeLabel: { ...Typography.luxe, color: Colors.gold.primary },
  outfitName: { ...Typography.h4, color: Colors.text.primary },
  rationale: { ...Typography.body3, color: Colors.text.secondary, lineHeight: 16 },
});
