import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../../components/common/GlassCard';
import { GoldButton } from '../../components/common/GoldButton';
import { WardrobeService } from '../../services/wardrobe/wardrobeService';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { addItem } from '../../store/slices/wardrobeSlice';
import { CATEGORY_LABELS } from '../../constants';
import { API_URL } from '../../constants';

const { width } = Dimensions.get('window');

const CATEGORIES = Object.keys(CATEGORY_LABELS).slice(0, 12);

type Step = 'photos' | 'details' | 'ai-analysis';

export function AddItemScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<Step>('photos');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Item details
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (pct: number) => {
    Animated.spring(progressAnim, { toValue: pct, useNativeDriver: false }).start();
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removePhoto = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const photoUri of photos) {
      // Get presigned URL from backend
      const presignRes = await fetch(
        `${API_URL}/api/upload/presign?contentType=image/jpeg&folder=wardrobe`
      );
      const { uploadUrl, publicUrl } = await presignRes.json();

      const blob = await (await fetch(photoUri)).blob();
      await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleNext = async () => {
    if (step === 'photos') {
      if (photos.length === 0) { Alert.alert('Add at least one photo'); return; }
      setIsUploading(true);
      animateProgress(0.5);
      try {
        const urls = await uploadPhotos();
        setUploadedUrls(urls);
        setStep('details');
        animateProgress(0.7);
      } catch (e) {
        Alert.alert('Upload failed', 'Please try again');
      } finally {
        setIsUploading(false);
      }
    } else if (step === 'details') {
      if (!name || !category) { Alert.alert('Name and category are required'); return; }
      setIsSubmitting(true);
      setStep('ai-analysis');
      setAiAnalyzing(true);
      animateProgress(1);
      try {
        const result = await WardrobeService.addItem({
          name,
          brand: brand || undefined,
          category,
          imageUrls: uploadedUrls,
          purchasePrice: price ? parseFloat(price) : undefined,
          notes: notes || undefined,
        });
        dispatch(addItem(result.addWardrobeItem));
        setTimeout(() => {
          setAiAnalyzing(false);
          nav.goBack();
        }, 3000);
      } catch (e) {
        Alert.alert('Error adding item. Please try again.');
        setStep('details');
        animateProgress(0.7);
        setAiAnalyzing(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADD ITEM</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── STEP 1: Photos ── */}
        {step === 'photos' && (
          <View style={styles.step}>
            <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
            <Text style={styles.stepTitle}>Add Photos</Text>
            <Text style={styles.stepSub}>FitCheck AI will analyze your item for brand, color, fit, and style.</Text>

            {/* Photo Grid */}
            <View style={styles.photoGrid}>
              {photos.map((uri, idx) => (
                <View key={uri} style={styles.photoCell}>
                  <Image source={{ uri }} style={styles.photoThumb} contentFit="cover" />
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(idx)}>
                    <Text style={styles.removePhotoIcon}>✕</Text>
                  </TouchableOpacity>
                  {idx === 0 && <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>MAIN</Text></View>}
                </View>
              ))}
              {photos.length < 5 && (
                <TouchableOpacity style={styles.addPhotoCell} onPress={pickFromLibrary}>
                  <Text style={styles.addPhotoIcon}>+</Text>
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Camera / Library buttons */}
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoActionBtn} onPress={takePhoto}>
                <GlassCard style={styles.photoActionCard}>
                  <View style={styles.photoActionInner}>
                    <Text style={styles.photoActionIcon}>📷</Text>
                    <Text style={styles.photoActionText}>Camera</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoActionBtn} onPress={pickFromLibrary}>
                <GlassCard style={styles.photoActionCard}>
                  <View style={styles.photoActionInner}>
                    <Text style={styles.photoActionIcon}>🖼</Text>
                    <Text style={styles.photoActionText}>Library</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </View>

            <Text style={styles.tipText}>✦ Pro tip: photograph on a flat surface with good lighting for the best AI analysis.</Text>
          </View>
        )}

        {/* ── STEP 2: Details ── */}
        {step === 'details' && (
          <View style={styles.step}>
            <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
            <Text style={styles.stepTitle}>Item Details</Text>
            <Text style={styles.stepSub}>The AI will fill in most fields automatically. Add what you know.</Text>

            {/* Photo preview strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
              {photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photoStripThumb} contentFit="cover" />
              ))}
            </ScrollView>

            {/* Form */}
            <View style={styles.form}>
              <FormField label="ITEM NAME *" value={name} onChange={setName} placeholder="e.g. Navy Oxford Shirt" />
              <FormField label="BRAND" value={brand} onChange={setBrand} placeholder="e.g. Ralph Lauren" />

              {/* Category picker */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CATEGORY *</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[styles.categoryOption, category === cat && styles.categoryOptionActive]}
                    >
                      <Text style={[styles.categoryOptionText, category === cat && styles.categoryOptionTextActive]}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <FormField
                label="PURCHASE PRICE (USD)"
                value={price}
                onChange={setPrice}
                placeholder="e.g. 120"
                keyboardType="numeric"
              />
              <FormField
                label="NOTES"
                value={notes}
                onChange={setNotes}
                placeholder="Any notes (size, where you got it, etc.)"
                multiline
              />
            </View>
          </View>
        )}

        {/* ── STEP 3: AI Analysis ── */}
        {step === 'ai-analysis' && (
          <View style={styles.aiAnalysisStep}>
            <LinearGradient colors={['rgba(212,175,55,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
            <Text style={styles.aiIcon}>✦</Text>
            <Text style={styles.aiTitle}>AI is analyzing your item</Text>
            <Text style={styles.aiSub}>
              FitCheck Vision AI is detecting brand, color palette, material, fit type, style archetypes, occasion tags, and estimated value.
            </Text>
            <ActivityIndicator size="large" color={Colors.gold.primary} style={{ marginTop: Spacing.xl }} />
            <View style={styles.aiSteps}>
              {[
                'Analyzing image quality…',
                'Detecting clothing category…',
                'Extracting color palette…',
                'Identifying style archetype…',
                'Computing versatility score…',
              ].map((step, i) => (
                <View key={step} style={styles.aiStepRow}>
                  <Text style={styles.aiStepCheck}>{aiAnalyzing && i < 3 ? '✓' : '◌'}</Text>
                  <Text style={[styles.aiStepText, !aiAnalyzing && i >= 3 && { color: Colors.text.tertiary }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      {step !== 'ai-analysis' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <GoldButton
            title={step === 'photos' ? (isUploading ? 'Uploading…' : 'Continue →') : (isSubmitting ? 'Adding to Wardrobe…' : 'Add to Wardrobe ✦')}
            onPress={handleNext}
            isLoading={isUploading || isSubmitting}
            fullWidth
            size="lg"
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function FormField({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.tertiary}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const PHOTO_SIZE = (width - Spacing.md * 2 - Spacing.sm * 2) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.text.primary },
  headerTitle: { ...Typography.luxe, color: Colors.text.primary, letterSpacing: 3 },
  progressTrack: { height: 2, backgroundColor: Colors.border.subtle, marginHorizontal: Spacing.md },
  progressFill: { height: '100%', backgroundColor: Colors.gold.primary, borderRadius: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: 120 },
  step: { gap: Spacing.lg },
  stepLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  stepTitle: { ...Typography.h1, color: Colors.text.primary },
  stepSub: { ...Typography.body2, color: Colors.text.secondary, lineHeight: 22 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoCell: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.2, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  photoThumb: { width: '100%', height: '100%' },
  removePhotoBtn: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  removePhotoIcon: { fontSize: 10, color: Colors.text.primary, fontWeight: '700' },
  primaryBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: Colors.gold.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  primaryBadgeText: { fontSize: 8, fontWeight: '800', color: '#0A0A0B' },
  addPhotoCell: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.2, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border.default, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.background.elevated },
  addPhotoIcon: { fontSize: 28, color: Colors.text.tertiary },
  addPhotoText: { ...Typography.body3, color: Colors.text.tertiary },
  photoActions: { flexDirection: 'row', gap: Spacing.md },
  photoActionBtn: { flex: 1 },
  photoActionCard: {},
  photoActionInner: { padding: Spacing.md, alignItems: 'center', gap: Spacing.sm },
  photoActionIcon: { fontSize: 28 },
  photoActionText: { ...Typography.body3, color: Colors.text.secondary, fontWeight: '600' },
  tipText: { ...Typography.body3, color: Colors.text.tertiary, lineHeight: 18 },
  photoStrip: { gap: Spacing.sm, marginBottom: Spacing.sm },
  photoStripThumb: { width: 64, height: 80, borderRadius: Radius.sm },
  form: { gap: Spacing.md },
  fieldGroup: { gap: Spacing.xs },
  fieldLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  fieldInput: { backgroundColor: Colors.background.elevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.default, ...Typography.body2 },
  fieldInputMulti: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  categoryOptionActive: { backgroundColor: Colors.gold.muted, borderColor: Colors.gold.primary },
  categoryOptionText: { ...Typography.body3, color: Colors.text.secondary, fontSize: 12 },
  categoryOptionTextActive: { color: Colors.gold.primary, fontWeight: '700' },
  aiAnalysisStep: { alignItems: 'center', paddingVertical: 60, gap: Spacing.lg, overflow: 'hidden', position: 'relative' },
  aiIcon: { fontSize: 48, color: Colors.gold.primary },
  aiTitle: { ...Typography.h2, color: Colors.text.primary, textAlign: 'center' },
  aiSub: { ...Typography.body2, color: Colors.text.secondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: Spacing.lg },
  aiSteps: { width: '100%', gap: Spacing.sm, marginTop: Spacing.lg },
  aiStepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  aiStepCheck: { fontSize: 16, color: Colors.gold.primary, width: 20, textAlign: 'center' },
  aiStepText: { ...Typography.body2, color: Colors.text.secondary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, backgroundColor: 'rgba(10,10,11,0.95)' },
});
