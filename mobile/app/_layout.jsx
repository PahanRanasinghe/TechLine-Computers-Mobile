import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

// ─── Navigation Guard ─────────────────────────────────────────────────────
function NavigationGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup  = segments[0] === '(auth)';
    const inTabsGroup  = segments[0] === '(tabs)';
    const inAdminGroup = segments[0] === '(admin)';
    const onIndex      = segments.length === 0 || segments[0] === 'index';
    const isAdmin      = user?.role === 'ROLE_ADMIN';

    if (!isAuthenticated && (inTabsGroup || inAdminGroup)) {
      // Logged out — send to landing page
      router.replace('/');
    } else if (isAuthenticated && (inAuthGroup || onIndex)) {
      // Just logged in — route by role
      router.replace(isAdmin ? '/(admin)/dashboard' : '/(tabs)/store');
    } else if (isAuthenticated && inAdminGroup && !isAdmin) {
      // Customer trying to access admin area — bounce back
      router.replace('/(tabs)/store');
    }
  }, [isAuthenticated, isLoading, segments, user]);

  return null;
}

// ─── Loading Spinner ──────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────
function RootLayoutContent() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="light" />
        <RootLayoutContent />
      </CartProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F1E',
  },
});
