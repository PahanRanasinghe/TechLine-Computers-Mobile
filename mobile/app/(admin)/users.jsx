import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../services/api';

const COLORS = {
  bg: '#0A0F1E',
  card: '#111827',
  border: '#1F2937',
  primary: '#6C63FF',
  danger: '#EF4444',
  success: '#10B981',
  warn: '#F59E0B',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  inputBg: '#1A2035',
};

const ROLE_COLORS = {
  ROLE_ADMIN: COLORS.primary,
  ROLE_USER: COLORS.success,
};

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.data);
      setFiltered(res.data.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        users.filter(
          (u) =>
            u.firstName?.toLowerCase().includes(q) ||
            u.lastName?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, users]);

  const handleDelete = (userId, username) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${username}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/users/${userId}`);
              setUsers((prev) => prev.filter((u) => u._id !== userId));
              Alert.alert('✅ Deleted', `User "${username}" has been removed.`);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {(item.firstName?.[0] || '?').toUpperCase()}
          {(item.lastName?.[0] || '').toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <View style={[styles.roleBadge, { borderColor: ROLE_COLORS[item.role] || COLORS.muted }]}>
            <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] || COLORS.muted }]}>
              {item.role === 'ROLE_ADMIN' ? '⚡ Admin' : '👤 User'}
            </Text>
          </View>
        </View>
        <Text style={styles.userEmail}>@{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.contactNumber ? <Text style={styles.userEmail}>📞 {item.contactNumber}</Text> : null}
        <Text style={styles.userDate}>
          Joined {new Date(item.createdAt).toLocaleDateString('en-GB')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item._id, item.username)}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSub}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search by name, email, username..."
          placeholderTextColor="#4A5568"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchUsers(); }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
  },
  backBtn: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  headerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  headerSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },

  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
  },

  list: { paddingHorizontal: 20, paddingBottom: 32 },
  userCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  userAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  userName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  userEmail: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  userDate: { color: '#374151', fontSize: 11, marginTop: 4 },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    marginLeft: 8,
  },
  deleteIcon: { fontSize: 18 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { color: COLORS.muted, fontSize: 14 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 16 },
});
