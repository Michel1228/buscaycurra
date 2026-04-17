import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applications } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ sent: 0, limit: 2, remaining: 2 });

  useEffect(() => {
    loadUser();
    loadStats();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const loadStats = async () => {
    try {
      const { data } = await applications.history({ limit: 1 });
      setStats(data.daily);
    } catch (e) {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Saludo */}
      <View style={styles.greeting}>
        <Text style={styles.hello}>¡Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋</Text>
        <Text style={styles.subGreeting}>Tu empleo está más cerca cada día</Text>
      </View>

      {/* Stats del día */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Hoy</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.sent}</Text>
            <Text style={styles.statLabel}>Enviados</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#00E5FF' }]}>{stats.remaining}</Text>
            <Text style={styles.statLabel}>Restantes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FFD700' }]}>{stats.limit}</Text>
            <Text style={styles.statLabel}>Límite diario</Text>
          </View>
        </View>
      </View>

      {/* Acciones rápidas */}
      <Text style={styles.sectionTitle}>¿Qué quieres hacer?</Text>
      
      <TouchableOpacity 
        style={styles.actionCard} 
        onPress={() => navigation.navigate('MiCV')}
      >
        <View style={styles.iconCircle}><Text style={styles.iconText}>+</Text></View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Crear / Mejorar mi CV</Text>
          <Text style={styles.actionDesc}>Nuestra IA lo adapta a tu sector</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionCard}
        onPress={() => navigation.navigate('MiCV', { mode: 'upload' })}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(0,229,255,0.15)' }]}>
          <Text style={[styles.iconText, { color: '#00E5FF' }]}>↑</Text>
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Subir mi CV</Text>
          <Text style={styles.actionDesc}>Sube tu currículum y lo mejoramos con IA</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionCard}
        onPress={() => navigation.navigate('Empleos')}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,215,0,0.15)' }]}>
          <Text style={[styles.iconText, { color: '#FFD700' }]}>☉</Text>
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Ver tablón de empleos</Text>
          <Text style={styles.actionDesc}>+500 ofertas nuevas cada día</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionCard}
        onPress={() => navigation.navigate('Historial')}
      >
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(39,174,96,0.15)' }]}>
          <Text style={[styles.iconText, { color: '#27AE60' }]}>↗</Text>
        </View>
        <View style={styles.actionText}>
          <Text style={styles.actionTitle}>Mis envíos</Text>
          <Text style={styles.actionDesc}>Sigue el estado de tus candidaturas</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* Upgrade banner si es FREE */}
      {user?.plan === 'FREE' && (
        <View style={styles.upgradeBanner}>
          <Text style={styles.upgradeText}>
            🔥 Con el plan Pro envías <Text style={{ color: '#FFD700', fontWeight: '900' }}>10 CVs al día</Text> en vez de 2
          </Text>
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>Subir a Pro — 9,99€/mes</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17' },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { marginBottom: 24 },
  hello: { fontSize: 28, fontWeight: '900', color: '#fff' },
  subGreeting: { fontSize: 16, color: '#8892b0', marginTop: 4 },
  statsCard: {
    backgroundColor: 'rgba(20,25,45,0.9)', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', marginBottom: 30
  },
  statsTitle: { fontSize: 14, color: '#8892b0', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: '900', color: '#FF6B35' },
  statLabel: { fontSize: 12, color: '#8892b0', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  actionCard: {
    backgroundColor: 'rgba(20,25,45,0.9)', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.1)'
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,107,53,0.15)',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  iconText: { fontSize: 22, color: '#FF6B35', fontWeight: '700' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  actionDesc: { fontSize: 13, color: '#8892b0', marginTop: 2 },
  arrow: { fontSize: 20, color: '#FF6B35' },
  upgradeBanner: {
    backgroundColor: 'rgba(255,107,53,0.1)', borderRadius: 20, padding: 20,
    marginTop: 20, borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)'
  },
  upgradeText: { color: '#fff', fontSize: 15, lineHeight: 22, marginBottom: 14 },
  upgradeBtn: {
    backgroundColor: '#FF6B35', borderRadius: 50, padding: 14, alignItems: 'center'
  },
  upgradeBtnText: { color: '#0B0E17', fontWeight: '800', fontSize: 15 },
});
