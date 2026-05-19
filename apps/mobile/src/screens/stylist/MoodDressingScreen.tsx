import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useMutation, useQuery, gql } from '@apollo/client';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const MOOD_OUTFIT = gql`
  query MoodOutfit($mood: String!) {
    moodOutfit(mood: $mood) {
      mood
      itemIds
      colorStrategy
      psychologicalEffect
      rationale
    }
  }
`;

const MOOD_OPTIONS = gql`
  query {
    moodOptions {
      mood
      label
      emoji
      description
    }
  }
`;

export default function MoodDressingScreen() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);

  const { data: moodsData } = useQuery(MOOD_OPTIONS);
  const { refetch, loading } = useQuery(MOOD_OUTFIT, {
    variables: { mood: selectedMood || 'CONFIDENT' },
    skip: true,
  });

  const moods = moodsData?.moodOptions || [];

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setGeneratedOutfit(null);
    await Haptics.selectionAsync();
  };

  const handleGenerate = async () => {
    if (!selectedMood) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { data } = await refetch({ mood: selectedMood });
    setGeneratedOutfit(data?.moodOutfit);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0B', '#111113']} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Dress Your Mood</Text>
          <Text style={styles.subtitle}>
            Clothing shapes psychology. Choose how you want to feel.
          </Text>
        </View>

        <View style={styles.moodGrid}>
          {moods.map((m: any) => (
            <TouchableOpacity
              key={m.mood}
              style={[styles.moodCard, selectedMood === m.mood && styles.moodCardSelected]}
              onPress={() => handleMoodSelect(m.mood)}
              activeOpacity={0.8}
            >
              {selectedMood === m.mood && (
                <LinearGradient
                  colors={['rgba(212,175,55,0.2)', 'rgba(212,175,55,0.05)']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={styles.moodLabel}>{m.label}</Text>
              <Text style={styles.moodDesc}>{m.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedMood && (
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
            <LinearGradient
              colors={['#D4AF37', '#B8962E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateGradient}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.generateText}>Build This Outfit ✦</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {generatedOutfit && (
          <View style={styles.result}>
            <BlurView intensity={20} tint="dark" style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultMood}>
                  {moods.find((m: any) => m.mood === generatedOutfit.mood)?.emoji}{' '}
                  {generatedOutfit.mood}
                </Text>
              </View>

              <View style={styles.insight}>
                <Text style={styles.insightLabel}>COLOR STRATEGY</Text>
                <Text style={styles.insightText}>{generatedOutfit.colorStrategy}</Text>
              </View>

              <View style={styles.insight}>
                <Text style={styles.insightLabel}>PSYCHOLOGICAL EFFECT</Text>
                <Text style={styles.insightText}>{generatedOutfit.psychologicalEffect}</Text>
              </View>

              <View style={styles.insight}>
                <Text style={styles.insightLabel}>STYLING RATIONALE</Text>
                <Text style={styles.insightText}>{generatedOutfit.rationale}</Text>
              </View>

              <View style={styles.itemCount}>
                <Text style={styles.itemCountText}>
                  {generatedOutfit.itemIds.length} items selected from your wardrobe
                </Text>
              </View>
            </BlurView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { padding: Spacing[5], paddingTop: 60 },
  header: { marginBottom: Spacing[6] },
  title: { ...Typography.display3, color: Colors.text.primary, marginBottom: Spacing[2] },
  subtitle: { ...Typography.body2, color: Colors.text.tertiary, lineHeight: 22 },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[6],
  },
  moodCard: {
    width: '47%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing[4],
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
  },
  moodCardSelected: { borderColor: Colors.gold.primary },
  moodEmoji: { fontSize: 28, marginBottom: Spacing[2] },
  moodLabel: { ...Typography.label, color: Colors.text.primary, marginBottom: 4 },
  moodDesc: { ...Typography.body3, color: Colors.text.tertiary },
  generateBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing[6] },
  generateGradient: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateText: { ...Typography.label, color: '#000' },
  result: { marginBottom: Spacing[8] },
  resultCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    overflow: 'hidden',
    padding: Spacing[5],
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[5] },
  resultMood: { ...Typography.h3, color: Colors.gold.primary },
  insight: { marginBottom: Spacing[4] },
  insightLabel: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.gold.muted,
    letterSpacing: 1.5,
    marginBottom: Spacing[2],
  },
  insightText: { ...Typography.body2, color: Colors.text.secondary, lineHeight: 22 },
  itemCount: {
    marginTop: Spacing[4],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  itemCountText: { ...Typography.body3, color: Colors.text.tertiary, textAlign: 'center' },
});
