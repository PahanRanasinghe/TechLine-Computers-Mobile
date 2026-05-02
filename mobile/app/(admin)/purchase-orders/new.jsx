import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../../services/api';

const COLORS = {
  bg: '#0A0F1E',
  header: '#0D1526',
  card: '#111827',
  border: '#1F2937',
  accent: '#f2994a',
  success: '#10B981',
  danger: '#EF4444',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  inputBg: '#1A2035',
};

export default function NewPurchaseOrderScreen() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState([{ id: Date.now(), product: '', quantity: '1', unitPrice: '' }]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supRes, prodRes] = await Promise.all([
          api.get('/api/suppliers'),
          api.get('/api/products')
        ]);
        setSuppliers(supRes.data.data);
        setProducts(prodRes.data.data);
      } catch (err) {
        Alert.alert('Error', 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), product: '', quantity: '1', unitPrice: '' }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto-fill price if product is selected
        if (field === 'product') {
          const prod = products.find(p => p._id === value);
          if (prod) updated.unitPrice = prod.unitPrice.toString();
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    items.forEach(item => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      total += q * p;
    });
    return total;
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      Alert.alert('Validation', 'Please select a supplier');
      return;
    }
    const validItems = items.filter(i => i.product && parseFloat(i.quantity) > 0 && parseFloat(i.unitPrice) >= 0);
    if (validItems.length === 0) {
      Alert.alert('Validation', 'Please add at least one valid item');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplier: selectedSupplier,
        items: validItems.map(i => ({
          product: i.product,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice)
        }))
      };
      
      await api.post('/api/purchase-orders', payload);
      Alert.alert('Success', 'Purchase order created!', [
        { text: 'OK', onPress: () => router.push('/(admin)/purchase-orders') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New PO</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Supplier Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Supplier</Text>
          <View style={styles.pickerWrap}>
            {/* Simple custom dropdown representation */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suppliers.map(sup => (
                <TouchableOpacity
                  key={sup._id}
                  style={[styles.chip, selectedSupplier === sup._id && styles.chipActive]}
                  onPress={() => setSelectedSupplier(sup._id)}
                >
                  <Text style={[styles.chipText, selectedSupplier === sup._id && styles.chipTextActive]}>
                    {sup.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Order Items</Text>
            <TouchableOpacity onPress={handleAddItem} style={styles.addSmallBtn}>
              <Text style={styles.addSmallBtnText}>+ Add Row</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>Item {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.subLabel}>Product</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {products.map(prod => {
                  const isActive = item.product === prod._id;
                  return (
                    <TouchableOpacity
                      key={prod._id}
                      style={[styles.prodChip, isActive && styles.prodChipActive]}
                      onPress={() => updateItem(item.id, 'product', prod._id)}
                    >
                      <Text style={[styles.prodChipText, isActive && styles.prodChipTextActive]}>
                        {prod.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.subLabel}>Qty</Text>
                  <TextInput
                    style={styles.input}
                    value={item.quantity}
                    onChangeText={(val) => updateItem(item.id, 'quantity', val)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.subLabel}>Unit Price (Rs)</Text>
                  <TextInput
                    style={styles.input}
                    value={item.unitPrice}
                    onChangeText={(val) => updateItem(item.id, 'unitPrice', val)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.lineTotalWrap}>
                <Text style={styles.lineTotalText}>
                  Line Total: Rs. {((parseFloat(item.quantity)||0) * (parseFloat(item.unitPrice)||0)).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>Rs. {calculateTotal().toLocaleString('en-LK', { minimumFractionDigits: 2 })}</Text>
          </View>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? 'Creating...' : 'Create Purchase Order'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.header, borderBottomWidth: 1, borderColor: COLORS.border },
  backBtn: { padding: 8, width: 60 },
  backBtnText: { color: COLORS.muted, fontSize: 16 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  subLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  
  pickerWrap: { flexDirection: 'row' },
  chip: { backgroundColor: COLORS.inputBg, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { color: COLORS.muted, fontWeight: '600' },
  chipTextActive: { color: '#000', fontWeight: '800' },

  addSmallBtn: { backgroundColor: COLORS.accent + '22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: COLORS.accent },
  addSmallBtnText: { color: COLORS.accent, fontSize: 12, fontWeight: '700' },

  itemCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderColor: COLORS.border, paddingBottom: 8 },
  itemTitle: { color: COLORS.accent, fontWeight: '700' },
  removeText: { color: COLORS.danger, fontSize: 18, fontWeight: '800' },

  prodChip: { backgroundColor: COLORS.inputBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  prodChipActive: { borderColor: COLORS.success, backgroundColor: COLORS.success + '22' },
  prodChipText: { color: COLORS.muted, fontSize: 12 },
  prodChipTextActive: { color: COLORS.success, fontWeight: '700' },

  row: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { backgroundColor: COLORS.inputBg, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, fontSize: 14 },
  
  lineTotalWrap: { marginTop: 12, alignItems: 'flex-end' },
  lineTotalText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },

  footer: { marginTop: 10, backgroundColor: COLORS.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  totalWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  totalValue: { color: COLORS.success, fontSize: 22, fontWeight: '800' },
  submitBtn: { backgroundColor: COLORS.success, padding: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
