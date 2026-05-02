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

const fmtDT = (d) => new Date(d).toLocaleString('en-LK', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });

const STATUS_COLORS = { 
  'Pending': '#F59E0B', 
  'Under Review': '#3B82F6', 
  'Approved': '#10B981', 
  'Rejected': '#EF4444', 
  'Resolved': '#6C63FF',
  'In Progress': '#3B82F6',
  'Completed': '#10B981',
};

const WARRANTY_STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Resolved'];
const TICKET_STATUSES = ['Pending', 'In Progress', 'Completed', 'Rejected'];

// ── Item Card ────────────────────────────────────────────────────────────────
function ItemCard({ item, type, onStatusChange }) {
  const [open, setOpen] = useState(false);

  const statuses = type === 'claims' ? WARRANTY_STATUSES : TICKET_STATUSES;

  const changeStatus = () => {
    Alert.alert('Update Status', `${type === 'claims' ? 'Claim' : 'Ticket'} for ${item.productCode}`, [
      ...statuses.map(s => ({
        text: s, onPress: () => onStatusChange(item._id, s),
        style: s === 'Rejected' ? 'destructive' : 'default',
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const sc = STATUS_COLORS[item.status] || C.muted;

  return (
    <View style={[styles.card, open && styles.cardOpen]}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setOpen(!open)} activeOpacity={0.85}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.cardCode}>{item.productCode}</Text>
          <Text style={styles.cardDate}>{fmtDT(item.createdAt)}</Text>
          <Text style={styles.customer}>👤 {item.customerId?.firstName} {item.customerId?.lastName}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={styles.cardType}>{type === 'claims' ? '🛡️ Claim' : '🔧 Ticket'}</Text>
          <View style={[styles.statusChip, { backgroundColor: sc + '22' }]}>
            <Text style={[styles.statusText, { color: sc }]}>{item.status}</Text>
          </View>
          <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {open && (
        <View style={styles.cardBody}>
          {item.productName ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Product Name:</Text>
              <Text style={styles.infoValue}>{item.productName}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer Email:</Text>
            <Text style={styles.infoValue}>{item.customerId?.email || item.customerEmail}</Text>
          </View>
          {type === 'tickets' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Service Type:</Text>
              <Text style={styles.infoValue}>{item.serviceType}</Text>
            </View>
          )}
          <View style={styles.descBox}>
            <Text style={styles.descLabel}>{type === 'claims' ? 'Issue Description:' : 'Request Description:'}</Text>
            <Text style={styles.descValue}>{type === 'claims' ? item.issueDescription : item.description}</Text>
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
export default function WarrantyScreen() {
  const router = useRouter();
  
  const [activeTab,  setActiveTab]  = useState('claims'); // 'claims' or 'tickets'
  const [claims,     setClaims]     = useState([]);
  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClaims = async () => {
    try {
      const res = await api.get('/api/warranty');
      setClaims(res.data.data);
    } catch { Alert.alert('Error', 'Could not load claims.'); }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/api/service-tickets');
      setTickets(res.data.data);
    } catch { Alert.alert('Error', 'Could not load tickets.'); }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchClaims(), fetchTickets()]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      if (activeTab === 'claims') {
        const res = await api.patch(`/api/warranty/${id}/status`, { status });
        setClaims(prev => prev.map(c => c._id === id ? { ...c, status: res.data.data.status } : c));
      } else {
        const res = await api.patch(`/api/service-tickets/${id}/status`, { status });
        setTickets(prev => prev.map(t => t._id === id ? { ...t, status: res.data.data.status } : t));
      }
      Alert.alert('Success', 'Status updated and user notified.');
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Could not update status.'); }
  };

  const displayed = activeTab === 'claims' ? claims : tickets;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.pageTitle}>🛡️ Warranty & Services</Text>
          <Text style={styles.subtitle}>{claims.length} Claims · {tickets.length} Tickets</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'claims' && styles.tabActive]} 
          onPress={() => setActiveTab('claims')}
        >
          <Text style={[styles.tabText, activeTab === 'claims' && styles.tabTextActive]}>Warranty Claims</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tickets' && styles.tabActive]} 
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>Service Tickets</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayed}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <ItemCard item={item} type={activeTab} onStatusChange={handleStatusChange} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll(); }}
            tintColor={C.accent} colors={[C.accent]} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={styles.centerText}>Loading data...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{activeTab === 'claims' ? '🛡️' : '🔧'}</Text>
              <Text style={styles.emptyTitle}>No {activeTab} found</Text>
              <Text style={styles.emptyDesc}>Customer submissions will appear here.</Text>
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

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: C.header,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: C.accent,
  },
  tabText: {
    color: C.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: C.accent,
    fontWeight: '800',
  },

  list: { padding:12, paddingBottom:40 },

  card: {
    backgroundColor:C.card, borderRadius:16, marginBottom:12,
    borderWidth:1, borderColor:C.border, overflow:'hidden',
    shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:8, elevation:5,
  },
  cardOpen:   { borderColor:C.secondary },
  cardHeader: { flexDirection:'row', padding:16 },
  cardCode:   { color:C.text, fontWeight:'800', fontSize:15 },
  cardDate:   { color:C.muted, fontSize:12 },
  customer:   { color:C.muted, fontSize:12 },
  cardType:   { color:C.text, fontWeight:'700', fontSize:13 },
  statusChip: { paddingHorizontal:10, paddingVertical:3, borderRadius:12 },
  statusText: { fontSize:11, fontWeight:'700' },
  chevron:    { color:C.muted, fontSize:11, textAlign: 'right', marginTop: 4 },

  cardBody: { paddingHorizontal:16, paddingBottom:16, borderTopWidth:1, borderColor:C.border, paddingTop: 12 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { color: C.muted, fontSize: 13 },
  infoValue: { color: C.text, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  
  descBox: {
    backgroundColor:'#1A2035', borderRadius:10, padding:12, marginTop:8,
    borderWidth:1, borderColor:C.border, gap:4,
  },
  descLabel:  { color:C.muted, fontSize:12, fontWeight: '700' },
  descValue: { color:C.text, fontSize:13, lineHeight: 20 },

  statusBtn: {
    marginTop:16, backgroundColor:C.primary, borderRadius:10,
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
