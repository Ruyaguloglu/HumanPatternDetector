// app/onboarding.tsx
// ONBOARDING_KEY defined here — single source of truth for this constant.
// _layout.tsx also defines it locally to avoid circular imports.

import { colors, textStyles } from "@/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SCREEN_WIDTH = Dimensions.get("window").width;
export const ONBOARDING_KEY = "hpd_onboarded";

type OnboardingPage = {
  symbol: string;
  symbolColor: string;
  title: string;
  subtitle: string;
  bullets: string[];
};

const PAGES: OnboardingPage[] = [
  {
    symbol: "◈",
    symbolColor: colors.accent.green,
    title: "Human Pattern\nDetector",
    subtitle: "A personal behavioral intelligence tool.",
    bullets: [
      "Small daily signals reveal big patterns",
      "Mood and focus tracked in under 10 seconds",
      "Patterns emerge over days and weeks",
    ],
  },
  {
    symbol: "◉",
    symbolColor: colors.accent.blue,
    title: "One check-in.\nEvery day.",
    subtitle: "The entire interaction takes less than 10 seconds.",
    bullets: [
      "Select your mood on a 1–5 scale",
      "Select your focus on a 1–5 scale",
      "Tap Record — that's it",
    ],
  },
  {
    symbol: "∿",
    symbolColor: colors.accent.purple,
    title: "Patterns take\ntime to form.",
    subtitle: "The engine needs data before it can detect signals.",
    bullets: [
      "Insights activate after 3 check-ins",
      "Strong patterns emerge after 2 weeks",
      "All data stays on your device — private",
    ],
  },
];

type PageProps = {
  page: OnboardingPage;
  isActive: boolean;
};

function OnboardingPageView({ page, isActive }: PageProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  if (isActive) {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return (
    <View style={[styles.page, { width: SCREEN_WIDTH }]}>
      <Animated.View
        style={[
          styles.pageContent,
          {
            opacity: isActive ? fadeAnim : 0.3,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.pageSymbol, { color: page.symbolColor }]}>
          {page.symbol}
        </Text>
        <Text style={styles.pageTitle}>{page.title}</Text>
        <Text style={styles.pageSubtitle}>{page.subtitle}</Text>
        <View
          style={[
            styles.pageDivider,
            { backgroundColor: page.symbolColor + "33" },
          ]}
        />
        <View style={styles.bulletList}>
          {page.bullets.map((bullet, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bulletDot, { color: page.symbolColor }]}>
                ·
              </Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

type ProgressDotsProps = {
  total: number;
  current: number;
};

function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i === current
              ? styles.progressDotActive
              : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLastPage = currentPage === PAGES.length - 1;

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  };

  const handleNext = () => {
    if (isLastPage) {
      handleComplete();
      return;
    }
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    scrollRef.current?.scrollTo({ x: nextPage * SCREEN_WIDTH, animated: true });
  };

  const handleScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
        <Text style={styles.skipText}>SKIP</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {PAGES.map((page, i) => (
          <OnboardingPageView
            key={i}
            page={page}
            isActive={i === currentPage}
          />
        ))}
      </ScrollView>

      <View style={styles.bottomControls}>
        <ProgressDots total={PAGES.length} current={currentPage} />
        <TouchableOpacity
          style={[styles.nextButton, isLastPage && styles.nextButtonFinal]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.nextButtonText,
              isLastPage && styles.nextButtonTextFinal,
            ]}
          >
            {isLastPage ? "GET STARTED" : "NEXT"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.base },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: { ...textStyles.label, color: colors.text.muted, letterSpacing: 2 },
  scrollView: { flex: 1 },
  page: { flex: 1, justifyContent: "center", paddingHorizontal: 40 },
  pageContent: { gap: 16 },
  pageSymbol: { fontSize: 56, marginBottom: 8 },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  pageSubtitle: {
    ...textStyles.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  pageDivider: { height: 1, marginVertical: 4 },
  bulletList: { gap: 12 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { fontSize: 24, lineHeight: 22, fontWeight: "700" },
  bulletText: {
    ...textStyles.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24,
    alignItems: "center",
  },
  dotsRow: { flexDirection: "row", gap: 8 },
  progressDot: { height: 4, borderRadius: 2 },
  progressDotActive: { width: 20, backgroundColor: colors.text.primary },
  progressDotInactive: { width: 6, backgroundColor: colors.border.strong },
  nextButton: {
    width: "100%",
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  nextButtonFinal: {
    borderColor: colors.text.primary,
    backgroundColor: colors.text.primary + "11",
  },
  nextButtonText: {
    ...textStyles.button,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  nextButtonTextFinal: { color: colors.text.primary },
});
