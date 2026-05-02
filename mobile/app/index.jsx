import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
    FlatList,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import TechBotChat from '../components/TechBotChat';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2-column grid

// ─── Color Palette ────────────────────────────────────────────────────────
const COLORS = {
    bg: '#0A0F1E',
    gradientStart: '#1e3c72',
    gradientEnd: '#2a5298',
    accent: '#00d2ff',
    accentPurple: '#6C63FF',
    card: '#111827',
    card2: '#0D1526',
    border: '#1F2937',
    text: '#F9FAFB',
    muted: '#9CA3AF',
    success: '#10B981',
    warn: '#F59E0B',
    danger: '#EF4444',
    inputBg: '#1A2035',
    chip: '#1A2035',
    chipActive: '#1e3c72',
};

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

const FEATURES = [
    { icon: '🚀', title: 'Custom Rigs', desc: 'Tailored specs for high-end gaming PC setups.', color: '#6C63FF' },
    { icon: '🌎', title: 'Premium Brands', desc: 'Authored imports from top computer vendors worldwide.', color: '#00d2ff' },
    { icon: '📍', title: 'Island-wide Shipping', desc: 'Prompt deliveries everywhere in Sri Lanka.', color: '#10B981' },
    { icon: '🛡️', title: 'Warranty Support', desc: 'Full warranty tracking and claim management.', color: '#F59E0B' },
];


const formatPrice = (p) => `Rs. ${Number(p).toLocaleString('en-LK')}`;

