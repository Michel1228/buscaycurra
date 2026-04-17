import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/api';
import { COLORS } from '../utils/colors';

const { width, height } = Dimensions.get('window');

// Estrella animada
function Star({ delay, x }) {
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const loop = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 3000 + Math.random() * 2000,
        delay: delay,
        useNativeDriver: true,
      }).start(() => loop());
    };
    loop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, height + 20] }),
        opacity: anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 1, 1, 0] }),
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#fff',
      }}
    />
  );
}

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animaciones de entrada
  const logoScale = useRef(new Animated.Value(0)).current;
  const rocketY = useRef(new Animated.Value(height)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Secuencia de entrada: cohete sube → logo aparece → form aparece
    Animated.sequence([
      Animated.timing(rocketY, {
        toValue: height * 0.15,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rocketY, {
          toValue: -100,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ups', 'Rellena email y contraseña');
      return;
    }

    setLoading(true);
    try {
      const { data } = await auth.login({ email, password });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      onLogin();
    } catch (error) {
      const msg = error.response?.data?.error || 'Error al iniciar sesión';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Generar estrellas
  const stars = Array.from({ length: 30 }, (_, i) => (
    <Star key={i} delay={i * 200} x={Math.random() * width} />
  ));

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Fondo con estrellas */}
      <View style={styles.starsContainer}>{stars}</View>

      {/* Cohete animado */}
      <Animated.Text style={[styles.rocket, { transform: [{ translateY: rocketY }] }]}>
        🚀
      </Animated.Text>

      <View style={styles.content}>
        {/* Logo animado */}
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Text style={styles.logo}>🚀</Text>
          <Text style={styles.title}>BuscayCurra</Text>
          <Text style={styles.subtitle}>Tu empleo, más cerca</Text>
        </Animated.View>

        {/* Formulario con fade in */}
        <Animated.View style={{ opacity: formOpacity }}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.btn, loading && styles.btnDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.btnText}>Entrar 🚀</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>
              ¿No tienes cuenta? <Text style={styles.linkBold}>Créala gratis</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  starsContainer: { ...StyleSheet.absoluteFillObject },
  rocket: { position: 'absolute', fontSize: 50, alignSelf: 'center', zIndex: 10 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logo: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    color: '#fff', fontSize: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 50, padding: 18,
    alignItems: 'center', marginTop: 10, marginBottom: 20,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: COLORS.background, fontSize: 18, fontWeight: '800' },
  link: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 15 },
  linkBold: { color: COLORS.secondary, fontWeight: '700' },
});
