import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { applications } from '../services/api';

const STATUS_MAP = {
  sent: { label: 'Enviado', color: '#00E5FF', emoji: '📨' },
  opened: { label: 'Abierto', color: '#FFD700', emoji: '👁️' },
  replied: { label: 'Respondido', color: '#00FF88', emoji: '✅' },
  rejected: { label: 'Sin respuesta', color: '#8892b0', emoji: '❌' },
};

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [daily, setDaily] = useState({ sent: 0, limit: 2, remaining: 2 });

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const { data } = await applications.history({});
      setHistory(data.applications);
      setDaily(data.daily);
    } catch (e) {}
  };

  const renderItem = ({ item }) => {
    const status = STATUS_MAP[item.status] || STATUS_MAP.sent;
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.emoji}>{status.emoji}</Text>
          <View style={styles.info}>
            <Text style={styles.company}>{item.companyName}</Text>
            <Text style={styles.position}>{item.cv?.targetPosition || ''}</Text>
            <Text style={styles.date}>{new Date(item.sentAt).toLocaleDateString('es-ES')}</Text>
          </View>
          <View style={[styles.badge, { borderColor: status.color }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Daily counter */}
      <View style={styles.dailyBar}>
        <Text style={styles.dailyText}>
          Hoy: <Text style={{ color: '#FF6B35', fontWeight: '900' }}>{daily.sent}/{daily.limit}</Text> envíos
        </Text>
        <Text style={styles.dailyRemaining}>
          Quedan <Text style={{ color: '#00E5FF' }}>{daily.remaining}</Text>
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Aún no has enviado CVs</Text>
          <Text style={styles.emptyDesc}>Cuando envíes tu CV, aquí verás a quién fue y si respondieron.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17' },
  dailyBar: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 16,
    backgroundColor: 'rgba(20,25,45,0.9)', borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,53,0.2)'
  },
  dailyText: { color: '#fff', fontSize: 15 },
  dailyRemaining: { color: '#8892b0', fontSize: 15 },
  card: {
    backgroundColor: 'rgba(20,25,45,0.9)', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,107,53,0.1)'
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  company: { fontSize: 16, fontWeight: '700', color: '#fff' },
  position: { fontSize: 13, color: '#FF6B35', marginTop: 2 },
  date: { fontSize: 12, color: '#8892b0', marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: '#8892b0', textAlign: 'center', lineHeight: 22 },
});
