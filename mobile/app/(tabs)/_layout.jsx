import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = {
  bg: '#0A0F1E',
  tabBar: '#0D1526',
  border: '#1F2937',
  active: '#00d2ff',
  inactive: '#4B5563',
};

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabLabel, { color: focused ? COLORS.active : COLORS.inactive }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        tabBarShowLabel: false,
      }}
      initialRouteName="store"
    >
      {/* Store — main landing tab after login */}
      <Tabs.Screen
        name="store"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛒" label="Store" focused={focused} />
          ),
        }}
      />

      {/* Home / Dashboard */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />

      {/* Hidden Screens inside the Tabs Layout */}
      <Tabs.Screen name="cart" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="purchase-history" options={{ href: null }} />
      <Tabs.Screen name="service-ticket" options={{ href: null }} />
      <Tabs.Screen name="warranty" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 10,
    height: '100%',
  },
  tabIconActive: {},
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
