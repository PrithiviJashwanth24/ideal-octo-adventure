import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { GlassCard } from '../../components/common/GlassCard';
import { GoldButton } from '../../components/common/GoldButton';
import { gqlRequest } from '../../services/graphql';
import { useAppSelector } from '../../hooks/useAppDispatch';

const CHAT_MUTATION = `
  mutation Chat($message: String!, $sessionId: String) {
    chatWithStylist(message: $message, sessionId: $sessionId) {
      id response actionItems
    }
  }
`;

const RECOMMENDATIONS_QUERY = `
  query Recommendations($occasion: OccasionTag) {
    outfitRecommendations(occasion: $occasion) {
      rationale contextUsed
      safe { id name aiRationale items { id name thumbnailUrl category } }
      statement { id name aiRationale items { id name thumbnailUrl category } }
      stealthLuxury { id name aiRationale items { id name thumbnailUrl category } }
      dateNight { id name aiRationale items { id name thumbnailUrl category } }
      boardroom { id name aiRationale items { id name thumbnailUrl category } }
    }
  }
`;

const OCCASION_QUICK_SELECT = ['EVERYDAY', 'BUSINESS_CASUAL', 'DATE_NIGHT', 'TRAVEL', 'GYM', 'WEDDING'];
const OCCASION_LABELS: Record<string, string> = {
  EVERYDAY: '🌅 Everyday', BUSINESS_CASUAL: '💼 Work', DATE_NIGHT: '🌙 Date',
  TRAVEL: '✈️ Travel', GYM: '🏋️ Gym', WEDDING: '💍 Wedding',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export function StylistScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const [mode, setMode] = useState<'chat' | 'outfits'>('outfits');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [selectedOccasion, setSelectedOccasion] = useState<string>('EVERYDAY');
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingDots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode === 'outfits') fetchRecommendations();
  }, [mode, selectedOccasion]);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDots, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingDots, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isLoading]);

  const fetchRecommendations = async () => {
    setIsGenerating(true);
    try {
      const data = await gqlRequest<{ outfitRecommendations: any }>(RECOMMENDATIONS_QUERY, {
        occasion: selectedOccasion,
      });
      setRecommendations(data.outfitRecommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: ChatMessage = { role: 'user', content: inputText.trim(), id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const data = await gqlRequest<{ chatWithStylist: any }>(CHAT_MUTATION, {
        message: inputText.trim(),
        sessionId,
      });

      const session = data.chatWithStylist;
      setSessionId(session.id);

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: session.response,
        id: (Date.now() + 1).toString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again.",
        id: (Date.now() + 1).toString(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const QUICK_PROMPTS = [
    "What should I wear to an investor meeting?",
    "Build me a capsule wardrobe for a 5-day trip to Paris",
    "What's my Style DNA?",
    "How can I look more put-together with what I own?",
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>AI STYLIST</Text>
          <Text style={styles.headerTitle}>Your personal fashion intelligence</Text>
        </View>
        <View style={styles.modeTabs}>
          {(['outfits', 'chat'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modeTab, mode === m && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                {m === 'outfits' ? '✦ Outfits' : '✦ Chat'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {mode === 'outfits' ? (
        <ScrollView contentContainerStyle={styles.outfitMode} showsVerticalScrollIndicator={false}>
          {/* Occasion selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.occasionList}>
            {OCCASION_QUICK_SELECT.map((occ) => (
              <TouchableOpacity
                key={occ}
                onPress={() => setSelectedOccasion(occ)}
                style={[styles.occasionChip, selectedOccasion === occ && styles.occasionChipActive]}
              >
                <Text style={[styles.occasionChipText, selectedOccasion === occ && styles.occasionChipTextActive]}>
                  {OCCASION_LABELS[occ]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <GoldButton
            title={isGenerating ? 'Analyzing Your Wardrobe…' : '✦  Generate My Fits'}
            onPress={fetchRecommendations}
            isLoading={isGenerating}
            fullWidth
            style={styles.generateBtn}
          />

          {recommendations && (
            <View style={styles.recommendationsContainer}>
              <GlassCard style={styles.rationaleCard}>
                <View style={styles.rationaleInner}>
                  <Text style={styles.rationaleLabel}>AI RATIONALE</Text>
                  <Text style={styles.rationaleText}>{recommendations.rationale}</Text>
                </View>
              </GlassCard>

              {[
                { key: 'safe', label: '🛡  SAFE FIT', color: Colors.text.secondary },
                { key: 'statement', label: '⚡ STATEMENT', color: Colors.gold.primary },
                { key: 'stealthLuxury', label: '💎 STEALTH LUXE', color: '#C0C0C0' },
                { key: 'dateNight', label: '🌙 DATE NIGHT', color: '#FF6B9D' },
                { key: 'boardroom', label: '🏛  BOARDROOM', color: Colors.info },
              ].map(({ key, label, color }) => {
                const outfit = recommendations[key];
                if (!outfit) return null;
                return (
                  <GlassCard key={key} style={styles.outfitCard}>
                    <View style={styles.outfitCardInner}>
                      <View style={styles.outfitCardHeader}>
                        <Text style={[styles.outfitLabel, { color }]}>{label}</Text>
                        {outfit.name && <Text style={styles.outfitName}>{outfit.name}</Text>}
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.outfitItems}>
                        {outfit.items?.map((item: any) => (
                          <View key={item.id} style={styles.outfitItemChip}>
                            <Text style={styles.outfitItemName}>{item.name}</Text>
                            <Text style={styles.outfitItemCategory}>{item.category}</Text>
                          </View>
                        ))}
                      </ScrollView>
                      {outfit.aiRationale && (
                        <Text style={styles.outfitRationale}>{outfit.aiRationale}</Text>
                      )}
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <>
          {/* Chat Messages */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatMessages}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && (
              <View style={styles.chatIntro}>
                <LinearGradient colors={['rgba(212,175,55,0.15)', 'transparent']} style={styles.introGlow} />
                <Text style={styles.introIcon}>✦</Text>
                <Text style={styles.introTitle}>FitCheck AI Stylist</Text>
                <Text style={styles.introSub}>
                  Ask me anything about fashion, your wardrobe, or what to wear.
                </Text>
                <View style={styles.quickPrompts}>
                  {QUICK_PROMPTS.map((prompt) => (
                    <TouchableOpacity
                      key={prompt}
                      onPress={() => { setInputText(prompt); }}
                      style={styles.quickPromptBtn}
                    >
                      <Text style={styles.quickPromptText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' && styles.userBubble]}>
                {msg.role === 'assistant' && (
                  <View style={styles.aiAvatar}>
                    <Text style={styles.aiAvatarText}>✦</Text>
                  </View>
                )}
                <View style={[styles.messageContent, msg.role === 'user' ? styles.userMessageContent : styles.aiMessageContent]}>
                  <Text style={[styles.messageText, msg.role === 'user' && styles.userMessageText]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}

            {isLoading && (
              <View style={styles.messageBubble}>
                <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>✦</Text></View>
                <GlassCard style={styles.typingIndicator}>
                  <View style={styles.typingDots}>
                    {[0, 1, 2].map((i) => (
                      <Animated.View key={i} style={[styles.typingDot, { opacity: typingDots }]} />
                    ))}
                  </View>
                </GlassCard>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
            <GlassCard style={styles.inputCard}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask your AI Stylist…"
                  placeholderTextColor={Colors.text.tertiary}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                >
                  <LinearGradient colors={['#D4AF37', '#A08020']} style={styles.sendButtonGradient}>
                    <Text style={styles.sendButtonIcon}>↑</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.md },
  headerLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  headerTitle: { ...Typography.h3, color: Colors.text.primary },
  modeTabs: { flexDirection: 'row', backgroundColor: Colors.background.elevated, borderRadius: Radius.full, padding: 3, gap: 3 },
  modeTab: { flex: 1, paddingVertical: 8, borderRadius: Radius.full, alignItems: 'center' },
  modeTabActive: { backgroundColor: Colors.gold.primary },
  modeTabText: { ...Typography.label, color: Colors.text.secondary },
  modeTabTextActive: { color: '#0A0A0B' },

  outfitMode: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  occasionList: { paddingBottom: Spacing.md, gap: Spacing.sm },
  occasionChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  occasionChipActive: { backgroundColor: Colors.gold.muted, borderColor: Colors.gold.primary },
  occasionChipText: { ...Typography.body3, color: Colors.text.secondary, fontWeight: '500' },
  occasionChipTextActive: { color: Colors.gold.primary, fontWeight: '700' },
  generateBtn: { marginBottom: Spacing.lg },
  recommendationsContainer: { gap: Spacing.md },
  rationaleCard: { },
  rationaleInner: { padding: Spacing.md, gap: Spacing.sm },
  rationaleLabel: { ...Typography.luxe, color: Colors.gold.primary },
  rationaleText: { ...Typography.body2, color: Colors.text.secondary, lineHeight: 22 },
  outfitCard: { },
  outfitCardInner: { padding: Spacing.md, gap: Spacing.sm },
  outfitCardHeader: { gap: 2 },
  outfitLabel: { ...Typography.luxe, fontWeight: '700' },
  outfitName: { ...Typography.h4, color: Colors.text.primary },
  outfitItems: { },
  outfitItemChip: { backgroundColor: Colors.background.elevated, borderRadius: Radius.sm, padding: 8, marginRight: 8, borderWidth: 1, borderColor: Colors.border.subtle, minWidth: 80 },
  outfitItemName: { ...Typography.body3, color: Colors.text.primary, fontWeight: '600' },
  outfitItemCategory: { ...Typography.body3, color: Colors.text.tertiary, fontSize: 9 },
  outfitRationale: { ...Typography.body3, color: Colors.text.secondary, lineHeight: 18, marginTop: 4 },

  chatMessages: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.md },
  chatIntro: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md, overflow: 'hidden' },
  introGlow: { position: 'absolute', top: 0, left: -100, right: -100, height: 200 },
  introIcon: { fontSize: 32, color: Colors.gold.primary },
  introTitle: { ...Typography.h2, color: Colors.text.primary },
  introSub: { ...Typography.body2, color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Spacing.lg },
  quickPrompts: { gap: Spacing.sm, width: '100%' },
  quickPromptBtn: { backgroundColor: Colors.background.elevated, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border.subtle },
  quickPromptText: { ...Typography.body2, color: Colors.text.secondary },

  messageBubble: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  userBubble: { flexDirection: 'row-reverse' },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gold.muted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.gold.primary },
  aiAvatarText: { fontSize: 14, color: Colors.gold.primary },
  messageContent: { maxWidth: '80%', borderRadius: Radius.lg, padding: 12 },
  aiMessageContent: { backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.subtle },
  userMessageContent: { backgroundColor: Colors.gold.primary },
  messageText: { ...Typography.body2, color: Colors.text.primary, lineHeight: 22 },
  userMessageText: { color: '#0A0A0B' },
  typingIndicator: { padding: 12 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.text.tertiary },

  inputContainer: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  inputCard: { },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, gap: 8 },
  input: { flex: 1, color: Colors.text.primary, ...Typography.body2, maxHeight: 100, paddingVertical: 8, paddingHorizontal: 8 },
  sendButton: { },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonGradient: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sendButtonIcon: { fontSize: 18, color: '#0A0A0B', fontWeight: '700' },
});
