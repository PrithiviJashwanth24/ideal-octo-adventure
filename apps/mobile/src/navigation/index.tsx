import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch';
import { AuthService } from '../services/auth/authService';
import { setLoading } from '../store/slices/authSlice';
import { Colors, Typography, Spacing } from '../constants/theme';

// Auth
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Onboarding
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';

// Main tabs
import { HomeScreen } from '../screens/home/HomeScreen';
import { WardrobeScreen } from '../screens/wardrobe/WardrobeScreen';
import { StylistScreen } from '../screens/stylist/StylistScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { SocialScreen } from '../screens/social/SocialScreen';
import { ShopScreen } from '../screens/shop/ShopScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

// Detail screens
import { AddItemScreen } from '../screens/wardrobe/AddItemScreen';
import { ItemDetailScreen } from '../screens/wardrobe/ItemDetailScreen';
import OutfitDetailScreen from '../screens/outfit/OutfitDetailScreen';
import MoodDressingScreen from '../screens/stylist/MoodDressingScreen';
import TrendScreen from '../screens/stylist/TrendScreen';
import SocialPerceptionScreen from '../screens/stylist/SocialPerceptionScreen';
import WardrobeWrappedScreen from '../screens/analytics/WardrobeWrappedScreen';
import PackingListScreen from '../screens/wardrobe/PackingListScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home', icon: '⌂', label: 'Home' },
  { name: 'Wardrobe', icon: '◫', label: 'Closet' },
  { name: 'Stylist', icon: '✦', label: '', isCentral: true },
  { name: 'Social', icon: '◎', label: 'Social' },
  { name: 'Profile', icon: '◉', label: 'Me' },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.tabBarTopBorder} />
      <View style={styles.tabBarContent}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const tab = TABS.find((t) => t.name === route.name) || TABS[index];
          const isCentral = tab?.isCentral;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }}
              style={[styles.tabItem, isCentral && styles.tabItemCentral]}
              activeOpacity={0.8}
            >
              {isCentral ? (
                <LinearGradient
                  colors={['#E8C84A', '#C8A020', '#A07818']}
                  style={styles.centralButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.centralIcon}>✦</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>{tab?.icon}</Text>
                  {tab?.label && (
                    <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tab.label}</Text>
                  )}
                  {isFocused && <View style={styles.tabIndicator} />}
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
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={MainTabs} />
      <MainStack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <MainStack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Shop"
        component={ShopScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="OutfitDetail"
        component={OutfitDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="MoodDressing"
        component={MoodDressingScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <MainStack.Screen
        name="Trends"
        component={TrendScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="SocialPerception"
        component={SocialPerceptionScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="WardrobeWrapped"
        component={WardrobeWrappedScreen}
        options={{ animation: 'fade' }}
      />
      <MainStack.Screen
        name="PackingList"
        component={PackingListScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <MainStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </MainStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ animation: 'slide_from_right' }}
      />
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
      <View style={styles.splash}>
        <LinearGradient
          colors={['rgba(212,175,55,0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.splashIcon}>✦</Text>
        <Text style={styles.splashLogo}>FITCHECK</Text>
        <ActivityIndicator color={Colors.gold.primary} style={{ marginTop: 48 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : !user?.isOnboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIcon: { fontSize: 48, color: Colors.gold.primary },
  splashLogo: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 7,
    marginTop: 12,
  },
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarTopBorder: {
    height: 0.5,
    backgroundColor: Colors.border.subtle,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 3,
    position: 'relative',
  },
  tabItemCentral: {
    marginTop: -20,
  },
  centralButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold.primary,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  centralIcon: { fontSize: 24, color: '#0A0A0B', fontWeight: '900' },
  tabIcon: { fontSize: 20, color: Colors.text.tertiary },
  tabIconActive: { color: Colors.text.primary },
  tabLabel: { fontSize: 9, color: Colors.text.tertiary, fontWeight: '500', letterSpacing: 0.3 },
  tabLabelActive: { color: Colors.gold.primary, fontWeight: '700' },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.gold.primary,
  },
});
