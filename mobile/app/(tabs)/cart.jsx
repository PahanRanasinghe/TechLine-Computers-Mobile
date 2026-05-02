import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const C = {
  bg:       '#0A0F1E',
  header:   '#0D1526',
  card:     '#111827',
  border:   '#1F2937',
  primary:  '#1e3c72',
  secondary:'#2a5298',
  accent:   '#00d2ff',
  success:  '#10B981',
  danger:   '#EF4444',
  text:     '#F9FAFB',
  muted:    '#9CA3AF',
  inputBg:  '#1A2035',
};

const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const DELIVERY_OPTIONS = ['Store Pickup', 'Home Delivery'];
const PAYMENT_OPTIONS  = ['Cash', 'Card', 'Bank Transfer', 'Online'];

const CAT_ICON = {
  'Processors': '⚙️', 'Graphics Cards': '🎮', 'Memory (RAM)': '💾',
  'Storage': '💿', 'Motherboards': '🔌', 'Power Supplies': '⚡',
  'Cooling': '❄️', 'Peripherals': '🖱️', 'Monitors': '🖥️',
};

export default function CartScreen() {
  const router = useRouter();
  const { items, totalItems, grandTotal, removeFromCart, updateQty, clearCart } = useCart();
  const { user } = useAuth();

  const [checkoutOpen,  setCheckoutOpen]  = useState(false);
  const [deliveryMethod,setDeliveryMethod]= useState('Store Pickup');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [placing,       setPlacing]       = useState(false);

  // ── Place Order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      await api.post('/api/orders', {
        items: items.map(i => ({
          productId:     i.productId,
          productCode:   i.productCode,
          productName:   i.productName,
          category:      i.category,
          warrantyMonths:i.warrantyMonths,
          quantity:      i.quantity,
          unitPrice:     i.unitPrice,
          subtotal:      i.subtotal,
        })),
        totalAmount:   grandTotal,
        deliveryMethod,
        paymentMethod,
      });
      clearCart();
      setCheckoutOpen(false);
      Alert.alert(
        '✅ Order Placed!',
        "Your order has been confirmed. You can view it in Purchase History.",
        [{ text: 'View Orders', onPress: () => router.push('/(tabs)/purchase-history') },
         { text: 'Continue Shopping', onPress: () => router.push('/(tabs)/store') }]
      );
    } catch (err) {
      Alert.alert('Order Failed', err.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const handleRemove = (productId, name) => {
    Alert.alert('Remove Item', `Remove "${name}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(productId) },
    ]);
  };

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>🛒 Shopping Cart</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyDesc}>
            Looks like you haven't added anything yet.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push('/(tabs)/store')}
            activeOpacity={0.85}
          >
            <Text style={styles.shopBtnText}>🛍️  Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Cart with items ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.pageTitle}>🛒 Your Cart</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{totalItems}</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ])}
            activeOpacity={0.8}
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)/store')} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Shop</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Cart items */}
        <View style={styles.itemsCard}>
          {items.map((item, idx) => (
            <View key={item.productId} style={[styles.itemRow, idx < items.length - 1 && styles.itemRowBorder]}>
              {/* Icon */}
              <View style={styles.itemIconBg}>
                <Text style={styles.itemIcon}>{CAT_ICON[item.category] || '📦'}</Text>
              </View>

              {/* Info */}
              <View style={styles.itemInfo}>
                <Text style={styles.itemCode}>#{item.productCode}</Text>
                <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                <Text style={styles.itemUnitPrice}>{fmt(item.unitPrice)} each</Text>

                {/* Qty controls */}
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item.productId, item.quantity - 1)}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item.productId, item.quantity + 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Subtotal + remove */}
              <View style={styles.itemRight}>
                <Text style={styles.itemSubtotal}>{fmt(item.subtotal)}</Text>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(item.productId, item.productName)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Total box */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalAmount}>{fmt(grandTotal)}</Text>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => setCheckoutOpen(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout  ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🖥️ TechLine Computers (Pvt) Ltd</Text>
          <Text style={styles.footerText}>© 2026 | IT_ITP_17 | SLIIT</Text>
        </View>
      </ScrollView>

      {/* ── Checkout Modal ── */}
      <Modal visible={checkoutOpen} transparent animationType="slide" onRequestClose={() => setCheckoutOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🧾 Checkout</Text>
              <TouchableOpacity onPress={() => setCheckoutOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Customer info (readonly) */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Customer</Text>
              <Text style={styles.modalInfoText}>
                {user?.firstName} {user?.lastName}  ·  {user?.email}
              </Text>
            </View>

            {/* Delivery method */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Delivery Method</Text>
              <View style={styles.optionRow}>
                {DELIVERY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionChip, deliveryMethod === opt && styles.optionChipActive]}
                    onPress={() => setDeliveryMethod(opt)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionChipText, deliveryMethod === opt && styles.optionChipTextActive]}>
                      {opt === 'Store Pickup' ? '🏪' : '🚚'}  {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment method */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Payment Method</Text>
              <View style={styles.optionRow}>
                {PAYMENT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionChip, paymentMethod === opt && styles.optionChipActive]}
                    onPress={() => setPaymentMethod(opt)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionChipText, paymentMethod === opt && styles.optionChipTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Order summary */}
            <View style={styles.modalSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items ({totalItems})</Text>
                <Text style={styles.summaryValue}>{fmt(grandTotal)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>{fmt(grandTotal)}</Text>
              </View>
            </View>

            {/* Place Order */}
            <TouchableOpacity
              style={[styles.placeOrderBtn, placing && { opacity: 0.7 }]}
              onPress={handlePlaceOrder}
              disabled={placing}
              activeOpacity={0.85}
            >
              {placing
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.placeOrderBtnText}>✅  Place Order</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.header, borderBottomWidth: 1, borderColor: C.border,
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarRight: { flexDirection: 'row', gap: 8 },
  pageTitle:   { color: C.text, fontSize: 17, fontWeight: '800' },
  countBadge: {
    backgroundColor: C.success, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10, minWidth: 24, alignItems: 'center',
  },
  countBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.card, borderRadius: 8,
    borderWidth: 1, borderColor: C.danger,
  },
  clearBtnText: { color: C.danger, fontWeight: '700', fontSize: 12 },
  backBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: C.secondary, borderRadius: 10,
  },
  backBtnText: { color: C.accent, fontWeight: '700', fontSize: 13 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Items card
  itemsCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  itemRow: { flexDirection: 'row', padding: 14, gap: 12, alignItems: 'flex-start' },
  itemRowBorder: { borderBottomWidth: 1, borderColor: C.border },

  itemIconBg: {
    width: 50, height: 50, borderRadius: 12,
    backgroundColor: C.header, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, flexShrink: 0,
  },
  itemIcon:      { fontSize: 24 },
  itemInfo:      { flex: 1, gap: 4 },
  itemCode:      { color: C.muted, fontSize: 11, fontWeight: '600' },
  itemName:      { color: C.text, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  itemUnitPrice: { color: C.muted, fontSize: 12 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, lineHeight: 20 },
  qtyNum:     { color: C.text, fontWeight: '700', fontSize: 15, minWidth: 20, textAlign: 'center' },

  itemRight:   { alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  itemSubtotal:{ color: C.success, fontWeight: '800', fontSize: 14 },
  removeBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#7F1D1D', borderRadius: 6,
  },
  removeBtnText: { color: '#FCA5A5', fontSize: 11, fontWeight: '700' },

  // Total box
  totalBox: {
    backgroundColor: C.card, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  totalLabel:  { color: C.muted, fontSize: 14, marginBottom: 6 },
  totalAmount: { color: C.success, fontSize: 28, fontWeight: '800', marginBottom: 16 },
  checkoutBtn: {
    backgroundColor: '#11998e', paddingHorizontal: 36, paddingVertical: 16,
    borderRadius: 12, width: '100%', alignItems: 'center',
    shadowColor: '#11998e', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  checkoutBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  // Empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  emptyIcon:  { fontSize: 72, marginBottom: 20 },
  emptyTitle: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 10 },
  emptyDesc:  { color: C.muted, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  shopBtn: {
    backgroundColor: '#11998e', paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 12, shadowColor: '#11998e',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  footer: {
    alignItems: 'center', paddingVertical: 20,
    borderTopWidth: 1, borderColor: C.border,
  },
  footerText: { color: '#374151', fontSize: 11, marginBottom: 3 },

  // Checkout modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 1, borderColor: C.border,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { color: C.text, fontSize: 19, fontWeight: '800' },
  modalClose: { color: C.muted, fontSize: 22, padding: 4 },

  modalSection: { marginBottom: 18 },
  modalSectionLabel: {
    color: C.secondary, fontWeight: '700', fontSize: 12,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
  },
  modalInfoText: { color: C.muted, fontSize: 14 },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.inputBg,
  },
  optionChipActive:    { borderColor: C.accent, backgroundColor: C.primary },
  optionChipText:      { color: C.muted, fontWeight: '600', fontSize: 13 },
  optionChipTextActive:{ color: '#fff' },

  modalSummary: {
    backgroundColor: '#1A2035', borderRadius: 12, padding: 14, marginBottom: 18,
    borderWidth: 1, borderColor: C.border,
  },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel:      { color: C.muted, fontSize: 14 },
  summaryValue:      { color: C.text, fontWeight: '600', fontSize: 14 },
  summaryDivider:    { borderTopWidth: 1, borderStyle: 'dashed', borderColor: C.border, marginVertical: 8 },
  summaryTotalLabel: { color: C.text, fontSize: 16, fontWeight: '700' },
  summaryTotalValue: { color: '#86EFAC', fontSize: 18, fontWeight: '800' },

  placeOrderBtn: {
    backgroundColor: C.success, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', shadowColor: C.success,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  placeOrderBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
