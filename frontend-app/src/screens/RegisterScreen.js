import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/api';

export default function RegisterScreen({ navigation, onRegister }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Ups', 'Nombre, email y contraseña son obligatorios');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Ups', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { data } = await auth.register({ name, email, phone, password });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      onRegister();
    } catch (error) {
      const msg = error.response?.data?.error || 'Error al crear la cuenta';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>🚀</Text>
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Empieza a buscar empleo con IA</Text>

        <TextInput
          style={styles.input}
          placeholder="Tu nombre completo"
          placeholderTextColor="#8892b0"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8892b0"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Teléfono (opcional)"
          placeholderTextColor="#8892b0"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña (mínimo 6 caracteres)"
          placeholderTextColor="#8892b0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.btn, loading && styles.btnDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0B0E17" />
          ) : (
            <Text style={styles.btnText}>Crear cuenta gratis ✨</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>
            ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 40 },
  logo: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#FF6B35', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#8892b0', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: 'rgba(20,25,45,0.9)', borderRadius: 16, padding: 16,
    color: '#fff', fontSize: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)'
  },
  btn: {
    backgroundColor: '#FF6B35', borderRadius: 50, padding: 18,
    alignItems: 'center', marginTop: 10, marginBottom: 20
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#0B0E17', fontSize: 18, fontWeight: '800' },
  link: { color: '#8892b0', textAlign: 'center', fontSize: 15 },
  linkBold: { color: '#00E5FF', fontWeight: '700' },
});
