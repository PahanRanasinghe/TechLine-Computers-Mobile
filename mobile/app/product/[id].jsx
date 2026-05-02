import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const C = {
  bg:          '#0A0F1E',
  header:      '#0D1526',
  card:        '#111827',
  border:      '#1F2937',
  primary:     '#1e3c72',
  secondary:   '#2a5298',
  accent:      '#00d2ff',
  success:     '#10B981',
  warn:        '#F59E0B',
  danger:      '#EF4444',
  text:        '#F9FAFB',
  muted:       '#9CA3AF',
};

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

const formatPrice = (p) => `Rs. ${Number(p).toLocaleString('en-LK')}`;

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/api/products/${id}`);
      setProduct(res.data.data);
    } catch (err) {
      Alert.alert('Error', 'Product not found.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.quantityInStock === 0) return;
    
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to add items to your cart.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }

    addToCart(product);
    Alert.alert('🛒 Added to Cart', `${product.name} has been added to your cart!`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.centerText}>Loading product details...</Text>
      </SafeAreaView>
    );
  }

  if (!product) return null;

  const outOfStock = product.quantityInStock === 0;
  const icon = CAT_ICON[product.category] || '📦';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Product Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageIcon}>{icon}</Text>
            </View>
          )}
          {outOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <View style={styles.metaRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{icon} {product.category}</Text>
            </View>
            <Text style={styles.codeText}>{product.code}</Text>
          </View>

          <Text style={styles.title}>{product.name}</Text>

          {product.brand ? (
            <Text style={styles.brandText}>Brand: <Text style={{ color: C.text }}>{product.brand}</Text></Text>
          ) : null}

          <View style={styles.warrantyRow}>
            <View style={[styles.warrantyChip, !product.warrantyPeriod && styles.noWarrantyChip]}>
              <Text style={[styles.warrantyText, !product.warrantyPeriod && styles.noWarrantyText]}>
                {product.warrantyPeriod ? `🛡️ ${product.warrantyPeriod} Year(s) Warranty` : 'No Warranty'}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.unitPrice)}</Text>
            <View style={[styles.stockChip, outOfStock ? styles.stockChipOut : styles.stockChipIn]}>
              <Text style={[styles.stockChipText, outOfStock && { color: C.danger }]}>
                {outOfStock ? 'Out of Stock' : `${product.quantityInStock} in Stock`}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>Description & Specifications</Text>
            <Text style={styles.descText}>
              {product.description ? product.description : "No description available for this product."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.cartBtn, outOfStock && styles.cartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={outOfStock}
          activeOpacity={0.8}
        >
          <Text style={styles.cartBtnText}>
            {outOfStock ? 'Out of Stock' : '🛒  Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', gap: 12 },
  centerText: { color: C.muted, fontSize: 14 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.header,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.secondary,
  },
  backBtnText: { color: C.accent, fontWeight: '700', fontSize: 13 },
  headerTitle: { color: C.text, fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },

  scrollContent: { paddingBottom: 40 },

  imageContainer: {
    width: width,
    height: width,
    backgroundColor: C.card2,
    borderBottomWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  noImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  noImageIcon: { fontSize: 80 },
  outOfStockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: C.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  outOfStockText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  infoContainer: { padding: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryChip: { backgroundColor: C.primary + '40', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: C.primary },
  categoryText: { color: C.accent, fontSize: 12, fontWeight: '700' },
  codeText: { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  title: { color: C.text, fontSize: 24, fontWeight: '800', marginBottom: 8, lineHeight: 32 },
  brandText: { color: C.muted, fontSize: 14, fontWeight: '600', marginBottom: 12 },

  warrantyRow: { flexDirection: 'row', marginBottom: 16 },
  warrantyChip: { backgroundColor: '#1e3a8a40', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1e3a8a' },
  warrantyText: { color: '#60a5fa', fontSize: 13, fontWeight: '700' },
  noWarrantyChip: { backgroundColor: '#37415140', borderColor: '#374151' },
  noWarrantyText: { color: C.muted },

  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottomWidth: 1, borderColor: C.border, marginBottom: 20 },
  price: { color: C.success, fontSize: 28, fontWeight: '900' },
  stockChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  stockChipIn: { backgroundColor: '#14532D40', borderColor: '#14532D' },
  stockChipOut: { backgroundColor: '#7F1D1D40', borderColor: '#7F1D1D' },
  stockChipText: { color: C.success, fontSize: 12, fontWeight: '700' },

  descSection: { marginTop: 10 },
  descTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  descText: { color: C.muted, fontSize: 15, lineHeight: 24 },

  bottomBar: {
    padding: 16,
    backgroundColor: C.header,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingBottom: 30, // For safe area on iOS
  },
  cartBtn: {
    backgroundColor: C.success,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cartBtnDisabled: { backgroundColor: '#374151', shadowOpacity: 0, elevation: 0 },
  cartBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