export default function LandingPage() {
    const router = useRouter();

    // Floating animation for the logo
    const floatAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [selCat, setSelCat] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Debounce search
    const searchTimer = useRef(null);

    useEffect(() => {
        // Floating loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: -12, duration: 1500, useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
            ])
        ).start();

        // Fade + slide in
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    // ── Fetch Categories & Products ───────────────────────────────────────────
    useEffect(() => {
        api.get('/api/products/categories')
            .then(r => setCategories(r.data.data))
            .catch(() => { });
    }, []);

    const fetchProducts = useCallback(async (q = search, cat = selCat) => {
        try {
            const params = {};
            if (q.trim()) params.search = q.trim();
            if (cat !== 'All') params.category = cat;

            const res = await api.get('/api/products', { params });
            setProducts(res.data.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, selCat]);

    useEffect(() => { fetchProducts(); }, []);

    useEffect(() => {
        setLoading(true);
        fetchProducts(search, selCat);
    }, [selCat]);

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

    const handleGuestAddToCart = () => {
        Alert.alert(
            "Sign In Required",
            "Please sign in or create a free account to add items to your cart.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Sign In", onPress: () => router.push('/(auth)/login') }
            ]
        );
    };

    // ─── Render Components ───────────────────────────────────────────────────

    const renderProduct = ({ item }) => {
        const outOfStock = item.quantityInStock === 0;
        const icon = CAT_ICON[item.category] || '📦';

        return (
            <TouchableOpacity
                style={styles.productCard}
                activeOpacity={0.9}
                onPress={() => router.push(`/product/${item._id}`)}
            >
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
                <Text style={styles.productCode}>{item.code}</Text>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                {item.brand ? (
                    <View style={styles.brandBadge}>
                        <Text style={styles.brandText}>{item.brand}</Text>
                    </View>
                ) : null}
                <Text style={styles.productPrice}>{formatPrice(item.unitPrice)}</Text>
                <Text style={[styles.stockText, outOfStock && { color: COLORS.danger }]}>
                    {outOfStock ? 'Out of Stock' : `In stock: ${item.quantityInStock}`}
                </Text>
                <TouchableOpacity
                    style={[styles.cartBtn, outOfStock && styles.cartBtnDisabled]}
                    onPress={handleGuestAddToCart}
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

    const renderTopHeader = () => (
        <View style={styles.topHeader}>
            <View style={styles.topHeaderLeft}>
                <Text style={styles.topHeaderLogo}>🖥️</Text>
                <View>
                    <Text style={styles.topHeaderTitle}>TechLine</Text>
                    <Text style={styles.topHeaderSub}>Computers</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.loginSmallBtn} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginSmallBtnText}>Sign In</Text>
            </TouchableOpacity>
        </View>
    );

    const renderHeroSection = () => (
        <View style={styles.hero}>
            <View style={styles.heroBg} />
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoEmoji}>🖥️</Text>
                </View>
            </Animated.View>
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    alignItems: 'center',
                }}
            >
                <Text style={styles.companyLabel}>TechLine Computers (Pvt) Ltd</Text>
                <Text style={styles.heroTitle}>High Performance{'\n'}Computer Parts</Text>
                <Text style={styles.heroSubtitle}>
                    Sri Lanka's premier spare parts management system — built for speed, reliability, and scale.
                </Text>
                <View style={styles.ctaRow}>
                    <TouchableOpacity
                        style={styles.ctaPrimary}
                        onPress={() => router.push('/(auth)/register')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.ctaPrimaryText}>Create Account</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );


    const renderStoreHeader = () => (
        <View style={styles.storeHeaderWrap}>
            <Text style={styles.storeHeaderTitle}>Explore Our Store</Text>
            <View style={styles.searchRow}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
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

            {!loading && (
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsTitle}>
                        {selCat === 'All' ? '🖥️  All Parts' : `${CAT_ICON[selCat] || '📦'}  ${selCat}`}
                    </Text>
                    <Text style={styles.resultsCount}>{products.length} item{products.length !== 1 ? 's' : ''}</Text>
                </View>
            )}
        </View>
    );

    const renderListHeader = () => (
        <>
            {renderHeroSection()}

            <Animated.View style={{ opacity: fadeAnim }}>
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Why TechLine?</Text>
                    <Text style={styles.sectionTitle}>Everything you need,{'\n'}in one system</Text>
                    {FEATURES.map((feat) => (
                        <View key={feat.title} style={styles.featurePill}>
                            <View style={[styles.featureIconBg, { backgroundColor: feat.color + '22' }]}>
                                <Text style={styles.featureIcon}>{feat.icon}</Text>
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>{feat.title}</Text>
                                <Text style={styles.featureDesc}>{feat.desc}</Text>
                            </View>
                            <View style={[styles.featureDot, { backgroundColor: feat.color }]} />
                        </View>
                    ))}
                </View>
            </Animated.View>

            {renderStoreHeader()}
        </>
    );

    const renderListFooter = () => (
        <>
            <View style={styles.aboutSection}>
                <View style={styles.aboutHeader}>
                    <Text style={styles.aboutHeaderText}>About Us</Text>
                    <View style={styles.aboutHeaderLine} />
                </View>
                <Text style={styles.aboutBody}>
                    Established in 2025 in Sri Lanka, TechLine Computers is striving to become one of the leading retailers for branded & customizable computers.
                </Text>
                <View style={styles.statsRow}>
                    {[
                        { value: '500+', label: 'Products' },
                        { value: '2025', label: 'Founded' },
                        { value: '24/7', label: 'Support' },
                    ].map((stat) => (
                        <View key={stat.label} style={styles.statItem}>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerLogo}>🖥️ TechLine Computers (Pvt) Ltd</Text>
                <Text style={styles.footerText}>© 2026 | Developed By IT_ITP_17</Text>
                <Text style={styles.footerText}>Faculty of Computing | SLIIT</Text>
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
            {renderTopHeader()}

            <FlatList
                data={products}
                keyExtractor={(item) => item._id}
                renderItem={renderProduct}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />
                }
                ListHeaderComponent={renderListHeader()}
                ListFooterComponent={renderListFooter()}
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.loaderWrap}>
                            <ActivityIndicator size="large" color={COLORS.accent} />
                            <Text style={styles.loaderText}>Loading store...</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={styles.emptyTitle}>No products found</Text>
                            <Text style={styles.emptyDesc}>Try a different search or category filter.</Text>
                        </View>
                    )
                }
            />
            <TechBotChat />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },

    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.card2,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    topHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    topHeaderLogo: { fontSize: 24 },
    topHeaderTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
    topHeaderSub: { color: COLORS.muted, fontSize: 10, marginTop: 1 },
    loginSmallBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: COLORS.gradientStart,
        borderRadius: 8,
    },
    loginSmallBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    // Hero
    hero: { alignItems: 'center', paddingTop: 30, paddingBottom: 40, paddingHorizontal: 24, position: 'relative', overflow: 'hidden' },
    heroBg: { position: 'absolute', top: -60, width: width * 1.4, height: width * 1.4, borderRadius: width * 0.7, backgroundColor: COLORS.gradientStart, opacity: 0.15, alignSelf: 'center' },
    logoCircle: { width: 90, height: 90, borderRadius: 28, backgroundColor: COLORS.gradientStart, justifyContent: 'center', alignItems: 'center', marginBottom: 22, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 16, borderWidth: 1, borderColor: COLORS.accent + '40' },
    logoEmoji: { fontSize: 44 },
    companyLabel: { color: COLORS.accent, fontSize: 13, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' },
    heroTitle: { color: COLORS.text, fontSize: 32, fontWeight: '800', textAlign: 'center', lineHeight: 40, marginBottom: 14, letterSpacing: 0.5 },
    heroSubtitle: { color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 8 },
    ctaRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    ctaPrimary: { backgroundColor: COLORS.gradientStart, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, shadowColor: COLORS.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8, borderWidth: 1, borderColor: COLORS.accent + '30' },
    ctaPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },

    // Modules strip
    modulesStrip: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 16, flexWrap: 'wrap', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card2 },
    moduleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    moduleChipIcon: { fontSize: 16 },
    moduleChipLabel: { color: COLORS.text, fontSize: 13, fontWeight: '600' },

    // Features
    section: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 20 },
    sectionLabel: { color: COLORS.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
    sectionTitle: { color: COLORS.text, fontSize: 24, fontWeight: '800', marginBottom: 24, lineHeight: 32 },
    featurePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    featureIconBg: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    featureIcon: { fontSize: 26 },
    featureText: { flex: 1 },
    featureTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    featureDesc: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
    featureDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },

    // Store Header area
    storeHeaderWrap: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, borderTopWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card2 },
    storeHeaderTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 12, width: '100%', marginBottom: 16 },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 12, color: COLORS.text, fontSize: 14 },
    clearBtn: { padding: 6 },
    clearBtnText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },

    catScrollWrap: { marginHorizontal: -16 },
    catScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.chip, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    catChipActive: { backgroundColor: COLORS.chipActive, borderColor: COLORS.accent },
    catChipIcon: { fontSize: 15 },
    catChipText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
    catChipTextActive: { color: '#fff' },

    resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 4 },
    resultsTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
    resultsCount: { color: COLORS.muted, fontSize: 13 },

    // Grid
    listContent: { paddingBottom: 40 },
    columnWrapper: { gap: 12, marginBottom: 12, paddingHorizontal: 12 },

    // Product card
    productCard: { width: CARD_WIDTH, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
    productIconBg: { height: 90, backgroundColor: COLORS.card2, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10, position: 'relative', borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
    cardImage: { width: '100%', height: '100%' },
    productIcon: { fontSize: 42 },
    outOfStockBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: COLORS.danger, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
    outOfStockText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    productCode: { color: COLORS.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
    productName: { color: COLORS.text, fontSize: 13, fontWeight: '700', marginBottom: 6, lineHeight: 18, minHeight: 36 },
    brandBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.gradientEnd + '33', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 8 },
    brandText: { color: COLORS.accent, fontSize: 10, fontWeight: '700' },
    productPrice: { color: COLORS.success, fontSize: 15, fontWeight: '800', marginBottom: 4 },
    stockText: { color: COLORS.muted, fontSize: 11, marginBottom: 10 },
    cartBtn: { backgroundColor: COLORS.success, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
    cartBtnDisabled: { backgroundColor: '#374151' },
    cartBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    // Loader / Empty
    loaderWrap: { flex: 1, alignItems: 'center', paddingTop: 40, gap: 12, paddingBottom: 40 },
    loaderText: { color: COLORS.muted, fontSize: 14 },
    emptyState: { alignItems: 'center', paddingTop: 40, paddingBottom: 40, paddingHorizontal: 32 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyDesc: { color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },

    // About
    aboutSection: { backgroundColor: COLORS.card, marginHorizontal: 20, borderRadius: 20, padding: 22, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border, marginTop: 24 },
    aboutHeader: { marginBottom: 18 },
    aboutHeaderText: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 8 },
    aboutHeaderLine: { width: 50, height: 3, backgroundColor: COLORS.gradientEnd, borderRadius: 2 },
    aboutBody: { color: COLORS.muted, fontSize: 14, lineHeight: 22, marginBottom: 12 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderColor: COLORS.border },
    statItem: { alignItems: 'center' },
    statValue: { color: COLORS.accent, fontSize: 24, fontWeight: '800', marginBottom: 4 },
    statLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },

    // Footer
    footer: { alignItems: 'center', paddingVertical: 24, borderTopWidth: 1, borderColor: COLORS.border, marginTop: 4 },
    footerLogo: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
    footerText: { color: COLORS.muted, fontSize: 12, marginBottom: 3 },
});
