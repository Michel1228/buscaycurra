import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, PanResponder, Dimensions, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const API_URL = 'https://api.buscaycurra.es/api';

export default function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! 👋 Soy tu asistente de BuscayCurra. ¿En qué te puedo ayudar?' }
  ]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const SUGGESTIONS = [
    { icon: '💡', label: 'Consejos para mi CV', message: 'Dame consejos para mejorar mi currículum y destacar sobre otros candidatos' },
    { icon: '❓', label: 'Preguntas frecuentes', message: '¿Cuáles son las preguntas más frecuentes en una entrevista de trabajo y cómo responderlas?' },
    { icon: '⭐', label: 'Recomendaciones', message: 'Dame recomendaciones personalizadas para encontrar empleo más rápido en España' },
  ];
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Draggable bubble position
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_W - 76, y: SCREEN_H - 200 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        // If barely moved, treat as tap
        if (Math.abs(g.dx) < 10 && Math.abs(g.dy) < 10) {
          setOpen(prev => !prev);
        }
      },
    })
  ).current;

  const sendSuggestion = (msg) => {
    setShowSuggestions(false);
    sendMessageWithText(msg);
  };

  const sendMessage = () => {
    if (!input.trim() || loading) return;
    setShowSuggestions(false);
    sendMessageWithText(input.trim());
    setInput('');
  };

  const sendMessageWithText = async (userMsg) => {
    if (!userMsg || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Lo siento, no pude procesar tu mensaje. Inténtalo de nuevo.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sin conexión. Comprueba tu internet e inténtalo de nuevo.' }]);
    }
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (open) {
    return (
      <View style={styles.chatContainer}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.aiDot} />
            <Text style={styles.chatTitle}>Asistente IA</Text>
          </View>
          <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesArea}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View key={i} style={[styles.msgBubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.msgText, m.role === 'user' && { color: '#0B0E17' }]}>{m.text}</Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.msgBubble, styles.aiBubble]}>
              <Text style={styles.msgText}>Pensando...</Text>
            </View>
          )}
        </ScrollView>

        {/* Suggestion chips */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => sendSuggestion(s.message)}
              >
                <Text style={styles.suggestionIcon}>{s.icon}</Text>
                <Text style={styles.suggestionLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor="#5a6478"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Floating draggable bubble
  return (
    <Animated.View
      style={[styles.bubble, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.bubbleInner}>
        <Text style={styles.bubbleIcon}>⚡</Text>
      </View>
      <View style={styles.bubblePulse} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Floating bubble
  bubble: {
    position: 'absolute',
    width: 56,
    height: 56,
    zIndex: 9999,
  },
  bubbleInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  bubbleIcon: {
    fontSize: 26,
    color: '#fff',
  },
  bubblePulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,107,53,0.3)',
  },

  // Chat panel
  chatContainer: {
    position: 'absolute',
    bottom: 70,
    right: 12,
    left: 12,
    height: SCREEN_H * 0.55,
    backgroundColor: '#0f1322',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    overflow: 'hidden',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(20,25,45,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,53,0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#27AE60',
    marginRight: 8,
  },
  chatTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Messages
  messagesArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  msgBubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20,25,45,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 4,
  },
  msgText: {
    color: '#e0e0e0',
    fontSize: 14,
    lineHeight: 20,
  },

  // Suggestions
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
  },
  suggestionIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  suggestionLabel: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,53,0.15)',
    backgroundColor: 'rgba(20,25,45,0.95)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
