import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useEffect } from 'react';
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
  purple: '#6C63FF',
  success: '#10B981',
  warn: '#F59E0B',
  danger: '#EF4444',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  inputBg: '#1A2035',
};

// ─── Quick action cards data ──────────────────────────────────────────────────
const ACTIONS = [
  { icon: '🛒', label: 'Browse Store', desc: 'View products & make purchases', route: '/(tabs)/store', grad: ['#11998e', '#38ef7d'] },
  { icon: '🛡️', label: 'Warranty Claim', desc: 'Manage & submit your warranties', route: '/(tabs)/warranty', grad: ['#f2994a', '#f2c94c'] },
  { icon: '🔧', label: 'Service Request', desc: 'Submit a repair or return', route: '/(tabs)/service-ticket', grad: ['#1e3c72', '#2a5298'] },
  { icon: '🧾', label: 'Purchase History', desc: 'View all your past orders', route: '/(tabs)/purchase-history', grad: ['#4f46e5', '#7c3aed'] },
];

export default function ProfileScreen() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const router = useRouter();
  const { totalItems: cartCount } = useCart();

  // Unread notifications count (fetched once on mount)
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    api.get('/api/notifications/my')
      .then(r => setUnreadCount(r.data.unreadCount || 0))
      .catch(() => { });
  }, []);

  // Edit form state
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || '');
  const [contact, setContact] = useState(user?.contactNumber || '');

  // Change password modal state
  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  // ── Profile initials ─────────────────────────────────────────────────────
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const roleLabel = user?.role === 'ROLE_ADMIN' ? '⚡ ADMIN' : '👤 USER';

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  // ── Save profile ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'First name, last name, and email are required.');
      return;
    }
    if (contact && !/^\d{10}$/.test(contact)) {
      Alert.alert('Validation Error', 'Contact number must be exactly 10 digits.');
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      address: address.trim(),
      contactNumber: contact.trim(),
    });
    setSaving(false);
    if (result.success) {
      Alert.alert('✅ Saved', 'Your profile has been updated successfully.');
      setEditOpen(false);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  // ── Change password ──────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'All password fields are required.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    const result = await changePassword(currentPw, newPw);
    setPwLoading(false);
    if (result.success) {
      Alert.alert('✅ Password Changed', 'Your password has been updated successfully.');
      setPwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  // ── Quick action press ───────────────────────────────────────────────────
  const handleAction = (action) => {
    if (action.route) {
      router.push(action.route);
    } else {
      Alert.alert('Coming Soon', `${action.label} will be available soon.`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Top Bar ── */}
          <View style={styles.topBar}>
            <View style={styles.topBarBrand}>
              <Text style={styles.topBarLogo}>🖥️</Text>
              <Text style={styles.topBarTitle}>Customer Profile</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* ── Secondary Nav (Home · Notifications · View Cart) ── */}
          <View style={styles.secondaryNav}>
            <TouchableOpacity
              style={styles.navPill}
              onPress={() => router.push('/(tabs)/store')}
              activeOpacity={0.8}
            >
              <Text style={styles.navPillText}>🏠  Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navPill}
              onPress={() => router.push('/(tabs)/notifications')}
              activeOpacity={0.8}
            >
              <Text style={styles.navPillText}>🔔  Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navPill, styles.navPillCart]}
              onPress={() => router.push('/(tabs)/cart')}
              activeOpacity={0.8}
            >
              <Text style={styles.navPillText}>🛒  Cart</Text>
              {cartCount > 0 && (
                <View style={[styles.navBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.navBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Profile Card (blue gradient) ── */}
          <View style={styles.profileCard}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            {/* Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{fullName || 'Unknown User'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>

              {/* Detail grid */}
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏷️</Text>
                  <Text style={styles.detailText} numberOfLines={1}>@{user?.username}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📧</Text>
                  <Text style={styles.detailText} numberOfLines={1}>{user?.email}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📞</Text>
                  <Text style={styles.detailText}>{user?.contactNumber || '—'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏠</Text>
                  <Text style={styles.detailText} numberOfLines={1}>{user?.address || '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Edit Profile Section (collapsible) ── */}
          <View style={styles.editSection}>
            <TouchableOpacity
              style={styles.editToggle}
              onPress={() => setEditOpen(!editOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.editToggleText}>✏️  Edit Profile Details</Text>
              <Text style={styles.editChevron}>{editOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {editOpen && (
              <View style={styles.editBody}>
                {/* Name row */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>First Name</Text>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="John"
                      placeholderTextColor="#4A5568"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Last Name</Text>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Doe"
                      placeholderTextColor="#4A5568"
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#4A5568"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Address */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Home Address</Text>
                  <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="123 Main St, Colombo"
                    placeholderTextColor="#4A5568"
                  />
                </View>

                {/* Contact */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Contact Number</Text>
                  <TextInput
                    style={styles.input}
                    value={contact}
                    onChangeText={setContact}
                    placeholder="0771234567"
                    placeholderTextColor="#4A5568"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>

                <View style={styles.editDivider} />

                {/* Change Password shortcut */}
                <TouchableOpacity
                  style={styles.changePwBtn}
                  onPress={() => setPwModal(true)}
                >
                  <Text style={styles.changePwBtnText}>🔑  Change Password</Text>
                </TouchableOpacity>

                {/* Save */}
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Quick Actions ── */}
          <View style={styles.actionsSection}>
            <Text style={styles.actionsSectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={[styles.actionCard, { backgroundColor: action.grad[0] }]}
                  onPress={() => handleAction(action)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDesc}>{action.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.footerDivider} />
            <Text style={styles.footerTitle}>🖥️ TechLine Computers (Pvt) Ltd</Text>
            <Text style={styles.footerText}>© 2026 | Developed By IT_ITP_17 | Faculty of Computing | SLIIT</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={pwModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPwModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔑 Change Password</Text>
              <TouchableOpacity onPress={() => setPwModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {[
              { label: 'Current Password', value: currentPw, setter: setCurrentPw, show: showCur, toggleShow: () => setShowCur(!showCur) },
              { label: 'New Password', value: newPw, setter: setNewPw, show: showNew, toggleShow: () => setShowNew(!showNew) },
              { label: 'Confirm Password', value: confirmPw, setter: setConfirmPw, show: showCon, toggleShow: () => setShowCon(!showCon) },
            ].map((field, i) => (
              <View key={i} style={styles.modalFormGroup}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <View style={styles.pwRow}>
                  <TextInput
                    style={styles.pwInput}
                    value={field.value}
                    onChangeText={field.setter}
                    secureTextEntry={!field.show}
                    placeholder="••••••••"
                    placeholderTextColor="#4A5568"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={field.toggleShow} style={styles.eyeBtn}>
                    <Text style={styles.eyeText}>{field.show ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 8 }, pwLoading && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={pwLoading}
            >
              {pwLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.header,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  topBarBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarLogo: { fontSize: 22 },
  topBarTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  logoutBtn: {
    backgroundColor: C.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Secondary nav row
  secondaryNav: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.header,
    borderBottomWidth: 1, borderColor: C.border,
  },
  navPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    position: 'relative',
  },
  navPillCart: { borderColor: '#10B981' },
  navPillText: { color: C.text, fontSize: 13, fontWeight: '600' },
  navBadge: {
    backgroundColor: C.danger,
    borderRadius: 8, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, marginLeft: 2,
  },
  navBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Profile card — blue gradient
  profileCard: {
    margin: 16,
    borderRadius: 18,
    padding: 20,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  avatar: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
    marginBottom: 12,
  },
  roleBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  detailGrid: { gap: 6 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailIcon: { fontSize: 13 },
  detailText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, flex: 1 },

  // Edit section
  editSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: C.card,
  },
  editToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  editToggleText: { color: C.secondary, fontSize: 15, fontWeight: '700' },
  editChevron: { color: C.muted, fontSize: 14 },
  editBody: {
    padding: 18,
    borderTopWidth: 1.5,
    borderColor: C.border,
  },

  formRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  formGroup: { marginBottom: 14 },
  formLabel: {
    color: '#2a5298',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
  },
  editDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.border,
    marginVertical: 16,
  },
  changePwBtn: {
    borderWidth: 1.5,
    borderColor: C.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  changePwBtnText: { color: C.accent, fontWeight: '700', fontSize: 14 },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: C.secondary,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Quick actions
  actionsSection: { paddingHorizontal: 16, marginBottom: 16 },
  actionsSectionTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  actionDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 16 },

  // Footer
  footer: { paddingHorizontal: 30, paddingBottom: 32, alignItems: 'center' },
  footerDivider: {
    width: '80%', height: 1,
    backgroundColor: C.border,
    marginBottom: 16, marginTop: 8,
  },
  footerTitle: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  footerText: { color: C.muted, fontSize: 11, textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  modalClose: { color: C.muted, fontSize: 20, padding: 4 },
  modalFormGroup: { marginBottom: 14 },
  pwRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
  },
  pwInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12,
    color: C.text, fontSize: 15,
  },
  eyeBtn: { paddingHorizontal: 12 },
  eyeText: { fontSize: 18 },
});
