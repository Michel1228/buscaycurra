import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Salir', 
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user']);
          // Forzar reload — en producción usar contexto
        }
      }
    ]);
  };

  const planColors = { FREE: '#8892b0', PRO: '#FF6B35', PREMIUM: '#FFD700' };
  const planLabels = { FREE: 'Gratuito', PRO: 'Pro', PREMIUM: 'Premium' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        <View style={[styles.planBadge, { borderColor: planColors[user?.plan] || '#8892b0' }]}>
          <Text style={[styles.planText, { color: planColors[user?.plan] || '#8892b0' }]}>
            Plan {planLabels[user?.plan] || 'Gratuito'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📄</Text>
          <Text style={styles.menuText}>Mis CVs</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>⭐</Text>
          <Text style={styles.menuText}>Ofertas guardadas</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={styles.menuText}>Notificaciones</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {user?.plan === 'FREE' && (
          <TouchableOpacity style={[styles.menuItem, styles.upgradeItem]}>
            <Text style={styles.menuIcon}>🚀</Text>
            <Text style={[styles.menuText, { color: '#FF6B35' }]}>Subir de plan</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>BuscayCurra v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#0B0E17' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  email: { fontSize: 14, color: '#8892b0', marginTop: 4 },
  planBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 12 },
  planText: { fontSize: 13, fontWeight: '700' },
  section: { marginBottom: 20 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: 'rgba(20,25,45,0.9)', borderRadius: 16, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.1)'
  },
  upgradeItem: { borderColor: 'rgba(255,107,53,0.3)' },
  menuIcon: { fontSize: 22, marginRight: 12 },
  menuText: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '500' },
  arrow: { fontSize: 18, color: '#8892b0' },
  logoutBtn: {
    padding: 16, borderRadius: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,100,100,0.3)'
  },
  logoutText: { color: '#ff6b6b', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: '#8892b0', marginTop: 20, fontSize: 12 },
});
