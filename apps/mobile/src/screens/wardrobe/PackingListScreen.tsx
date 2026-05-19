import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLazyQuery, gql } from '@apollo/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const PACKING_LIST = gql`
  query PackingList($destination: String!, $durationDays: Int!, $occasions: [String!]!) {
    packingList(destination: $destination, durationDays: $durationDays, occasions: $occasions) {
      destination
      durationDays
      totalPieces
      outfitCount
      dayByDayPlan { day occasion items notes }
      capsuleCore { itemId name reason }
      packingTips
      weatherNote
    }
  }
`;

const OCCASION_OPTIONS = [
  'Business', 'Casual', 'Formal', 'Beach', 'Outdoor', 'Nightlife', 'Sport',
];

export default function PackingListScreen() {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('7');
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(['Casual']);

  const [generatePacking, { data, loading }] = useLazyQuery(PACKING_LIST);
  const packingList = data?.packingList;

  const toggleOccasion = (occ: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  };

  const handleGenerate = async () => {
    if (!destination || !days) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generatePacking({
      variables: {
        destination,
        durationDays: parseInt(days),
        occasions: selectedOccasions,
      },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0B', '#111113']} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Smart Packing</Text>
          <Text style={styles.subtitle}>
            AI builds your capsule from your actual wardrobe. Nothing wasted, nothing missing.
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Where are you going? (e.g. Tokyo, Amalfi Coast)"
          placeholderTextColor={Colors.text.tertiary}
          value={destination}
          onChangeText={setDestination}
        />

        <TextInput
          style={styles.input}
          placeholder="How many days?"
          placeholderTextColor={Colors.text.tertiary}
          value={days}
          onChangeText={setDays}
          keyboardType="numeric"
        />

        <Text style={styles.sectionLabel}>OCCASIONS</Text>
        <View style={styles.occasionRow}>
          {OCCASION_OPTIONS.map((occ) => (
            <TouchableOpacity
              key={occ}
              style={[
                styles.occasionChip,
                selectedOccasions.includes(occ) && styles.occasionChipActive,
              ]}
              onPress={() => toggleOccasion(occ)}
            >
              <Text
                style={[
                  styles.occasionText,
                  selectedOccasions.includes(occ) && styles.occasionTextActive,
                ]}
              >
                {occ}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
          <LinearGradient
            colors={['#D4AF37', '#B8962E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateBtnGrad}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.generateBtnText}>Build My Packing List ✦</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {packingList && (
          <>
            {/* Summary */}
            <View style={styles.summaryRow}>
              <BlurView intensity={15} tint="dark" style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{packingList.totalPieces}</Text>
                <Text style={styles.summaryLabel}>Pieces</Text>
              </BlurView>
              <BlurView intensity={15} tint="dark" style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{packingList.outfitCount}</Text>
                <Text style={styles.summaryLabel}>Outfits</Text>
              </BlurView>
              <BlurView intensity={15} tint="dark" style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{packingList.durationDays}</Text>
                <Text style={styles.summaryLabel}>Days</Text>
              </BlurView>
            </View>

            {packingList.weatherNote && (
              <View style={styles.weatherCard}>
                <Text style={styles.weatherIcon}>🌡</Text>
                <Text style={styles.weatherText}>{packingList.weatherNote}</Text>
              </View>
            )}

            {/* Capsule Core */}
            <Text style={styles.sectionLabel}>CAPSULE CORE</Text>
            <Text style={styles.sectionSubtitle}>
              These {packingList.capsuleCore?.length || 0} pieces do the heavy lifting.
            </Text>
            {(packingList.capsuleCore || []).map((item: any, i: number) => (
              <BlurView key={i} intensity={10} tint="dark" style={styles.coreItem}>
                <Text style={styles.coreItemName}>{item.name}</Text>
                <Text style={styles.coreItemReason}>{item.reason}</Text>
              </BlurView>
            ))}

            {/* Day by Day */}
            <Text style={styles.sectionLabel}>DAY BY DAY</Text>
            {(packingList.dayByDayPlan || []).map((day: any, i: number) => (
              <BlurView key={i} intensity={10} tint="dark" style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayNumber}>Day {day.day}</Text>
                  <Text style={styles.dayOccasion}>{day.occasion}</Text>
                </View>
                <View style={styles.dayItems}>
                  {(day.items || []).map((item: string, j: number) => (
                    <View key={j} style={styles.dayItem}>
                      <Text style={styles.dayItemDot}>·</Text>
                      <Text style={styles.dayItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
                {day.notes && <Text style={styles.dayNotes}>{day.notes}</Text>}
              </BlurView>
            ))}

            {/* Packing Tips */}
            <Text style={styles.sectionLabel}>PACKING TIPS</Text>
            {(packingList.packingTips || []).map((tip: string, i: number) => (
              <View key={i} style={styles.tip}>
                <Text style={styles.tipDot}>✦</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { padding: Spacing[5], paddingTop: 60 },
  header: { marginBottom: Spacing[6] },
  title: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing[2] },
  subtitle: { ...Typography.body2, color: Colors.text.tertiary, lineHeight: 22 },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing[4],
    color: Colors.text.primary,
    ...Typography.body2,
    marginBottom: Spacing[3],
  },
  sectionLabel: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: Spacing[3],
    marginTop: Spacing[4],
  },
  sectionSubtitle: { ...Typography.body3, color: Colors.text.tertiary, marginBottom: Spacing[3] },
  occasionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[5] },
  occasionChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.secondary,
  },
  occasionChipActive: { backgroundColor: Colors.gold.primary, borderColor: Colors.gold.primary },
  occasionText: { ...Typography.body3, color: Colors.text.secondary },
  occasionTextActive: { color: '#000', fontWeight: '600' },
  generateBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing[6] },
  generateBtnGrad: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: { ...Typography.label, color: '#000' },
  summaryRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[5] },
  summaryCard: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[4],
    alignItems: 'center',
  },
  summaryValue: { fontSize: 32, fontWeight: '700', color: Colors.text.primary },
  summaryLabel: { ...Typography.body3, color: Colors.text.tertiary },
  weatherCard: {
    flexDirection: 'row',
    gap: Spacing[3],
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    alignItems: 'flex-start',
  },
  weatherIcon: { fontSize: 20 },
  weatherText: { ...Typography.body2, color: Colors.text.secondary, flex: 1, lineHeight: 22 },
  coreItem: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  coreItemName: { ...Typography.label, color: Colors.text.primary, marginBottom: 4 },
  coreItemReason: { ...Typography.body3, color: Colors.text.tertiary },
  dayCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  dayNumber: { ...Typography.label, color: Colors.text.primary },
  dayOccasion: { ...Typography.body3, color: Colors.gold.primary },
  dayItems: {},
  dayItem: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[1] },
  dayItemDot: { color: Colors.text.tertiary },
  dayItemText: { ...Typography.body3, color: Colors.text.secondary, flex: 1 },
  dayNotes: { ...Typography.body3, color: Colors.text.tertiary, marginTop: Spacing[2], fontStyle: 'italic' },
  tip: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3] },
  tipDot: { color: Colors.gold.primary },
  tipText: { ...Typography.body2, color: Colors.text.secondary, flex: 1, lineHeight: 22 },
});
