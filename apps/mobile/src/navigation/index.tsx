import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch';
import { AuthService } from '../services/auth/authService';
import { setLoading } from '../store/slices/authSlice';
import { Colors, Typography, Spacing } from '../constants/theme';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { WardrobeScreen } from '../screens/wardrobe/WardrobeScreen';
import { StylistScreen } from '../screens/stylist/StylistScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: '⌂', inactive: '⌂' },
  Wardrobe: { active: '◫', inactive: '◫' },
  Stylist: { active: '✦', inactive: '✦' },
  Analytics: { active: '◈', inactive: '◈' },
  Profile: { active: '◉', inactive: '◉' },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tabBarBorder} />
      <View style={styles.tabBarContent}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const isStylist = route.name === 'Stylist';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }}
              style={[styles.tabItem, isStylist && styles.tabItemCenter]}
            >
              {isStylist ? (
                <LinearGradient colors={['#D4AF37', '#A08020']} style={styles.centerTabButton}>
                  <Text style={styles.centerTabIcon}>✦</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
                    {TAB_ICONS[route.name]?.active || '○'}
                  </Text>
                  <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                    {route.name}
                  </Text>
                  {isFocused && <View style={styles.tabDot} />}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} />
      <Tab.Screen name="Stylist" component={StylistScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export function AppNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    AuthService.restoreSession().finally(() => dispatch(setLoading(false)));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['rgba(212,175,55,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
        <Text style={styles.loadingLogo}>✦</Text>
        <Text style={styles.loadingText}>FITCHECK</Text>
        <ActivityIndicator color={Colors.gold.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !user?.isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: { fontSize: 48, color: Colors.gold.primary },
  loadingText: { ...Typography.h2, color: Colors.text.primary, letterSpacing: 6, marginTop: 8 },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
  },
  tabBarBorder: { height: 1, backgroundColor: Colors.border.subtle },
  tabBarContent: { flexDirection: 'row', paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 3 },
  tabItemCenter: { marginTop: -20 },
  centerTabButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.gold.primary, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, shadowOffset: { width: 0, height: 4 } },
  centerTabIcon: { fontSize: 22, color: '#0A0A0B' },
  tabIcon: { fontSize: 18, color: Colors.text.tertiary },
  tabIconActive: { color: Colors.text.primary },
  tabLabel: { fontSize: 9, color: Colors.text.tertiary, fontWeight: '500', letterSpacing: 0.5 },
  tabLabelActive: { color: Colors.gold.primary, fontWeight: '700' },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold.primary, marginTop: 2 },
});
