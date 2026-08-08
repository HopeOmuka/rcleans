import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { AppState, LogBox } from "react-native";
import "react-native-reanimated";
import "../global.css";

import ErrorBoundary from "@/components/ErrorBoundary";
import PushNotificationHandler from "@/components/PushNotificationHandler";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import ToastManager from "@/components/Toast";
import { tokenCache } from "@/lib/auth";
import { setAuthToken } from "@/lib/fetch";
import { logger } from "@/lib/logger";
import { initSentry } from "@/lib/sentry";
import { loadThemePreference, ThemeTransitionProvider } from "@/lib/theme";

initSentry();

function useProtectedRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inCleanerGroup = segments[0] === "cleaner";
    if (isSignedIn && inAuthGroup) {
      router.replace("/(root)/(tabs)/home");
    } else if (!isSignedIn && !inAuthGroup && !inCleanerGroup) {
      router.replace("/(auth)/sign-in");
    }
  }, [isSignedIn, isLoaded, segments, router]);
}

function AuthTokenSync({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [synced, setSynced] = useState(false);

  // On session changes (sign-in / sign-out), block rendering until the new
  // token has been pushed to the API layer — otherwise screens mount first
  // and fire unauthenticated 401s.
  useEffect(() => {
    setSynced(false);
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;

    const syncToken = (): Promise<void> => {
      if (isSignedIn) {
        return getToken({ skipCache: true }).then((token) => {
          setAuthToken(token ?? null);
          setSynced(true);
        });
      }
      setAuthToken(null);
      setSynced(true);
      return Promise.resolve();
    };

    void syncToken();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void syncToken();
      }
    });

    const interval = setInterval(() => {
      if (isSignedIn) {
        syncToken().catch(() => {
          logger.warn("Token refresh failed");
        });
      }
    }, 45_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [isLoaded, isSignedIn, getToken]);

  return synced ? children : null;
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env",
  );
}

LogBox.ignoreLogs(["Clerk:"]);

function AuthGuard() {
  useProtectedRoute();
  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "Jakarta-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    Jakarta: require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeTransitionProvider initialTheme={loadThemePreference()}>
      <ThemedStatusBar />
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ClerkLoaded>
          <ErrorBoundary>
            <AuthGuard />
            <AuthTokenSync>
              <PushNotificationHandler role="user" />
              <Stack
                screenOptions={{
                  animation: "slide_from_right",
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(root)" options={{ headerShown: false }} />
                <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                <Stack.Screen name="cleaner" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </AuthTokenSync>
            <ToastManager />
          </ErrorBoundary>
        </ClerkLoaded>
      </ClerkProvider>
    </ThemeTransitionProvider>
  );
}
