import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0F1E',
  header: '#0D1526',
  card: '#111827',
  border: '#1F2937',
  primary: '#1e3c72',
  secondary: '#2a5298',
  accent: '#00d2ff',
  success: '#10B981',
  warn: '#F59E0B',
  danger: '#EF4444',
  purple: '#7C3AED',
  text: '#F9FAFB',
  muted: '#9CA3AF',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) =>
  `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

// ─── Module Cards (mirrors web dashboard) ────────────────────────────────────
const MODULES = [
  { icon: '📦', label: 'INVENTORY', color: '#667eea', color2: '#764ba2', route: '/(admin)/inventory' },
  { icon: '🛒', label: 'ORDERS & SALES', color: '#11998e', color2: '#38ef7d', route: '/(admin)/sales' },
  { icon: '🏭', label: 'SUPPLIERS & PROCUREMENT', color: '#f2994a', color2: '#f2c94c', route: '/(admin)/suppliers' },
  { icon: '🛡️', label: 'WARRANTY & SERVICES', color: '#1e3c72', color2: '#2a5298', route: '/(admin)/warranty' },
  { icon: '👥', label: 'USER MANAGEMENT', color: '#4f46e5', color2: '#7c3aed', route: '/(admin)/users' },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, bg, alert }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: bg }]}>
      <View style={[styles.statIconBg, { backgroundColor: bg + '22' }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <View style={styles.statBody}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      {alert && (
        <View style={[styles.alertDot, { backgroundColor: C.warn }]}>
          <Text style={styles.alertDotText}>{alert}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Order Status Badge ───────────────────────────────────────────────────────
const STATUS_COLOR = {
  Completed: C.success,
  Pending: C.warn,
  Processing: '#3B82F6',
  Confirmed: '#06B6D4',
  Cancelled: C.danger,
};

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load dashboard stats.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/'); },
      },
    ]);
  };

  const handleModulePress = (mod) => {
    if (mod.route) {
      router.push(mod.route);
    } else {
      Alert.alert('Coming Soon', `${mod.label} module will be available in a future update.`);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarLogo}>🖥️</Text>
          <View>
            <Text style={styles.topBarTitle}>TechLine Computers</Text>
            <Text style={styles.topBarSub}>Admin Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchStats(); }}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
      >
        {/* ── Welcome banner ── */}
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeGreet}>Welcome back,</Text>
            <Text style={styles.welcomeName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMINISTRATOR</Text>
            </View>
          </View>
          <Text style={styles.welcomeEmoji}>🛡️</Text>
        </View>

        {/* ── Stats grid ── */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : stats ? (
          <>
            <Text style={styles.sectionTitle}>📊  Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard icon="👥" label="Registered Users" value={stats.totalUsers} bg={C.primary} />
              <StatCard icon="📦" label="Total Products" value={stats.totalProducts} bg="#667eea" />
              <StatCard icon="⚠️" label="Low Stock Items" value={stats.lowStockProducts} bg={C.warn}
                alert={stats.lowStockProducts > 0 ? stats.lowStockProducts : null} />
              <StatCard icon="🛒" label="Total Orders" value={stats.totalOrders} bg={C.success} />
              <StatCard icon="💰" label="Total Revenue" value={fmt(stats.totalRevenue)} bg="#11998e" />
              <StatCard icon="🛡️" label="Pending Warranty" value={stats.pendingWarranty} bg="#f2994a"
                alert={stats.pendingWarranty > 0 ? stats.pendingWarranty : null} />
              <StatCard icon="🔧" label="Pending Service" value={stats.pendingService} bg="#2a5298"
                alert={stats.pendingService > 0 ? stats.pendingService : null} />
              <StatCard icon="🔔" label="Unread Notifs" value={stats.unreadNotifications} bg={C.danger} />
            </View>

            {/* ── Recent Orders ── */}
            {stats.recentOrders?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🧾  Recent Orders</Text>
                <View style={styles.ordersCard}>
                  {stats.recentOrders.map((order, idx) => (
                    <View
                      key={order._id}
                      style={[styles.orderRow, idx < stats.recentOrders.length - 1 && styles.orderRowBorder]}
                    >
                      <View style={styles.orderRowLeft}>
                        <Text style={styles.orderCustomer}>{order.customerName}</Text>
                        <Text style={styles.orderMeta}>
                          {fmtDate(order.createdAt)}  ·  {order.paymentMethod}
                        </Text>
                      </View>
                      <View style={styles.orderRowRight}>
                        <Text style={styles.orderAmount}>{fmt(order.totalAmount)}</Text>
                        <View style={[styles.statusChip, { backgroundColor: (STATUS_COLOR[order.status] || '#6B7280') + '22' }]}>
                          <Text style={[styles.statusText, { color: STATUS_COLOR[order.status] || '#6B7280' }]}>
                            {order.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        ) : null}

        {/* ── Module Cards (mirrors web dashboard) ── */}
        <Text style={styles.sectionTitle}>🗂️  Modules</Text>
        <View style={styles.modulesGrid}>
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.label}
              style={[styles.moduleCard, { backgroundColor: mod.color }]}
              onPress={() => handleModulePress(mod)}
              activeOpacity={0.85}
            >
              <Text style={styles.moduleIcon}>{mod.icon}</Text>
              <Text style={styles.moduleLabel}>{mod.label}</Text>
              {mod.route ? (
                <Text style={styles.moduleAvail}>Tap to open →</Text>
              ) : (
                <Text style={styles.moduleComingSoon}>Coming soon</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerTitle}>🖥️ TechLine Computers (Pvt) Ltd</Text>
          <Text style={styles.footerText}>Faculty of Computing | SLIIT</Text>
          <Text style={styles.footerText}>© 2026 | Developed By IT_ITP_17</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.header, borderBottomWidth: 1, borderColor: C.border,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarLogo: { fontSize: 28 },
  topBarTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  topBarSub: { color: C.accent, fontSize: 11, fontWeight: '600', marginTop: 1 },
  logoutBtn: {
    backgroundColor: C.danger, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
  },
  logoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Welcome banner
  welcomeBanner: {
    backgroundColor: C.primary, borderRadius: 18, padding: 20, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  welcomeLeft: { flex: 1 },
  welcomeGreet: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 4 },
  welcomeName: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  adminBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  welcomeEmoji: { fontSize: 52 },

  sectionTitle: {
    color: C.text, fontSize: 15, fontWeight: '800',
    marginBottom: 12, marginTop: 4,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24,
  },
  statCard: {
    width: '47.5%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  statIconBg: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  statIcon: { fontSize: 20 },
  statBody: { flex: 1 },
  statValue: { color: C.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: C.muted, fontSize: 10, marginTop: 2 },
  alertDot: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  alertDotText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Recent orders
  ordersCard: {
    backgroundColor: C.card, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  orderRowBorder: { borderBottomWidth: 1, borderColor: C.border },
  orderRowLeft: { flex: 1, gap: 4 },
  orderCustomer: { color: C.text, fontSize: 13, fontWeight: '700' },
  orderMeta: { color: C.muted, fontSize: 11 },
  orderRowRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount: { color: C.success, fontSize: 13, fontWeight: '800' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },

  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: C.muted, fontSize: 14 },

  // Module cards (matches web grid)
  modulesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24,
  },
  moduleCard: {
    width: '47.5%', borderRadius: 16, padding: 22,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  moduleIcon: { fontSize: 42 },
  moduleLabel: {
    color: '#fff', fontSize: 12, fontWeight: '800',
    textAlign: 'center', letterSpacing: 0.5,
  },
  moduleAvail: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  moduleComingSoon: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontStyle: 'italic' },

  // Footer
  footer: { alignItems: 'center', paddingTop: 8 },
  footerDivider: { width: '80%', height: 1, backgroundColor: C.border, marginBottom: 16 },
  footerTitle: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  footerText: { color: C.muted, fontSize: 11, marginBottom: 2 },
});
