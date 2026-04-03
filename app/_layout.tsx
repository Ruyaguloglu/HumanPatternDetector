// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = 'hpd_onboarded';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasOnboarded(value === 'true');
      } catch {
        setHasOnboarded(false);
      } finally {
        setOnboardingChecked(true);
      }
    }
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (fontsLoaded && onboardingChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, onboardingChecked]);

  if (!fontsLoaded || !onboardingChecked) {
    return null;
  }

  return (
    <>
      {/*
        ─── Stack Navigator ────────────────────────────────────────────
        Stack is the ROOT navigator. It owns ALL top-level routes.

        Key fix: we explicitly declare every screen here with
        the correct options. This PREVENTS Expo Router from
        auto-generating its own tab bar for app/ level files.

        The (tabs) group contains our real tab navigator.
        onboarding and +not-found are standalone Stack screens —
        they must NEVER appear as tabs.
      */}
      <Stack>
        {/*
          (tabs) → our main app with the real bottom tab bar
          This is the home screen for returning users.
        */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        {/*
          onboarding → full screen, no header, no back gesture
          Only shown on first launch.
        */}
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        {/*
          +not-found → shown when a route doesn't exist
          Clean error screen, no header needed.
        */}
        <Stack.Screen
          name="+not-found"
          options={{ headerShown: false }}
        />
      </Stack>

      {/* Redirect to onboarding if first launch */}
      {!hasOnboarded && <InitialRedirect />}

      <StatusBar style="light" />
    </>
  );
}

// ─── Initial Redirect ─────────────────────────────────────────────────────────
// Handles redirect as a side effect after layout mounts.
// Must be a separate component so useEffect runs at the right time.

function InitialRedirect() {
  const { router } = require('expo-router');

  useEffect(() => {
    router.replace('/onboarding');
  }, []);

  return null;
}