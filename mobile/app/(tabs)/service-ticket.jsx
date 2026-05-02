import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
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
  border:    '#1F2937',
  primary:   '#1e3c72',
  secondary: '#2a5298',
  accent:    '#00d2ff',
  success:   '#10B981',
  danger:    '#EF4444',
  text:      '#F9FAFB',
  muted:     '#9CA3AF',
  inputBg:   '#1A2035',
  readonly:  '#0D1526',
};

const STATUS_COLORS = {
  'Pending':     '#F59E0B',
  'In Progress': '#3B82F6',
  'Completed':   '#10B981',
  'Rejected':    '#EF4444',
};

const SERVICE_TYPES = [
  { value: 'Repair',      label: '🔧 Repair',      desc: 'Fix a faulty or broken product' },
  { value: 'Return',      label: '📦 Return',      desc: 'Return an unwanted item' },
  { value: 'Replacement', label: '🔄 Replacement', desc: 'Replace a defective product' },
  { value: 'Other',       label: '❓ Other',       desc: 'Any other service request' },
];

export default function CustomerServiceTicketScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Form state
  const [productCode,  setProductCode]  = useState('');
  const [productName,  setProductName]  = useState('');
  const [serviceType,  setServiceType]  = useState('Repair');
  const [description,  setDescription]  = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  // Product picker
  const [products,     setProducts]     = useState([]);
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [prodSearch,   setProdSearch]   = useState('');

  // Service type picker
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // My tickets history
  const [myTickets,    setMyTickets]    = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showHistory,  setShowHistory]  = useState(false);

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const email    = user?.email || '';

  // ── Load purchased products for picker ──────────────────────────────────
  useEffect(() => {
    api.get('/api/orders/my')
      .then(r => {
        const purchased = [];
        const seen = new Set();
        (r.data.data || []).forEach(o => {
          (o.items || []).forEach(i => {
            if (!seen.has(i.productCode)) {
              seen.add(i.productCode);
              purchased.push({ _id: i.productId || i.productCode, code: i.productCode, name: i.productName, category: i.category });
            }
          });
        });
        setProducts(purchased);
      })
      .catch(() => {});
  }, []);

  // ── Load my past tickets ────────────────────────────────────────────────
  const loadMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await api.get('/api/service-tickets/my');
      setMyTickets(res.data.data);
    } catch {
      setMyTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => { loadMyTickets(); }, []);

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!productCode.trim()) {
      Alert.alert('Validation Error', 'Please select or enter a product code.');
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      Alert.alert('Validation Error', 'Please describe the issue in at least 20 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/service-tickets', {
        productCode:  productCode.trim(),
        productName:  productName.trim(),
        serviceType,
        description:  description.trim(),
      });
      setSubmitted(true);
      setProductCode('');
      setProductName('');
      setServiceType('Repair');
      setDescription('');
      loadMyTickets();
    } catch (err) {
      Alert.alert('Submission Failed', err.response?.data?.message || 'Could not submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const selectedType = SERVICE_TYPES.find(t => t.value === serviceType);

  const StatusBadge = ({ status }) => (
    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[status] || '#6B7280') + '22' }]}>
      <Text style={[styles.statusText, { color: STATUS_COLORS[status] || '#6B7280' }]}>{status}</Text>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Back to Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/store')} style={styles.navBtn}>
            <Text style={styles.navBtnText}>🛒 Store</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Form Card ── */}
          <View style={styles.formCard}>

            {/* Intro */}
            <View style={styles.formIntro}>
              <Text style={styles.wrenchIcon}>🔧</Text>
              <Text style={styles.formTitle}>Service Request</Text>
              <Text style={styles.formSubtitle}>
                Submit a repair or return request. Our Customer Service team will review it and get back to you.
              </Text>
            </View>

            {/* ── Success Banner ── */}
            {submitted && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  ✅ Your service request has been submitted! We'll be in touch shortly.
                </Text>
                <TouchableOpacity onPress={() => setSubmitted(false)} style={styles.successDismiss}>
                  <Text style={styles.successDismissText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Full Name (readonly) ── */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.readonlyInput}>
                <Text style={styles.readonlyIcon}>👤</Text>
                <Text style={styles.readonlyText}>{fullName || 'Not set'}</Text>
                <View style={styles.autoBadge}><Text style={styles.autoBadgeText}>Auto-filled</Text></View>
              </View>
            </View>

            {/* ── Email (readonly) ── */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.readonlyInput}>
                <Text style={styles.readonlyIcon}>📧</Text>
                <Text style={styles.readonlyText}>{email}</Text>
                <View style={styles.autoBadge}><Text style={styles.autoBadgeText}>Auto-filled</Text></View>
              </View>
            </View>

            {/* ── Service Type ── */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Service Type</Text>
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => setTypePickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerIcon}>{selectedType?.label.split(' ')[0]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerText}>{selectedType?.label}</Text>
                  <Text style={styles.pickerSubText}>{selectedType?.desc}</Text>
                </View>
                <Text style={styles.pickerChevron}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* ── Product Picker ── */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product</Text>
              <TouchableOpacity
                style={styles.pickerTrigger}
                onPress={() => setPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.pickerIcon}>📦</Text>
                <Text style={[styles.pickerText, !productCode && { color: '#4A5568' }]}>
                  {productCode ? `${productName} (${productCode})` : '— Select a product —'}
                </Text>
                <Text style={styles.pickerChevron}>▼</Text>
              </TouchableOpacity>
              {!productCode && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Or enter product code manually (e.g. CPU-001)"
                  placeholderTextColor="#4A5568"
                  value={productCode}
                  onChangeText={(t) => { setProductCode(t.toUpperCase()); setProductName(''); }}
                  autoCapitalize="characters"
                />
              )}
              {productCode ? (
                <TouchableOpacity onPress={() => { setProductCode(''); setProductName(''); }} style={styles.clearProduct}>
                  <Text style={styles.clearProductText}>✕ Clear selection</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* ── Issue Description ── */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Issue Description</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Please describe the problem or reason for the service request in detail..."
                placeholderTextColor="#4A5568"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length} chars (min 20)</Text>
            </View>

            {/* ── Submit Button ── */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>🔧  Submit Service Request</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── My Tickets History ── */}
          <View style={styles.historySection}>
            <TouchableOpacity
              style={styles.historyToggle}
              onPress={() => setShowHistory(!showHistory)}
              activeOpacity={0.8}
            >
              <Text style={styles.historyToggleText}>🎫  My Service Tickets</Text>
              <Text style={styles.historyChevron}>{showHistory ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showHistory && (
              <View style={styles.historyBody}>
                {loadingTickets ? (
                  <ActivityIndicator color={C.accent} style={{ marginVertical: 20 }} />
                ) : myTickets.length === 0 ? (
                  <View style={styles.emptyHistory}>
                    <Text style={styles.emptyHistoryIcon}>🎫</Text>
                    <Text style={styles.emptyHistoryText}>No service tickets yet.</Text>
                  </View>
                ) : (
                  myTickets.map((ticket) => (
                    <View key={ticket._id} style={styles.ticketCard}>
                      <View style={styles.ticketHeader}>
                        <View>
                          <Text style={styles.ticketCode}>{ticket.productCode}</Text>
                          <Text style={styles.ticketType}>{ticket.serviceType}</Text>
                        </View>
                        <StatusBadge status={ticket.status} />
                      </View>
                      {ticket.productName ? (
                        <Text style={styles.ticketProductName}>{ticket.productName}</Text>
                      ) : null}
                      <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>
                      <Text style={styles.ticketDate}>
                        Submitted: {new Date(ticket.createdAt).toLocaleDateString('en-LK', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>🖥️ TechLine Computers (Pvt) Ltd</Text>
            <Text style={styles.footerText}>© 2026 | IT_ITP_17 | SLIIT</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Service Type Picker Modal ── */}
      <Modal visible={typePickerOpen} transparent animationType="slide" onRequestClose={() => setTypePickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service Type</Text>
              <TouchableOpacity onPress={() => setTypePickerOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {SERVICE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.typePickerItem, serviceType === type.value && styles.typePickerItemActive]}
                onPress={() => { setServiceType(type.value); setTypePickerOpen(false); }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.typePickerLabel}>{type.label}</Text>
                  <Text style={styles.typePickerDesc}>{type.desc}</Text>
                </View>
                {serviceType === type.value && <Text style={{ color: C.success, fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── Product Picker Modal ── */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearch}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
              <TextInput
                style={{ flex: 1, color: C.text, fontSize: 14 }}
                placeholder="Search products..."
                placeholderTextColor="#4A5568"
                value={prodSearch}
                onChangeText={setProdSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item._id}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productPickerItem}
                  onPress={() => {
                    setProductCode(item.code);
                    setProductName(item.name);
                    setPickerOpen(false);
                    setProdSearch('');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productPickerName}>{item.name}</Text>
                    <Text style={styles.productPickerCode}>{item.code} · {item.category}</Text>
                  </View>
                  {productCode === item.code && (
                    <Text style={{ color: C.success, fontSize: 18 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: C.muted, textAlign: 'center', padding: 20 }}>No products found.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.header, borderBottomWidth: 1, borderColor: C.border,
  },
  backBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: C.secondary, borderRadius: 10,
  },
  backBtnText: { color: C.accent, fontWeight: '700', fontSize: 13 },
  navBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: C.border,
  },
  navBtnText: { color: C.text, fontSize: 13, fontWeight: '600' },

  formCard: {
    margin: 16, backgroundColor: C.card, borderRadius: 20, padding: 22,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 10,
  },
  formIntro: { alignItems: 'center', marginBottom: 24 },
  wrenchIcon: { fontSize: 54, marginBottom: 10 },
  formTitle: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginBottom: 6 },
  formSubtitle: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  successBox: {
    backgroundColor: '#065F46', borderRadius: 12, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: C.success, alignItems: 'center', gap: 10,
  },
  successText:    { color: '#6EE7B7', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  successDismiss: { paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: C.success, borderRadius: 8 },
  successDismissText: { color: C.success, fontWeight: '600', fontSize: 12 },

  formGroup: { marginBottom: 18 },
  label: {
    color: C.secondary, fontWeight: '700', fontSize: 12,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  input: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: C.text, fontSize: 15,
  },
  textarea:  { minHeight: 130, paddingTop: 12 },
  charCount: { color: C.muted, fontSize: 11, textAlign: 'right', marginTop: 4 },

  readonlyInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.readonly, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, gap: 8,
  },
  readonlyIcon: { fontSize: 16 },
  readonlyText: { flex: 1, color: C.muted, fontSize: 15 },
  autoBadge: {
    backgroundColor: C.primary + '55', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  autoBadgeText: { color: C.accent, fontSize: 10, fontWeight: '700' },

  pickerTrigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  pickerIcon:    { fontSize: 18 },
  pickerText:    { flex: 1, color: C.text, fontSize: 14, fontWeight: '600' },
  pickerSubText: { color: C.muted, fontSize: 11, marginTop: 2 },
  pickerChevron: { color: C.muted, fontSize: 12 },
  clearProduct:  { marginTop: 8, alignSelf: 'flex-start' },
  clearProductText: { color: C.danger, fontSize: 13, fontWeight: '600' },

  // Submit — blue gradient to match web
  submitBtn: {
    borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 6,
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  historySection: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 16,
    overflow: 'hidden', backgroundColor: C.card,
  },
  historyToggle: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 18,
  },
  historyToggleText: { color: C.text, fontSize: 15, fontWeight: '700' },
  historyChevron:    { color: C.muted, fontSize: 14 },
  historyBody:       { padding: 14, borderTopWidth: 1, borderColor: C.border },

  emptyHistory:     { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyHistoryIcon: { fontSize: 36 },
  emptyHistoryText: { color: C.muted, fontSize: 14 },

  ticketCard: {
    backgroundColor: C.bg, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
  },
  ticketHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  ticketCode:        { color: C.accent, fontWeight: '800', fontSize: 14 },
  ticketType:        { color: C.muted, fontSize: 11, marginTop: 2 },
  ticketProductName: { color: C.text, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  ticketDesc:        { color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  ticketDate:        { color: '#374151', fontSize: 11 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText:  { fontSize: 11, fontWeight: '700' },

  footer: {
    alignItems: 'center', paddingVertical: 24,
    borderTopWidth: 1, borderColor: C.border, marginTop: 4,
  },
  footerText: { color: '#374151', fontSize: 11, marginBottom: 3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, borderTopWidth: 1, borderColor: C.border, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  modalTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  modalClose: { color: C.muted, fontSize: 20, padding: 4 },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, paddingVertical: 8,
  },

  typePickerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 4,
    borderBottomWidth: 1, borderColor: C.border,
  },
  typePickerItemActive: { backgroundColor: C.primary + '22', borderRadius: 8 },
  typePickerLabel:      { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  typePickerDesc:       { color: C.muted, fontSize: 12 },

  productPickerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderColor: C.border,
  },
  productPickerName: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  productPickerCode: { color: C.muted, fontSize: 12 },
});
