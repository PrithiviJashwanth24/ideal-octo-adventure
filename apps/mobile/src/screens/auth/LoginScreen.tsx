import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { GoldButton } from '../../components/common/GoldButton';
import { AuthService } from '../../services/auth/authService';

export function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true);
    try {
      await AuthService.login(email.toLowerCase().trim(), password);
    } catch (err: any) {
      setError(err.message?.includes('credentials') ? 'Invalid email or password' : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['rgba(212,175,55,0.08)', 'transparent']} style={styles.glow} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoMark}>✦</Text>
          <Text style={styles.logoText}>FITCHECK</Text>
          <Text style={styles.logoTagline}>Your Appearance Operating System</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign In</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={Colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <GoldButton title="Sign In" onPress={handleLogin} isLoading={isLoading} fullWidth size="lg" />

          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Register CTA */}
        <View style={styles.registerCta}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Create Account →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  glow: { position: 'absolute', top: 0, left: -50, right: -50, height: 300 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg, gap: Spacing.xxl },
  logoContainer: { alignItems: 'center', gap: Spacing.sm },
  logoMark: { fontSize: 40, color: Colors.gold.primary },
  logoText: { fontSize: 32, fontWeight: '700', color: Colors.text.primary, letterSpacing: 6 },
  logoTagline: { ...Typography.body3, color: Colors.text.tertiary, letterSpacing: 1 },
  form: { gap: Spacing.lg },
  formTitle: { ...Typography.h1, color: Colors.text.primary },
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText: { ...Typography.body2, color: Colors.error },
  inputGroup: { gap: Spacing.sm },
  inputLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  input: {
    backgroundColor: Colors.background.elevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Typography.body1,
  },
  forgotLink: { alignItems: 'center' },
  forgotText: { ...Typography.body2, color: Colors.text.tertiary },
  registerCta: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { ...Typography.body2, color: Colors.text.tertiary },
  registerLink: { ...Typography.body2, color: Colors.gold.primary, fontWeight: '600' },
});
