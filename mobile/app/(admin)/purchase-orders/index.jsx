import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  warn: '#F59E0B',
  danger: '#EF4444',
  text: '#F9FAFB',
  muted: '#9CA3AF',
};

export default function AllPurchaseOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/purchase-orders');
      setOrders(res.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleMarkCompleted = (id) => {
    Alert.alert('Confirm', 'Mark this purchase order as COMPLETED?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await api.put(`/api/purchase-orders/${id}/status`, { status: 'COMPLETED' });
            fetchOrders();
          } catch (err) {
            Alert.alert('Error', 'Failed to update status');
          }
        }
      }
    ]);
  };

  const renderOrder = ({ item }) => {
    const isPending = item.status === 'PENDING';
    const statusColor = isPending ? COLORS.warn : (item.status === 'COMPLETED' ? COLORS.success : COLORS.danger);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item._id.substring(item._id.length - 6).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.detailText}>
            <Text style={styles.bold}>Supplier:</Text> {item.supplier ? item.supplier.name : 'Unknown'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.bold}>Date:</Text> {new Date(item.orderDate).toLocaleDateString()}
          </Text>
          <Text style={[styles.bold, { marginTop: 6, marginBottom: 4 }]}>Items ({item.items?.length || 0}):</Text>
          {(item.items || []).map((lineItem, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {lineItem.product?.name || 'Unknown'}{' '}
                <Text style={styles.itemCode}>({lineItem.product?.code || '—'})</Text>
              </Text>
              <Text style={styles.itemQty}>
                ×{lineItem.quantity}  ·  Rs. {lineItem.lineTotal?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalText}>
            Total: Rs. {item.totalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
          </Text>
          
          {isPending && (
            <TouchableOpacity style={styles.completeBtn} onPress={() => handleMarkCompleted(item._id)}>
              <Text style={styles.completeBtnText}>Mark Completed</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Purchase Orders</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No purchase orders found.</Text>}
        />
      )}
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
  backBtn: { padding: 8, width: 60 },
  backBtnText: { color: COLORS.muted, fontSize: 16 },
  headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  
  listContainer: { padding: 16, gap: 12, paddingBottom: 40 },
  emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 40 },

  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderColor: COLORS.border, paddingBottom: 10 },
  orderId: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800' },
  
  cardBody: { gap: 6, marginBottom: 16 },
  detailText: { color: COLORS.muted, fontSize: 14 },
  bold: { color: COLORS.text, fontWeight: '600' },

  itemRow: { backgroundColor: '#0D1526', borderRadius: 8, padding: 8, marginBottom: 4, borderWidth: 1, borderColor: COLORS.border },
  itemName: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  itemCode: { color: COLORS.muted, fontSize: 12, fontWeight: '400' },
  itemQty: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  totalText: { color: COLORS.success, fontSize: 16, fontWeight: '800' },
  completeBtn: { backgroundColor: COLORS.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  completeBtnText: { color: '#000', fontWeight: '700', fontSize: 12 },
});
