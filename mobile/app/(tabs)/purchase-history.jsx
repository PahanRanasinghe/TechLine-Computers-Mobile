import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg:        '#0A0F1E',
  header:    '#0D1526',
  card:      '#111827',
  cardOpen:  '#0D1A36',
  border:    '#1F2937',
  primary:   '#1e3c72',
  secondary: '#2a5298',
  accent:    '#00d2ff',
  purple:    '#7C3AED',
  success:   '#10B981',
  warn:      '#F59E0B',
  danger:    '#EF4444',
  text:      '#F9FAFB',
  muted:     '#9CA3AF',
};

// ─── Category → emoji map ─────────────────────────────────────────────────────
const CAT_ICON = {
  'Processors':     '⚙️',
  'Graphics Cards': '🎮',
  'Memory (RAM)':   '💾',
  'Storage':        '💿',
  'Motherboards':   '🔌',
  'Power Supplies': '⚡',
  'Cooling':        '❄️',
  'Peripherals':    '🖱️',
  'Monitors':       '🖥️',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-LK', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/** Calculate warranty status from saleDate + warrantyMonths */
function warrantyStatus(saleDate, warrantyMonths) {
  if (!saleDate || !warrantyMonths || warrantyMonths <= 0) {
    return { label: 'No Warranty', style: 'none', icon: '—' };
  }
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(saleDate);
  expiry.setMonth(expiry.getMonth() + warrantyMonths);
  const msPerMonth  = 1000 * 60 * 60 * 24 * 30.4375;
  const remaining   = Math.floor((expiry - today) / msPerMonth);

  if (remaining < 0)  return { label: 'Expired',                              style: 'expired', icon: '❌' };
  if (remaining <= 3) return { label: remaining === 0 ? 'Expires this month' : `${remaining} mo. left`, style: 'soon',    icon: '⚠️' };
  return               { label: `${remaining} mo. left`,                      style: 'active',  icon: '✅' };
}

// ─── Warranty Badge ───────────────────────────────────────────────────────────
function WarrantyBadge({ saleDate, warrantyMonths }) {
  const w = warrantyStatus(saleDate, warrantyMonths);
  const bg    = { active: '#14532D', soon: '#78350F', expired: '#7F1D1D', none: '#1F2937' };
  const color = { active: '#6EE7B7', soon: '#FCD34D', expired: '#FCA5A5', none: '#6B7280' };
  return (
    <View style={[styles.warrantyBadge, { backgroundColor: bg[w.style] }]}>
      <Text style={[styles.warrantyText, { color: color[w.style] }]}>
        {w.icon}  {w.label}
      </Text>
    </View>
  );
}

// ─── Order Card (accordion) ───────────────────────────────────────────────────
function OrderCard({ order, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  const deliveryBg  = open ? 'rgba(255,255,255,0.2)' : '#E0F2FE';
  const deliveryCol = open ? '#fff'                   : '#0369A1';
  const paymentBg   = open ? 'rgba(255,255,255,0.2)' : '#DCFCE7';
  const paymentCol  = open ? '#fff'                   : '#166534';

  return (
    <View style={[styles.orderCard, open && styles.orderCardOpen]}>

      {/* ── Header (tap to toggle) ── */}
      <TouchableOpacity
        style={[styles.orderHeader, open && styles.orderHeaderOpen]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1, gap: 6 }}>
          {/* Order ID + date */}
          <View style={styles.orderMetaRow}>
            <Text style={[styles.orderId, open && { color: '#fff' }]}>
              Order #{order._id.slice(-6).toUpperCase()}
            </Text>
            <Text style={[styles.orderDate, open && { color: 'rgba(255,255,255,0.75)' }]}>
              {fmtDate(order.saleDate)}
            </Text>
          </View>
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: deliveryBg }]}>
              <Text style={[styles.badgeText, { color: deliveryCol }]}>
                📦 {order.deliveryMethod}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: paymentBg }]}>
              <Text style={[styles.badgeText, { color: paymentCol }]}>
                💳 {order.paymentMethod}
              </Text>
            </View>
          </View>
        </View>

        {/* Total + chevron */}
        <View style={styles.orderRight}>
          <Text style={[styles.orderTotal, open && { color: '#86EFAC' }]}>
            {fmt(order.totalAmount)}
          </Text>
          <Text style={[styles.chevron, open && { transform: [{ rotate: '180deg' }] }]}>▼</Text>
        </View>
      </TouchableOpacity>

      {/* ── Body (expanded) ── */}
      {open && (
        <View style={styles.orderBody}>

          {/* Item rows */}
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              {/* Product icon + info */}
              <View style={styles.itemIconBg}>
                <Text style={styles.itemIcon}>
                  {CAT_ICON[item.category] || '🔧'}
                </Text>
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.itemCode}>Code: {item.productCode}</Text>

                {/* Category tag */}
                {item.category ? (
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item.category}</Text>
                  </View>
                ) : null}

                {/* Price row */}
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemQtyPrice}>
                    {item.quantity} × {fmt(item.unitPrice)}
                  </Text>
                  <Text style={styles.itemSubtotal}>{fmt(item.subtotal)}</Text>
                </View>

                {/* Warranty badge */}
                <WarrantyBadge saleDate={order.saleDate} warrantyMonths={item.warrantyMonths} />
              </View>
            </View>
          ))}

          {/* Order summary box */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.summaryValue}>{order.deliveryMethod}</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Payment</Text>
              <Text style={styles.summaryValue}>{order.paymentMethod}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryLine}>
              <Text style={styles.summaryTotalLabel}>Total Paid</Text>
              <Text style={styles.summaryTotalValue}>{fmt(order.totalAmount)}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PurchaseHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/my');
      setOrders(res.data.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load purchase history. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  const handleRefresh = () => { setRefreshing(true); fetchOrders(); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>🧾 Purchase History</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* ── Sub-header info ── */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          {user?.firstName}'s orders · {orders.length} total
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/store')} style={styles.storeBtn}>
          <Text style={styles.storeBtnText}>🛒 Store</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
      >
        {/* ── Loading ── */}
        {loading && (
          <View style={styles.centeredBox}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!loading && orders.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No purchases yet</Text>
            <Text style={styles.emptyDesc}>
              Your completed orders will appear here once you make a purchase.
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push('/(tabs)/store')}
              activeOpacity={0.85}
            >
              <Text style={styles.shopBtnText}>🛒  Browse the Store</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Order cards ── */}
        {!loading && orders.map((order, idx) => (
          <OrderCard key={order._id} order={order} defaultOpen={idx === 0} />
        ))}

        {/* Footer */}
        {!loading && orders.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerText}>🖥️ TechLine Computers (Pvt) Ltd</Text>
            <Text style={styles.footerText}>© 2026 | IT_ITP_17 | SLIIT</Text>
          </View>
        )}
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
  pageTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  backBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: C.secondary, borderRadius: 10,
  },
  backBtnText: { color: C.accent, fontWeight: '700', fontSize: 13 },

  // Sub header
  subHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.header, borderBottomWidth: 1, borderColor: C.border,
  },
  subHeaderText: { color: C.muted, fontSize: 13 },
  storeBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: C.border,
  },
  storeBtnText: { color: C.text, fontSize: 12, fontWeight: '600' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Centered loader / empty
  centeredBox: { alignItems: 'center', paddingTop: 80, gap: 12 },
  loadingText: { color: C.muted, fontSize: 14 },

  // Empty state
  emptyState: {
    backgroundColor: C.card, borderRadius: 20, padding: 40,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
    marginTop: 20,
  },
  emptyIcon:  { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyDesc:  { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  shopBtn: {
    backgroundColor: '#11998e', paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 12, shadowColor: '#11998e',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Order card
  orderCard: {
    backgroundColor: C.card, borderRadius: 18,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  orderCardOpen: { borderColor: C.secondary },

  // Order header
  orderHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, backgroundColor: '#1A2035',
  },
  orderHeaderOpen: { backgroundColor: C.primary },

  orderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  orderId:      { color: C.text, fontWeight: '700', fontSize: 15 },
  orderDate:    { color: C.muted, fontSize: 12 },

  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText:{ fontSize: 11, fontWeight: '600' },

  orderRight: { alignItems: 'flex-end', gap: 6, marginLeft: 12 },
  orderTotal: { color: C.success, fontWeight: '800', fontSize: 15, whiteSpace: 'nowrap' },
  chevron:    { color: C.muted, fontSize: 12 },

  // Order body
  orderBody: { padding: 16, borderTopWidth: 1, borderColor: C.border },

  // Item row
  itemRow: {
    flexDirection: 'row', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderColor: C.border,
  },
  itemIconBg: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: C.header, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, flexShrink: 0,
  },
  itemIcon: { fontSize: 26 },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { color: C.text, fontWeight: '700', fontSize: 14 },
  itemCode: { color: C.muted, fontSize: 11 },

  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#4C1D95',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  categoryTagText: { color: '#C4B5FD', fontSize: 10, fontWeight: '600' },

  itemPriceRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  itemQtyPrice:  { color: C.muted, fontSize: 12 },
  itemSubtotal:  { color: C.text, fontWeight: '700', fontSize: 13 },

  // Warranty badge
  warrantyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 4,
  },
  warrantyText: { fontSize: 11, fontWeight: '700' },

  // Order summary box
  summaryBox: {
    backgroundColor: '#1A2035', borderRadius: 12,
    padding: 14, marginTop: 16,
    borderWidth: 1, borderColor: C.border,
  },
  summaryLine: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  summaryLabel: { color: C.muted, fontSize: 13 },
  summaryValue: { color: C.text, fontSize: 13, fontWeight: '600' },
  summaryDivider: {
    borderTopWidth: 1, borderStyle: 'dashed',
    borderColor: C.border, marginVertical: 8,
  },
  summaryTotalLabel: { color: C.text, fontSize: 15, fontWeight: '700' },
  summaryTotalValue: { color: '#86EFAC', fontSize: 16, fontWeight: '800' },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerDivider: {
    width: '80%', height: 1, backgroundColor: C.border, marginBottom: 14,
  },
  footerText: { color: '#374151', fontSize: 11, marginBottom: 3 },
});
