import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/api';

const C = {
  bg:       '#0A0F1E',
  header:   '#0D1526',
  card:     '#111827',
  cardUnread: '#0D1A36',
  border:   '#1F2937',
  primary:  '#1e3c72',
  secondary:'#2a5298',
  accent:   '#00d2ff',
  success:  '#10B981',
  danger:   '#EF4444',
  text:     '#F9FAFB',
  muted:    '#9CA3AF',
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-LK', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/my');
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch {
      Alert.alert('Error', 'Could not load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { Alert.alert('Error', 'Could not mark as read.'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { Alert.alert('Error', 'Could not mark all as read.'); }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
          } catch { Alert.alert('Error', 'Could not delete notification.'); }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.read && styles.cardUnread]}>
      {/* Unread dot */}
      {!item.read && <View style={styles.unreadDot} />}

      <View style={styles.cardIconBg}>
        <Text style={styles.cardIcon}>🔔</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardMessage, !item.read && { color: C.text, fontWeight: '600' }]}>
          {item.message}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDate}>{fmtDate(item.createdAt)}</Text>
          {item.read && (
            <Text style={styles.readLabel}>✓ Read</Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {!item.read && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleMarkRead(item._id)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>✓</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item._id)}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.pageTitle}>🔔 Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
            </View>
          )}
        </View>
        <View style={styles.topBarRight}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.8}>
              <Text style={styles.markAllBtnText}>✓ All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={styles.centerText}>Loading notifications...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔕</Text>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyDesc}>
                You're all caught up! Notifications about your warranty claims and service tickets will appear here.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          notifications.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>🖥️ TechLine Computers (Pvt) Ltd</Text>
              <Text style={styles.footerText}>© 2026 | IT_ITP_17 | SLIIT</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.header, borderBottomWidth: 1, borderColor: C.border,
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarRight: { flexDirection: 'row', gap: 8 },
  pageTitle:   { color: C.text, fontSize: 17, fontWeight: '800' },

  unreadBadge: {
    backgroundColor: C.danger, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 12,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  markAllBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: C.card, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.secondary,
  },
  markAllBtnText: { color: C.accent, fontWeight: '700', fontSize: 12 },

  backBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: C.secondary, borderRadius: 10,
  },
  backBtnText: { color: C.accent, fontWeight: '700', fontSize: 13 },

  listContent: { padding: 16, paddingBottom: 40 },

  // Notification card
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  cardUnread: {
    backgroundColor: C.cardUnread,
    borderLeftWidth: 4, borderLeftColor: C.secondary,
  },
  unreadDot: {
    position: 'absolute', top: 12, right: 12,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.secondary,
  },
  cardIconBg: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#1e3c7233', justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  cardIcon:    { fontSize: 20 },
  cardBody:    { flex: 1, gap: 6 },
  cardMessage: { color: C.muted, fontSize: 14, lineHeight: 20 },
  cardMeta:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardDate:    { color: '#4B5563', fontSize: 11 },
  readLabel:   { color: C.success, fontSize: 11, fontWeight: '600' },

  cardActions: { flexDirection: 'column', gap: 6, flexShrink: 0 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  deleteBtn:     { backgroundColor: '#374151' },
  deleteBtnText: { color: C.muted, fontWeight: '700', fontSize: 13 },

  center:      { alignItems: 'center', paddingTop: 80, gap: 12 },
  centerText:  { color: C.muted, fontSize: 14 },

  emptyState: {
    alignItems: 'center', paddingTop: 80, paddingHorizontal: 32,
  },
  emptyIcon:  { fontSize: 56, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc:  { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },

  footer: {
    alignItems: 'center', paddingVertical: 24,
    borderTopWidth: 1, borderColor: C.border, marginTop: 8,
  },
  footerText: { color: '#374151', fontSize: 11, marginBottom: 3 },
});
