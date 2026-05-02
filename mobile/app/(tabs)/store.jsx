import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TechBotChat from '../../components/TechBotChat';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2-column grid

// ─── Color palette (mirrors the web's blue-gradient dark adaptation) ──────
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
  chip: '#1A2035',
  chipActive: '#1e3c72',
};

// ─── Category emoji map ───────────────────────────────────────────────────
const CAT_ICON = {
  'All': '🖥️',
  'Processors': '⚙️',
  'Graphics Cards': '🎮',
  'Memory (RAM)': '💾',
  'Storage': '💿',
  'Motherboards': '🔌',
  'Power Supplies': '⚡',
  'Cooling': '❄️',
  'Peripherals': '🖱️',
  'Monitors': '🖥️',
};

// ─── Format price ─────────────────────────────────────────────────────────
const formatPrice = (p) =>
  `Rs. ${Number(p).toLocaleString('en-LK')}`;

export default function StoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selCat, setSelCat] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { addToCart, totalItems: cartCount } = useCart();

  // Debounce search
  const searchTimer = useRef(null);

  // ── Fetch categories ─────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/api/products/categories')
      .then(r => setCategories(r.data.data))
      .catch(() => { });
  }, []);

  // ── Fetch products (with debounce on search) ──────────────────────────────
  const fetchProducts = useCallback(async (q = search, cat = selCat) => {
    try {
      const params = {};
      if (q.trim()) params.search = q.trim();
      if (cat !== 'All') params.category = cat;

      const res = await api.get('/api/products', { params });
      setProducts(res.data.data);
    } catch (err) {
      Alert.alert('Error', 'Could not load products. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selCat]);

  useEffect(() => { fetchProducts(); }, []);

  // Re-fetch when category changes
  useEffect(() => {
    setLoading(true);
    fetchProducts(search, selCat);
  }, [selCat]);

  // Debounced search
  const handleSearchChange = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setLoading(true);
      fetchProducts(text, selCat);
    }, 400);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleAddToCart = (product) => {
    if (product.quantityInStock === 0) return;
    addToCart(product);
    Alert.alert('🛒 Added to Cart', `${product.name} has been added to your cart!`);
  };

  // ── Product Card ─────────────────────────────────────────────────────────
  const renderProduct = ({ item }) => {
    const outOfStock = item.quantityInStock === 0;
    const icon = CAT_ICON[item.category] || '📦';

    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${item._id}`)}
      >
        {/* Icon / Image area */}
        <View style={[styles.productIconBg, item.imageUrl && { backgroundColor: 'transparent', borderWidth: 0 }]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <Text style={styles.productIcon}>{icon}</Text>
          )}
          {outOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>OUT</Text>
            </View>
          )}
        </View>

        {/* Code badge */}
        <Text style={styles.productCode}>{item.code}</Text>

        {/* Name */}
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

        {/* Brand */}
        {item.brand ? (
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>{item.brand}</Text>
          </View>
        ) : null}

        {/* Price */}
        <Text style={styles.productPrice}>{formatPrice(item.unitPrice)}</Text>

        {/* Stock */}
        <Text style={[styles.stockText, outOfStock && { color: C.danger }]}>
          {outOfStock ? 'Out of Stock' : `In stock: ${item.quantityInStock}`}
        </Text>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cartBtn, outOfStock && styles.cartBtnDisabled]}
          onPress={() => handleAddToCart(item)}
          disabled={outOfStock}
          activeOpacity={0.8}
        >
          <Text style={styles.cartBtnText}>
            {outOfStock ? 'Out of Stock' : '🛒  Add to Cart'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ── Header ────────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerLogo}>🖥️</Text>
        <View>
          <Text style={styles.headerTitle}>TechLine</Text>
          <Text style={styles.headerSub}>Spare Parts Store</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/(tabs)/cart')}>
          <Text style={styles.headerIconText}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.headerIconText}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Hero / Search band ────────────────────────────────────────────────────
  const renderHeroBand = () => (
    <View style={styles.heroBand}>
      <Text style={styles.heroTag}>EXPLORE OUR LATEST RANGE.</Text>
      <Text style={styles.heroTitle}>TAILORED FOR YOUR NEEDS.</Text>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, brand, or item code..."
          placeholderTextColor="#4A5568"
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── Category chips ────────────────────────────────────────────────────────
  const renderCategoryBar = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.catScroll}
      style={styles.catScrollWrap}
    >
      {categories.map((cat) => {
        const active = cat === selCat;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, active && styles.catChipActive]}
            onPress={() => setSelCat(cat)}
            activeOpacity={0.8}
          >
            <Text style={styles.catChipIcon}>{CAT_ICON[cat] || '📦'}</Text>
            <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // ── Results header ────────────────────────────────────────────────────────
  const renderResultsHeader = () => (
    <View style={styles.resultsHeader}>
      <Text style={styles.resultsTitle}>
        {selCat === 'All' ? '🖥️  All Spare Parts' : `${CAT_ICON[selCat] || '📦'}  ${selCat}`}
      </Text>
      <Text style={styles.resultsCount}>{products.length} item{products.length !== 1 ? 's' : ''}</Text>
    </View>
  );

  // ── Empty state ───────────────────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptyDesc}>Try a different search or category filter.</Text>
    </View>
  );

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
        ListHeaderComponent={
          <>
            {renderHeroBand()}
            {renderCategoryBar()}
            {!loading && renderResultsHeader()}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={styles.loaderText}>Loading products...</Text>
            </View>
          ) : renderEmptyState()
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>🖥️ TechLine Computers (Pvt) Ltd</Text>
            <Text style={styles.footerText}>© 2026 | IT_ITP_17 | SLIIT</Text>
          </View>
        }
      />
      <TechBotChat />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.header,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: { fontSize: 28 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  headerSub: { color: C.muted, fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: 6 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  headerIconText: { fontSize: 18 },
  cartBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: C.danger, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Hero band
  heroBand: {
    backgroundColor: C.header,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  heroTag: { color: C.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  heroTitle: { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    width: '100%',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: C.text, fontSize: 14 },
  clearBtn: { padding: 6 },
  clearBtnText: { color: C.muted, fontSize: 14, fontWeight: '600' },

  // Category chips
  catScrollWrap: { borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.header },
  catScroll: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.chip, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
  },
  catChipActive: { backgroundColor: C.chipActive, borderColor: C.accent },
  catChipIcon: { fontSize: 15 },
  catChipText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  catChipTextActive: { color: '#fff' },

  // Results header
  resultsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  resultsTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  resultsCount: { color: C.muted, fontSize: 13 },

  // Grid
  listContent: { paddingHorizontal: 12, paddingBottom: 32 },
  columnWrapper: { gap: 12, marginBottom: 12 },

  // Product card
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  productIconBg: {
    height: 90,
    backgroundColor: C.header,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: '100%' },
  productIcon: { fontSize: 42 },
  outOfStockBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: C.danger, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  outOfStockText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  productCode: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  productName: { color: C.text, fontSize: 13, fontWeight: '700', marginBottom: 6, lineHeight: 18, minHeight: 36 },

  brandBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.secondary + '33',
    borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
    marginBottom: 8,
  },
  brandText: { color: C.accent, fontSize: 10, fontWeight: '700' },

  productPrice: { color: C.success, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  stockText: { color: C.muted, fontSize: 11, marginBottom: 10 },

  cartBtn: {
    backgroundColor: C.success,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  cartBtnDisabled: { backgroundColor: '#374151' },
  cartBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Loader / Empty
  loaderWrap: { flex: 1, alignItems: 'center', paddingTop: 80, gap: 12 },
  loaderText: { color: C.muted, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 24, borderTopWidth: 1, borderColor: C.border, marginTop: 8 },
  footerText: { color: '#374151', fontSize: 11, marginBottom: 3 },
});
