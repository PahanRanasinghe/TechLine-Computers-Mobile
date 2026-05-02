import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/api';

const C = {
  bg:'#0A0F1E', header:'#0D1526', card:'#111827', border:'#1F2937',
  primary:'#1e3c72', secondary:'#2a5298', accent:'#00d2ff',
  success:'#10B981', warn:'#F59E0B', danger:'#EF4444',
  text:'#F9FAFB', muted:'#9CA3AF',
};

const fmt   = (n) => `Rs. ${Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const fmtDT = (d) => new Date(d).toLocaleString('en-LK', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
const isToday = (d) => { const t = new Date(d), n = new Date(); return t.toDateString() === n.toDateString(); };

const STATUS_COLORS = { Pending:'#F59E0B', Confirmed:'#06B6D4', Processing:'#3B82F6', Completed:'#10B981', Cancelled:'#EF4444' };
const ALL_STATUSES  = ['Pending','Confirmed','Processing','Completed','Cancelled'];

const CAT_ICON = {
  'Processors':'⚙️','Graphics Cards':'🎮','Memory (RAM)':'💾','Storage':'💿',
  'Motherboards':'🔌','Power Supplies':'⚡','Cooling':'❄️','Peripherals':'🖱️','Monitors':'🖥️',
};

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, onStatusChange }) {
  const [open, setOpen] = useState(false);

  const changeStatus = () => {
    Alert.alert('Update Status', `Order #${order._id.slice(-6).toUpperCase()}`, [
      ...ALL_STATUSES.map(s => ({
        text: s, onPress: () => onStatusChange(order._id, s),
        style: s === 'Cancelled' ? 'destructive' : 'default',
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const sc = STATUS_COLORS[order.status] || C.muted;

  return (
    <View style={[styles.card, open && styles.cardOpen]}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setOpen(!open)} activeOpacity={0.85}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.saleId}>Sale #{order._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.saleDate}>{fmtDT(order.saleDate)}</Text>
          <Text style={styles.customer}>👤 {order.customerName || 'Walk-in'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={styles.total}>{fmt(order.totalAmount)}</Text>
          <View style={[styles.statusChip, { backgroundColor: sc + '22' }]}>
            <Text style={[styles.statusText, { color: sc }]}>{order.status}</Text>
          </View>
          <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          {/* Items */}
          {order.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemIcon}>{CAT_ICON[item.category] || '📦'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.itemCode}>{item.productCode}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemQty}>{item.quantity} ×</Text>
                <Text style={styles.itemSubtotal}>{fmt(item.subtotal)}</Text>
              </View>
            </View>
          ))}

          {/* Summary */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLine}>📦 {order.deliveryMethod}  ·  💳 {order.paymentMethod}</Text>
            <Text style={styles.summaryTotal}>Total: {fmt(order.totalAmount)}</Text>
          </View>

          {/* Status update */}
          <TouchableOpacity style={styles.statusBtn} onPress={changeStatus} activeOpacity={0.85}>
            <Text style={styles.statusBtnText}>🔄  Update Status</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SalesScreen() {
  const router = useRouter();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [daily,      setDaily]      = useState(false);   // Daily Report toggle

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/api/orders');
      setOrders(res.data.data);
    } catch { Alert.alert('Error', 'Could not load orders.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch(); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const res = await api.patch(`/api/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? res.data.data : o));
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Could not update status.'); }
  };

  const displayed   = daily ? orders.filter(o => isToday(o.saleDate)) : orders;
  const todayOrders = orders.filter(o => isToday(o.saleDate));
  const todayRev    = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalRev    = orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <SafeAreaView style={styles.container}>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.pageTitle}>🛒 Order & Sales</Text>
          <Text style={styles.subtitle}>{orders.length} total</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Action pills */}
      <View style={styles.pills}>
        <TouchableOpacity
          style={[styles.pill, daily && styles.pillActive]}
          onPress={() => setDaily(!daily)}
        >
          <Text style={[styles.pillText, daily && { color: C.accent }]}>📅 Daily Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pill}
          onPress={() => router.push('/(admin)/users')}
        >
          <Text style={styles.pillText}>👥 Customers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pill}
          onPress={() => Alert.alert('Coming Soon', 'New Sale form will be available in the next update.')}
        >
          <Text style={styles.pillText}>➕ New Sale</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{daily ? todayOrders.length : orders.length}</Text>
          <Text style={styles.statLbl}>{daily ? "Today's Orders" : 'All Orders'}</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderColor: C.border }]}>
          <Text style={[styles.statVal, { color: C.success }]}>{fmt(daily ? todayRev : totalRev)}</Text>
          <Text style={styles.statLbl}>{daily ? "Today's Revenue" : 'Total Revenue'}</Text>
        </View>
      </View>

      <FlatList
        data={displayed}
        keyExtractor={o => o._id}
        renderItem={({ item }) => (
          <OrderCard order={item} onStatusChange={handleStatusChange} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetch(); }}
            tintColor={C.accent} colors={[C.accent]} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={styles.centerText}>Loading orders...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>{daily ? 'No sales today' : 'No sales yet'}</Text>
              <Text style={styles.emptyDesc}>Orders placed by customers will appear here.</Text>
            </View>
          )
        }
        ListFooterComponent={
          displayed.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>🖥️ TechLine Computers (Pvt) Ltd · © 2026</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:16, paddingVertical:14,
    backgroundColor:C.header, borderBottomWidth:1, borderColor:C.border,
  },
  topLeft:    { gap: 2 },
  pageTitle:  { color:C.text, fontSize:17, fontWeight:'800' },
  subtitle:   { color:C.muted, fontSize:12 },
  backBtn:    { paddingHorizontal:14, paddingVertical:8, borderWidth:1.5, borderColor:C.secondary, borderRadius:10 },
  backBtnText:{ color:C.accent, fontWeight:'700', fontSize:13 },

  pills: {
    flexDirection:'row', gap:8, paddingHorizontal:16, paddingVertical:10,
    backgroundColor:C.header, borderBottomWidth:1, borderColor:C.border, flexWrap:'wrap',
  },
  pill:       { paddingHorizontal:14, paddingVertical:7, backgroundColor:C.card, borderRadius:20, borderWidth:1, borderColor:C.border },
  pillActive: { borderColor:C.accent, backgroundColor:C.primary },
  pillText:   { color:C.text, fontSize:13, fontWeight:'600' },

  statsStrip: {
    flexDirection:'row', backgroundColor:C.header,
    borderBottomWidth:1, borderColor:C.border,
  },
  statBox:  { flex:1, alignItems:'center', paddingVertical:14 },
  statVal:  { color:C.text, fontSize:20, fontWeight:'800' },
  statLbl:  { color:C.muted, fontSize:11, marginTop:2 },

  list: { padding:12, paddingBottom:40 },

  card: {
    backgroundColor:C.card, borderRadius:16, marginBottom:12,
    borderWidth:1, borderColor:C.border, overflow:'hidden',
    shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:8, elevation:5,
  },
  cardOpen:   { borderColor:C.secondary },
  cardHeader: { flexDirection:'row', padding:16 },
  saleId:     { color:C.text, fontWeight:'800', fontSize:15 },
  saleDate:   { color:C.muted, fontSize:12 },
  customer:   { color:C.muted, fontSize:12 },
  total:      { color:C.success, fontWeight:'800', fontSize:15 },
  statusChip: { paddingHorizontal:10, paddingVertical:3, borderRadius:12 },
  statusText: { fontSize:11, fontWeight:'700' },
  chevron:    { color:C.muted, fontSize:11 },

  cardBody: { paddingHorizontal:16, paddingBottom:16, borderTopWidth:1, borderColor:C.border },

  itemRow: {
    flexDirection:'row', alignItems:'center', gap:10,
    paddingVertical:10, borderBottomWidth:1, borderColor:C.border,
  },
  itemIcon:    { fontSize:22 },
  itemName:    { color:C.text, fontWeight:'600', fontSize:13 },
  itemCode:    { color:C.muted, fontSize:11 },
  itemQty:     { color:C.muted, fontSize:12 },
  itemSubtotal:{ color:C.success, fontWeight:'700', fontSize:13 },

  summaryBox: {
    backgroundColor:'#1A2035', borderRadius:10, padding:12, marginTop:12,
    borderWidth:1, borderColor:C.border, gap:4,
  },
  summaryLine:  { color:C.muted, fontSize:12 },
  summaryTotal: { color:'#86EFAC', fontWeight:'800', fontSize:14 },

  statusBtn: {
    marginTop:12, backgroundColor:C.primary, borderRadius:10,
    paddingVertical:11, alignItems:'center',
  },
  statusBtnText: { color:'#fff', fontWeight:'700', fontSize:14 },

  center:     { alignItems:'center', paddingTop:80, gap:12 },
  centerText: { color:C.muted, fontSize:14 },
  emptyState: { alignItems:'center', paddingTop:80, paddingHorizontal:32 },
  emptyIcon:  { fontSize:56, marginBottom:16 },
  emptyTitle: { color:C.text, fontSize:18, fontWeight:'700', marginBottom:8 },
  emptyDesc:  { color:C.muted, fontSize:14, textAlign:'center', lineHeight:22 },

  footer:     { alignItems:'center', paddingVertical:20, borderTopWidth:1, borderColor:C.border },
  footerText: { color:'#374151', fontSize:11 },
});
