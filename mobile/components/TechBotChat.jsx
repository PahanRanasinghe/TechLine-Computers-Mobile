import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0F1E',
  card: '#111827',
  border: '#1F2937',
  primary: '#1e3c72',
  accent: '#00d2ff',
  botBg: '#1A2035',
  userBg: '#1e3c72',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  inputBg: '#1A2035',
  fabBg: '#6C63FF',
};

/**
 * TechBot floating chat widget.
 * Renders a FAB (floating action button) that opens a chat modal.
 * Works without authentication — calls POST /api/chatbot.
 */
export default function TechBotChat() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '0',
      from: 'bot',
      text: '👋 Hi there! I\'m TechBot, your TechLine assistant.\n\nAsk me about product prices, specs, stock, or anything about PC hardware!',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  // FAB pulse animation
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (open) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    Keyboard.dismiss();
    const userMsg = { id: Date.now().toString(), from: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/api/chatbot', { message: text });
      const reply = res.data?.reply || 'Sorry, I could not process that. Please try again.';
      // Batch both updates together to avoid a double-render flicker
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), from: 'bot', text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), from: 'bot', text: 'I\'m having trouble right now. Please try again! 🔄' },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Auto-scroll handled by onContentSizeChange on the FlatList
  // (avoids flicker caused by setTimeout conflicting with render cycle)

  const renderMsg = ({ item }) => {
    const isBot = item.from === 'bot';
    return (
      <View style={[styles.msgRow, isBot ? styles.msgRowBot : styles.msgRowUser]}>
        {isBot && <Text style={styles.botAvatar}>🤖</Text>}
        <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
          <Text style={[styles.bubbleText, isBot ? styles.bubbleTextBot : styles.bubbleTextUser]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* ── FAB ── */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: pulse }] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>🤖</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Chat Modal ── */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.chatCard}>
              {/* Header */}
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                  <Text style={styles.chatHeaderIcon}>🤖</Text>
                  <View>
                    <Text style={styles.chatHeaderTitle}>TechBot</Text>
                    <Text style={styles.chatHeaderSub}>TechLine AI Assistant</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setOpen(false)} style={styles.chatCloseBtn}>
                  <Text style={styles.chatCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Messages */}
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMsg}
                style={styles.chatMessages}
                contentContainerStyle={{ paddingVertical: 12 }}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() =>
                  listRef.current?.scrollToEnd({ animated: false })
                }
              />

              {/* Typing indicator */}
              {sending && (
                <View style={styles.typingRow}>
                  <Text style={styles.botAvatar}>🤖</Text>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator color={C.accent} size="small" />
                    <Text style={styles.typingText}>TechBot is thinking...</Text>
                  </View>
                </View>
              )}

              {/* Input */}
              <View style={[styles.inputRow, { paddingBottom: insets.bottom + 10 }]}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Ask TechBot anything..."
                  placeholderTextColor="#4A5568"
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={send}
                  returnKeyType="send"
                  editable={!sending}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
                  onPress={send}
                  disabled={!input.trim() || sending}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sendBtnText}>➤</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 999,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.fabBg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.fabBg,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#8B83FF',
  },
  fabIcon: { fontSize: 28 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  chatCard: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    borderTopWidth: 1,
    borderColor: C.border,
  },

  // Header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatHeaderIcon: { fontSize: 28 },
  chatHeaderTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  chatHeaderSub: { color: C.muted, fontSize: 11 },
  chatCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1F293722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  chatCloseText: { color: C.muted, fontSize: 16 },

  // Messages
  chatMessages: { flex: 1, paddingHorizontal: 14 },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },

  botAvatar: { fontSize: 22, marginRight: 6, marginBottom: 2 },

  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  bubbleBot: { backgroundColor: C.botBg, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  bubbleUser: { backgroundColor: C.userBg, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleTextBot: { color: C.text },
  bubbleTextUser: { color: '#E0F2FE' },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.botBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  typingText: { color: C.muted, fontSize: 12 },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: C.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.fabBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 20 },
});
