import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Switch, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg:       '#0A0F1E',
  header:   '#0D1526',
  card:     '#111827',
  border:   '#1F2937',
  primary:  '#1e3c72',
  secondary:'#2a5298',
  accent:   '#00d2ff',
  success:  '#10B981',
  warn:     '#F59E0B',
  danger:   '#EF4444',
  purple:   '#7C3AED',
  text:     '#F9FAFB',
  muted:    '#9CA3AF',
  inputBg:  '#1A2035',
};

const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-LK')}`;

const CAT_ICON = {
  'Processors': '⚙️', 'Graphics Cards': '🎮', 'Memory (RAM)': '💾',
  'Storage': '💿', 'Motherboards': '🔌', 'Power Supplies': '⚡',
  'Cooling': '❄️', 'Peripherals': '🖱️', 'Monitors': '🖥️',
};

const CATEGORIES = [
  'Processors', 'Graphics Cards', 'Memory (RAM)', 'Storage',
  'Motherboards', 'Power Supplies', 'Cooling', 'Peripherals', 'Monitors',
];

// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', code: '', category: 'Processors', brand: '',
  description: '', unitPrice: '', quantityInStock: '', warrantyPeriod: '', imageUrl: '', isActive: true,
};

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductFormModal({ visible, product, onClose, onSaved, allProducts }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  // Existing-product picker (only for Add mode)
  const [existPickerOpen, setExistPickerOpen] = useState(false);
  const [existSearch,     setExistSearch]     = useState('');

  // Image upload state
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name:            product.name            || '',
        code:            product.code            || '',
        category:        product.category        || 'Processors',
        brand:           product.brand           || '',
        description:     product.description     || '',
        unitPrice:       String(product.unitPrice || ''),
        quantityInStock: String(product.quantityInStock ?? ''),
        warrantyPeriod:  String(product.warrantyPeriod ?? ''),
        imageUrl:        product.imageUrl        || '',
        isActive:        product.isActive !== false,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [product, visible]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.category) {
      Alert.alert('Validation', 'Name, code and category are required.');
      return;
    }
    if (!form.unitPrice || isNaN(Number(form.unitPrice))) {
      Alert.alert('Validation', 'Enter a valid unit price.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name:            form.name.trim(),
        code:            form.code.trim().toUpperCase(),
        category:        form.category,
        brand:           form.brand.trim(),
        description:     form.description.trim(),
        unitPrice:       Number(form.unitPrice),
        quantityInStock: Number(form.quantityInStock) || 0,
        warrantyPeriod:  Number(form.warrantyPeriod) || 0,
        imageUrl:        form.imageUrl.trim(),
        isActive:        form.isActive,
      };
      if (product) {
        await api.put(`/api/products/${product._id}`, payload);
        Alert.alert('✅ Updated', `"${payload.name}" has been updated.`);
      } else {
        await api.post('/api/products', payload);
        Alert.alert('✅ Added', `"${payload.name}" has been added to inventory.`);
      }
      onSaved();
      onClose();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label, value, onChangeText, placeholder, keyboardType, multiline) => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 72, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || ''}
        placeholderTextColor="#4A5568"
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        autoCapitalize="none"
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {product ? '✏️ Edit Product' : '➕ Add Product'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

              {/* ── Choose Existing Product (Add mode only) ── */}
              {!product && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Choose Existing Product</Text>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={() => setExistPickerOpen(!existPickerOpen)}
                  >
                    <Text style={styles.pickerBtnIcon}>📋</Text>
                    <Text style={[styles.pickerBtnText, { color: '#4A5568' }]}>
                      — Select to auto-fill —
                    </Text>
                    <Text style={styles.pickerChevron}>{existPickerOpen ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {existPickerOpen && (
                    <View style={styles.catDropdown}>
                      <TextInput
                        style={[styles.input, { marginBottom: 8 }]}
                        placeholder="🔍 Search products..."
                        placeholderTextColor="#4A5568"
                        value={existSearch}
                        onChangeText={setExistSearch}
                        autoCapitalize="none"
                      />
                      <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                        {(allProducts || []).filter(p =>
                          p.name.toLowerCase().includes(existSearch.toLowerCase()) ||
                          p.code.toLowerCase().includes(existSearch.toLowerCase())
                        ).map(p => (
                          <TouchableOpacity
                            key={p._id}
                            style={[styles.catOption, { flexDirection: 'row', justifyContent: 'space-between' }]}
                            onPress={() => {
                              setForm({
                                name:            p.name,
                                code:            p.code,
                                category:        p.category || 'Processors',
                                brand:           p.brand || '',
                                description:     p.description || '',
                                unitPrice:       String(p.unitPrice || ''),
                                quantityInStock: String(p.quantityInStock ?? ''),
                                warrantyPeriod:  String(p.warrantyPeriod ?? ''),
                                imageUrl:        p.imageUrl || '',
                                isActive:        p.isActive !== false,
                              });
                              setExistPickerOpen(false);
                              setExistSearch('');
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.catOptionText}>{p.name}</Text>
                              <Text style={{ color: '#6B7280', fontSize: 11 }}>
                                {p.code} · Stock: {p.quantityInStock}
                              </Text>
                            </View>
                            {p.quantityInStock <= 5 && (
                              <View style={{ backgroundColor: '#F59E0B22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'center' }}>
                                <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '700' }}>LOW</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Name + Code */}
              {renderField('Product Name *', form.name, v => set('name', v), 'e.g. Intel Core i9')}
              {renderField('Product Code *', form.code, v => set('code', v), 'e.g. CPU-001')}

              {/* Category picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category *</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setCatOpen(!catOpen)}
                >
                  <Text style={styles.pickerBtnIcon}>{CAT_ICON[form.category] || '📦'}</Text>
                  <Text style={styles.pickerBtnText}>{form.category}</Text>
                  <Text style={styles.pickerChevron}>{catOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {catOpen && (
                  <View style={styles.catDropdown}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catOption, form.category === cat && styles.catOptionActive]}
                        onPress={() => { set('category', cat); setCatOpen(false); }}
                      >
                        <Text style={styles.catOptionText}>{CAT_ICON[cat]}  {cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {renderField('Brand', form.brand, v => set('brand', v), 'e.g. Intel')}
              {renderField('Image URL', form.imageUrl, v => set('imageUrl', v), 'https://...')}

              {/* Upload Image via gallery */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Upload an Image</Text>
                <TouchableOpacity
                  style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
                  disabled={uploading}
                  onPress={async () => {
                    try {
                      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (!permResult.granted) {
                        Alert.alert('Permission Required', 'Please allow access to your photo library.');
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        allowsEditing: true,
                        quality: 0.8,
                      });
                      if (result.canceled) return;

                      const asset = result.assets[0];
                      const uri = asset.uri;
                      const filename = uri.split('/').pop();
                      const match = /\.(\w+)$/.exec(filename);
                      const ext = match ? match[1] : 'jpg';
                      const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

                      const formData = new FormData();
                      formData.append('image', { uri, name: filename, type: mime });

                      setUploading(true);
                      const res = await api.post('/api/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      set('imageUrl', res.data.data.imageUrl);
                      Alert.alert('✅ Uploaded', 'Image uploaded successfully!');
                    } catch (err) {
                      Alert.alert('Upload Failed', err.response?.data?.message || 'Could not upload image.');
                    } finally {
                      setUploading(false);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.uploadBtnText}>📷  Choose from Gallery</Text>
                  )}
                </TouchableOpacity>
                {form.imageUrl ? (
                  <View style={styles.uploadPreview}>
                    <Image source={{ uri: form.imageUrl }} style={styles.uploadPreviewImg} />
                    <TouchableOpacity onPress={() => set('imageUrl', '')}>
                      <Text style={styles.uploadRemove}>✕ Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {renderField('Description', form.description, v => set('description', v), 'Specs…', 'default', true)}

              {/* Price + Stock row */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  {renderField('Unit Price (Rs.) *', form.unitPrice, v => set('unitPrice', v), '', 'numeric')}
                </View>
                <View style={{ flex: 1 }}>
                  {renderField('Qty in Stock', form.quantityInStock, v => set('quantityInStock', v), '', 'numeric')}
                </View>
              </View>

              {/* Warranty Period */}
              {renderField('Warranty Period (Years)', form.warrantyPeriod, v => set('warrantyPeriod', v), 'e.g. 2', 'numeric')}

              {/* Active toggle (edit only) */}
              {product && (
                <View style={styles.toggleRow}>
                  <Text style={styles.formLabel}>Active (visible in store)</Text>
                  <Switch
                    value={form.isActive}
                    onValueChange={v => set('isActive', v)}
                    trackColor={{ false: C.border, true: C.success + '66' }}
                    thumbColor={form.isActive ? C.success : C.muted}
                  />
                </View>
              )}

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>
                      {product ? '💾  Save Changes' : '➕  Add Product'}
                    </Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function InventoryScreen() {
  const router = useRouter();

  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [lowStockOnly,setLowStockOnly]= useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editTarget,  setEditTarget]  = useState(null); // null = add, product = edit
  const [allProducts, setAllProducts] = useState([]);

  const searchTimer = useRef(null);

  const fetchProducts = useCallback(async (q = search, lso = lowStockOnly) => {
    try {
      const params = {};
      if (q.trim())  params.search       = q.trim();
      if (lso)       params.lowStockOnly = 'true';
      const res = await api.get('/api/products/admin/all', { params });
      setProducts(res.data.data);
    } catch {
      Alert.alert('Error', 'Could not load inventory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, lowStockOnly]);

  useEffect(() => {
    fetchProducts();
    // Load all products for the existing-product picker in Add mode
    api.get('/api/products/admin/all').then(r => setAllProducts(r.data.data)).catch(() => {});
  }, []);

  const handleSearchChange = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setLoading(true);
      fetchProducts(text, lowStockOnly);
    }, 400);
  };

  const toggleLowStock = () => {
    const next = !lowStockOnly;
    setLowStockOnly(next);
    setLoading(true);
    fetchProducts(search, next);
  };

  const handleClearFilters = () => {
    setSearch('');
    setLowStockOnly(false);
    setLoading(true);
    fetchProducts('', false);
  };

  const handleDelete = (product) => {
    Alert.alert(
      '🗑️ Delete Product',
      `Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/products/${product._id}`);
              setProducts(prev => prev.filter(p => p._id !== product._id));
              Alert.alert('Deleted', `"${product.name}" has been removed.`);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Could not delete product.');
            }
          },
        },
      ]
    );
  };

  const openAdd  = () => { setEditTarget(null);    setFormVisible(true); };
  const openEdit = (p) => { setEditTarget(p);      setFormVisible(true); };

  const lowStockCount = products.filter(p => p.quantityInStock <= 5).length;

  // ── Product row ────────────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const isLow     = item.quantityInStock <= 5;
    const isInactive= !item.isActive;

    return (
      <View style={[styles.row, isInactive && styles.rowInactive]}>
        {/* Category icon or Image */}
        <View style={[styles.rowIcon, isLow && { borderColor: C.warn }, item.imageUrl && { backgroundColor: 'transparent', borderWidth: 0 }]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={{ width: 48, height: 48, borderRadius: 12 }} />
          ) : (
            <Text style={styles.rowIconText}>{CAT_ICON[item.category] || '📦'}</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.rowInfo}>
          <View style={styles.rowTopLine}>
            <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
            {isInactive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
              </View>
            )}
          </View>
          <Text style={styles.rowCode}>{item.code}  ·  {item.category}</Text>
          {item.brand ? <Text style={styles.rowBrand}>{item.brand}</Text> : null}

          {/* Price + Stock */}
          <View style={styles.rowMeta}>
            <Text style={styles.rowPrice}>{fmt(item.unitPrice)}</Text>
            <View style={[styles.stockChip, isLow ? styles.stockChipLow : styles.stockChipOk]}>
              <Text style={[styles.stockChipText, { color: isLow ? C.warn : C.success }]}>
                {isLow ? '⚠️' : '✅'}  Stock: {item.quantityInStock}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.pageTitle}>📦 Inventory</Text>
          <Text style={styles.productCount}>{products.length} items</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search + Filters ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search by name, code, brand…"
            placeholderTextColor="#4A5568"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, lowStockOnly && styles.filterChipActive]}
            onPress={toggleLowStock}
          >
            <Text style={[styles.filterChipText, lowStockOnly && { color: C.warn }]}>
              ⚠️  Low Stock Only
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip} onPress={handleClearFilters}>
            <Text style={styles.filterChipText}>✕  Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Low Stock Alert ── */}
      {!loading && lowStockCount > 0 && !lowStockOnly && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertBannerText}>
            ⚠️  Low stock alert: {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} at or below minimum level.
          </Text>
        </View>
      )}

      {/* ── Product List ── */}
      <FlatList
        data={products}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchProducts(); }}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={styles.centerText}>Loading inventory...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyDesc}>
                {lowStockOnly ? 'No low-stock items right now.' : 'Try a different search or add a new product.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          products.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>🖥️ TechLine Computers (Pvt) Ltd  ·  © 2026</Text>
            </View>
          ) : null
        }
      />

      {/* ── Add / Edit Modal ── */}
      <ProductFormModal
        visible={formVisible}
        product={editTarget}
        onClose={() => setFormVisible(false)}
        onSaved={() => fetchProducts()}
        allProducts={allProducts}
      />
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
  topBarLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarRight:   { flexDirection: 'row', gap: 8 },
  pageTitle:     { color: C.text, fontSize: 17, fontWeight: '800' },
  productCount:  { color: C.muted, fontSize: 13 },
  addBtn: {
    backgroundColor: C.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    shadowColor: C.success, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  backBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: C.secondary, borderRadius: 10,
  },
  backBtnText: { color: C.accent, fontWeight: '700', fontSize: 13 },

  // Search
  searchSection: {
    backgroundColor: C.header, borderBottomWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 10,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 12,
  },
  searchIcon:   { fontSize: 15, marginRight: 8 },
  searchInput:  { flex: 1, paddingVertical: 10, color: C.text, fontSize: 14 },
  clearSearch:  { color: C.muted, fontSize: 14, fontWeight: '600', paddingLeft: 6 },

  filterRow:  { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
  },
  filterChipActive:  { borderColor: C.warn, backgroundColor: '#78350F' },
  filterChipText:    { color: C.muted, fontSize: 12, fontWeight: '600' },

  // Alert banner
  alertBanner: {
    backgroundColor: '#78350F', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderColor: '#92400E',
  },
  alertBannerText: { color: '#FCD34D', fontSize: 13, fontWeight: '600' },

  // List
  listContent: { padding: 12, paddingBottom: 40 },

  // Product row
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  rowInactive: { opacity: 0.55, borderStyle: 'dashed' },
  rowIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: C.header, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, flexShrink: 0,
  },
  rowIconText: { fontSize: 24 },
  rowInfo:     { flex: 1, gap: 3 },
  rowTopLine:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName:     { color: C.text, fontSize: 13, fontWeight: '700', flex: 1 },
  inactiveBadge: {
    backgroundColor: '#374151', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  inactiveBadgeText: { color: C.muted, fontSize: 9, fontWeight: '700' },
  rowCode:     { color: C.muted, fontSize: 11 },
  rowBrand:    { color: C.secondary, fontSize: 11, fontWeight: '600' },
  rowMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rowPrice:    { color: C.success, fontWeight: '800', fontSize: 13 },
  stockChip:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  stockChipOk: { backgroundColor: '#14532D' },
  stockChipLow:{ backgroundColor: '#78350F' },
  stockChipText:{ fontSize: 10, fontWeight: '700' },

  rowActions: { flexDirection: 'column', gap: 6, flexShrink: 0 },
  editBtn:    { width: 36, height: 36, borderRadius: 8, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  editBtnText:{ fontSize: 16 },
  deleteBtn:  { width: 36, height: 36, borderRadius: 8, backgroundColor: '#7F1D1D', justifyContent: 'center', alignItems: 'center' },
  deleteBtnText:{ fontSize: 16 },

  // Empty / loading
  center:      { alignItems: 'center', paddingTop: 80, gap: 12 },
  centerText:  { color: C.muted, fontSize: 14 },
  emptyState:  { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon:   { fontSize: 56, marginBottom: 16 },
  emptyTitle:  { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc:   { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Footer
  footer:     { alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderColor: C.border, marginTop: 8 },
  footerText: { color: '#374151', fontSize: 11 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '90%',
    borderTopWidth: 1, borderColor: C.border,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  modalClose: { color: C.muted, fontSize: 22, padding: 4 },

  formGroup: { marginBottom: 14 },
  formRow:   { flexDirection: 'row', gap: 12 },
  formLabel: {
    color: C.secondary, fontWeight: '700', fontSize: 11,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7,
  },
  input: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    color: C.text, fontSize: 14,
  },

  // Category picker
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
  },
  pickerBtnIcon:    { fontSize: 18 },
  pickerBtnText:    { color: C.text, fontSize: 14, flex: 1 },
  pickerChevron:    { color: C.muted, fontSize: 12 },
  catDropdown: {
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, marginTop: 4, overflow: 'hidden',
  },
  catOption: { paddingHorizontal: 16, paddingVertical: 10 },
  catOptionActive: { backgroundColor: C.primary },
  catOptionText: { color: C.text, fontSize: 14 },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },

  saveBtn: {
    backgroundColor: C.success, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 8, marginBottom: 8,
    shadowColor: C.success, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Image upload
  uploadBtn: {
    backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', borderWidth: 1, borderColor: '#6366f1',
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  uploadPreview: {
    marginTop: 10, alignItems: 'center', gap: 8,
    backgroundColor: '#0D1526', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: C.border,
  },
  uploadPreviewImg: { width: 120, height: 120, borderRadius: 10 },
  uploadRemove: { color: C.danger, fontSize: 13, fontWeight: '600' },
});
