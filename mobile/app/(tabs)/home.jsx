import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  bg: '#0A0F1E',
  card: '#111827',
  card2: '#0D1526',
  border: '#1F2937',
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  accent: '#10B981',
  warn: '#F59E0B',
  text: '#F9FAFB',
  muted: '#9CA3AF',
};

const MODULE_CARDS = [
  { title: 'Inventory', subtitle: 'Stock tracking & alerts', emoji: '📦', color: '#6C63FF', route: '/inventory' },
  { title: 'Orders & Sales', subtitle: 'Cart, invoices & bills', emoji: '🛒', color: '#10B981', route: '/sales' },
  { title: 'Suppliers', subtitle: 'Procurement & orders', emoji: '🏭', color: '#F59E0B', route: '/suppliers' },
  { title: 'Warranty', subtitle: 'Claims & service tickets', emoji: '🛡️', color: '#EF4444', route: '/warranty' },
];

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName} 👋</Text>
          </View>
          <View style={[styles.roleBadge, isAdmin && styles.roleBadgeAdmin]}>
            <Text style={styles.roleText}>{isAdmin ? '⚡ Admin' : '👤 User'}</Text>
          </View>
        </View>

        {/* Stats Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>TechLine Computers</Text>
            <Text style={styles.bannerSubtitle}>Spare Parts Management System</Text>
          </View>
          <Text style={styles.bannerEmoji}>💻</Text>
        </View>

        {/* Modules Section */}
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={styles.moduleGrid}>
          {MODULE_CARDS.map((mod) => (
            <TouchableOpacity
              key={mod.title}
              style={[styles.moduleCard, { borderLeftColor: mod.color }]}
              onPress={() => router.push(mod.route)}
              activeOpacity={0.8}
            >
              <Text style={styles.moduleEmoji}>{mod.emoji}</Text>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Admin Panel Link */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Administration</Text>
            <TouchableOpacity
              style={styles.adminCard}
              onPress={() => router.push('/(admin)/users')}
              activeOpacity={0.8}
            >
              <View style={styles.adminCardInner}>
                <Text style={styles.adminEmoji}>👥</Text>
                <View>
                  <Text style={styles.adminTitle}>User Management</Text>
                  <Text style={styles.adminSubtitle}>View, edit & manage all users</Text>
                </View>
              </View>
              <Text style={styles.adminArrow}>→</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Quick Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Account Info</Text>
          <Text style={styles.infoText}>📧 {user?.email}</Text>
          {user?.contactNumber ? <Text style={styles.infoText}>📞 {user?.contactNumber}</Text> : null}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { color: COLORS.muted, fontSize: 13 },
  userName: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginTop: 2 },
  roleBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleBadgeAdmin: { borderColor: COLORS.primary, backgroundColor: '#1A1535' },
  roleText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },

  banner: {
    margin: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  bannerText: { flex: 1 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },
  bannerEmoji: { fontSize: 42, marginLeft: 12 },

  sectionTitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 24,
  },
  moduleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    width: '46.5%',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  moduleEmoji: { fontSize: 28, marginBottom: 10 },
  moduleTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  moduleSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 4 },

  adminCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  adminCardInner: { flexDirection: 'row', alignItems: 'center' },
  adminEmoji: { fontSize: 28, marginRight: 14 },
  adminTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  adminSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  adminArrow: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },

  infoCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: { color: COLORS.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  infoText: { color: COLORS.text, fontSize: 14, marginBottom: 6 },
});
