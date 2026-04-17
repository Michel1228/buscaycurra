import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert
} from 'react-native';
import { COLORS } from '../utils/colors';

export default function PhotoScreen() {
  const [photo, setPhoto] = useState(null);
  const [processedPhoto, setProcessedPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para mejorar tu foto de CV');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        setProcessedPhoto(null);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const takePhoto = async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a la cámara');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
        setProcessedPhoto(null);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  };

  const processPhoto = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      // Enviar a la API para procesar con remove.bg
      const formData = new FormData();
      formData.append('photo', {
        uri: photo,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      const response = await fetch('https://api.buscaycurra.es/api/cv/photo', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.ok) {
        const data = await response.json();
        setProcessedPhoto(data.processedUrl);
        Alert.alert('¡Listo! ✨', 'Tu foto ha sido mejorada profesionalmente');
      } else {
        // Fallback: usar la foto original
        setProcessedPhoto(photo);
        Alert.alert('Foto guardada', 'Se usará tu foto original (el servicio de mejora no está disponible ahora)');
      }
    } catch (e) {
      setProcessedPhoto(photo);
      Alert.alert('Foto guardada', 'Se usará tu foto original');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu foto profesional</Text>
      <Text style={styles.subtitle}>Sube una foto y la IA la mejora para tu CV</Text>

      {/* Zona de foto */}
      <View style={styles.photoZone}>
        {processedPhoto ? (
          <Image source={{ uri: processedPhoto }} style={styles.photo} />
        ) : photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📸</Text>
            <Text style={styles.placeholderText}>Sube tu foto</Text>
          </View>
        )}

        {processedPhoto && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✨ Mejorada</Text>
          </View>
        )}
      </View>

      {/* Botones */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.btnSecondary} onPress={pickPhoto}>
          <Text style={styles.btnSecondaryText}>🖼️ Galería</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={takePhoto}>
          <Text style={styles.btnSecondaryText}>📷 Cámara</Text>
        </TouchableOpacity>
      </View>

      {photo && !processedPhoto && (
        <TouchableOpacity 
          style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
          onPress={processPhoto}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.btnPrimaryText}>Mejorar foto con IA ✨</Text>
          )}
        </TouchableOpacity>
      )}

      {processedPhoto && (
        <TouchableOpacity style={styles.btnPrimary}>
          <Text style={styles.btnPrimaryText}>Usar en mi CV →</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.tip}>
        💡 Consejo: Usa una foto con buena luz, fondo liso y ropa formal. La IA eliminará el fondo y la optimizará.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24 },
  photoZone: {
    width: '100%', aspectRatio: 3 / 4, borderRadius: 24,
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border,
    borderStyle: 'dashed', overflow: 'hidden', marginBottom: 20, alignSelf: 'center',
    maxWidth: 280,
  },
  photo: { width: '100%', height: '100%', borderRadius: 22 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 50, marginBottom: 12 },
  placeholderText: { color: COLORS.textSecondary, fontSize: 16 },
  badge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: COLORS.success, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 6,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  buttonsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btnSecondary: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  btnSecondaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: 50, padding: 18,
    alignItems: 'center', marginBottom: 16,
  },
  btnPrimaryText: { color: COLORS.background, fontWeight: '800', fontSize: 16 },
  tip: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
