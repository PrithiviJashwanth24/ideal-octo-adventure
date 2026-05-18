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

export function RegisterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!displayName || !username || !email || !password) { setError('All fields required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setIsLoading(true);
    try {
      await AuthService.register(email.toLowerCase().trim(), password, username.toLowerCase().trim(), displayName.trim());
    } catch (err: any) {
      setError(err.message?.includes('taken') ? 'Email or username already taken' : 'Registration failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['rgba(212,175,55,0.06)', 'transparent']} style={styles.glow} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logoMark}>✦</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the future of personal style.</Text>
        </View>

        <View style={styles.form}>
          {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

          {[
            { label: 'YOUR NAME', value: displayName, setter: setDisplayName, placeholder: 'John Smith', autoCapitalize: 'words' as const },
            { label: 'USERNAME', value: username, setter: setUsername, placeholder: '@username', autoCapitalize: 'none' as const },
            { label: 'EMAIL', value: email, setter: setEmail, placeholder: 'your@email.com', autoCapitalize: 'none' as const },
            { label: 'PASSWORD', value: password, setter: setPassword, placeholder: '8+ characters', secure: true, autoCapitalize: 'none' as const },
          ].map((field) => (
            <View key={field.label} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.text.tertiary}
                value={field.value}
                onChangeText={field.setter}
                secureTextEntry={field.secure}
                autoCapitalize={field.autoCapitalize}
              />
            </View>
          ))}

          <GoldButton title="Create My Account →" onPress={handleRegister} isLoading={isLoading} fullWidth size="lg" />
        </View>

        <View style={styles.loginCta}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In →</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  glow: { position: 'absolute', top: 0, left: -50, right: -50, height: 300 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg, gap: Spacing.xl },
  header: { alignItems: 'center', gap: Spacing.sm },
  logoMark: { fontSize: 32, color: Colors.gold.primary },
  title: { ...Typography.h1, color: Colors.text.primary },
  subtitle: { ...Typography.body2, color: Colors.text.secondary },
  form: { gap: Spacing.md },
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText: { ...Typography.body2, color: Colors.error },
  inputGroup: { gap: Spacing.xs },
  inputLabel: { ...Typography.luxe, color: Colors.text.tertiary },
  input: { backgroundColor: Colors.background.elevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.default, ...Typography.body1 },
  loginCta: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { ...Typography.body2, color: Colors.text.tertiary },
  loginLink: { ...Typography.body2, color: Colors.gold.primary, fontWeight: '600' },
  terms: { ...Typography.body3, color: Colors.text.tertiary, textAlign: 'center', lineHeight: 18 },
});
