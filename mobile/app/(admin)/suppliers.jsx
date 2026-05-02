import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/api';

const COLORS = {
  bg: '#0A0F1E',
  header: '#0D1526',
  card: '#111827',
  border: '#1F2937',
  accent: '#f2994a', // matching the dashboard module color
  danger: '#EF4444',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  inputBg: '#1A2035',
};

export default function SuppliersScreen() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [score, setScore] = useState('5');
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/api/suppliers');
      setSuppliers(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleDelete = (id, supplierName) => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete ${supplierName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/suppliers/${id}`);
              fetchSuppliers();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete supplier');
            }
          },
        },
      ]
    );
  };

  const handleAddSupplier = async () => {
    if (!name || !contactPerson || !email || !phone) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/suppliers', {
        name,
        contactPerson,
        email,
        phone,
        deliveryReliabilityScore: Number(score) || 5,
      });
      setModalVisible(false);
      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setScore('5');
      fetchSuppliers();
    } catch (err) {
      Alert.alert('Error Details', err.response?.data?.message || err.message || JSON.stringify(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderSupplier = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.supplierName}>{item.name}</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id, item.name)}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.detailText}>👤 {item.contactPerson}</Text>
        <Text style={styles.detailText}>📧 {item.email}</Text>
        <Text style={styles.detailText}>📞 {item.phone}</Text>
        <Text style={styles.scoreText}>⭐ Reliability Score: {item.deliveryReliabilityScore}/5</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* PO Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionPrimary} onPress={() => router.push('/(admin)/purchase-orders/new')}>
          <Text style={styles.actionPrimaryText}>📝 New PO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionSecondary} onPress={() => router.push('/(admin)/purchase-orders')}>
          <Text style={styles.actionSecondaryText}>📋 All Orders</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item._id}
          renderItem={renderSupplier}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No suppliers found.</Text>}
        />
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Supplier</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Tech Parts Ltd" placeholderTextColor="#666" />
              
              <Text style={styles.label}>Contact Person</Text>
              <TextInput style={styles.input} value={contactPerson} onChangeText={setContactPerson} placeholder="John Doe" placeholderTextColor="#666" />
              
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="john@example.com" placeholderTextColor="#666" autoCapitalize="none" />
              
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0771234567" placeholderTextColor="#666" />
              
              <Text style={styles.label}>Reliability Score (1-5)</Text>
              <TextInput style={styles.input} value={score} onChangeText={setScore} keyboardType="numeric" maxLength={1} placeholder="5" placeholderTextColor="#666" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddSupplier} disabled={submitting}>
                  <Text style={styles.submitBtnText}>{submitting ? 'Saving...' : 'Save Supplier'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.header,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: { padding: 8 },
  backBtnText: { color: COLORS.muted, fontSize: 16 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  addBtn: { backgroundColor: COLORS.accent + '22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.accent },
  addBtnText: { color: COLORS.accent, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  actionPrimary: { flex: 1, backgroundColor: COLORS.accent, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionPrimaryText: { color: '#000', fontWeight: '800', fontSize: 13 },
  actionSecondary: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionSecondaryText: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
  
  listContainer: { padding: 16, gap: 12, paddingBottom: 40 },
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 40 },
  
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  supplierName: { color: COLORS.accent, fontSize: 18, fontWeight: '800' },
  deleteBtn: { backgroundColor: COLORS.danger + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: COLORS.danger },
  deleteBtnText: { color: COLORS.danger, fontSize: 12, fontWeight: '700' },
  cardBody: { gap: 6 },
  detailText: { color: COLORS.text, fontSize: 14 },
  scoreText: { color: COLORS.accent, fontSize: 13, fontWeight: '700', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 20 },
  label: { color: COLORS.muted, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: COLORS.inputBg, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 30, marginBottom: 20 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelBtnText: { color: COLORS.text, fontWeight: '700' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center' },
  submitBtnText: { color: '#000', fontWeight: '800' },
});
