import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Linking
} from 'react-native';
import { COLORS } from '../utils/colors';
import { jobs } from '../services/api';

export default function JobBoardScreen() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Buscando ubicación...');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      // Expo location
      const { status } = await (async () => {
        try {
          const Location = require('expo-location');
          const perm = await Location.requestForegroundPermissionsAsync();
          if (perm.status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            
            // Reverse geocode
            const [geo] = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (geo) {
              setLocationName(`${geo.city || geo.district}, ${geo.region}`);
            }
            return { status: 'granted' };
          }
          return perm;
        } catch (e) {
          return { status: 'denied' };
        }
      })();

      if (status !== 'granted') {
        setLocationName('Ubicación no disponible');
      }
    } catch (e) {
      setLocationName('Error de ubicación');
    } finally {
      setGpsLoading(false);
    }
  };

  const searchJobs = async () => {
    setLoading(true);
    try {
      const params = { search };
      if (location) {
        params.lat = location.lat;
        params.lng = location.lng;
      }
      const { data } = await jobs.list(params);
      setListings(data.jobs || []);
      if (!data.jobs?.length) {
        Alert.alert('Sin resultados', 'No encontramos ofertas con esos filtros. Prueba con otros términos.');
      }
    } catch (e) {
      // Si la API no tiene endpoint de jobs aún, mostrar demo
      setListings(getDemoJobs());
    } finally {
      setLoading(false);
    }
  };

  const getDemoJobs = () => [
    { id: 1, title: 'Camarero/a', company: 'Restaurante El Faro', location: 'Madrid', salary: '1.200-1.400€', type: 'Tiempo completo', sector: '🍽️' },
    { id: 2, title: 'Operario/a de producción', company: 'Industrias González', location: 'Getafe', salary: '1.300-1.500€', type: 'Tiempo completo', sector: '🏭' },
    { id: 3, title: 'Dependiente/a', company: 'Modas Lucía', location: 'Alcorcón', salary: '1.100-1.300€', type: 'Media jornada', sector: '🛍️' },
    { id: 4, title: 'Auxiliar administrativo/a', company: 'Gestoría López', location: 'Madrid Centro', salary: '1.200-1.400€', type: 'Tiempo completo', sector: '💼' },
    { id: 5, title: 'Repartidor/a', company: 'LogiExpress', location: 'Zona Sur Madrid', salary: '1.300-1.600€', type: 'Tiempo completo', sector: '🚛' },
    { id: 6, title: 'Auxiliar de enfermería', company: 'Residencia Sol', location: 'Leganés', salary: '1.400-1.600€', type: 'Turnos rotativos', sector: '🏥' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header con ubicación */}
      <View style={styles.header}>
        <Text style={styles.title}>Tablón de Empleos</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          {gpsLoading ? (
            <ActivityIndicator size="small" color={COLORS.secondary} />
          ) : (
            <Text style={styles.locationText}>{locationName}</Text>
          )}
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar empleo, empresa, sector..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={searchJobs}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={searchJobs}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <Text style={styles.searchBtnText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Filtros rápidos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {['🍽️ Hostelería', '🏭 Industria', '💼 Oficina', '🛍️ Comercio', '🏥 Salud', '🚛 Transporte'].map(f => (
          <TouchableOpacity key={f} style={styles.filterChip} onPress={() => { setSearch(f.split(' ')[1]); searchJobs(); }}>
            <Text style={styles.filterText}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Resultados */}
      <Text style={styles.sectionTitle}>
        {listings.length > 0 ? `${listings.length} ofertas encontradas` : 'Ofertas cerca de ti'}
      </Text>

      {listings.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Busca empleos por sector, puesto o empresa</Text>
          <Text style={styles.emptySubtext}>Usa el buscador o los filtros rápidos</Text>
        </View>
      )}

      {listings.map(job => (
        <TouchableOpacity key={job.id} style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobSector}>{job.sector}</Text>
            <Text style={styles.jobType}>{job.type}</Text>
          </View>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>
          <View style={styles.jobFooter}>
            <Text style={styles.jobLocation}>📍 {job.location}</Text>
            <Text style={styles.jobSalary}>💰 {job.salary}</Text>
          </View>
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Enviar CV →</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  locationIcon: { fontSize: 16, marginRight: 6 },
  locationText: { color: COLORS.secondary, fontSize: 14, fontWeight: '600' },
  searchRow: { flexDirection: 'row', marginBottom: 16 },
  searchInput: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: COLORS.border, marginRight: 10,
  },
  searchBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16, width: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBtnText: { fontSize: 20 },
  filters: { marginBottom: 20 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, marginRight: 8,
  },
  filterText: { color: COLORS.textSecondary, fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 50, marginBottom: 16 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 14, marginTop: 6 },
  jobCard: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  jobSector: { fontSize: 24 },
  jobType: { color: COLORS.secondary, fontSize: 12, fontWeight: '600', alignSelf: 'center' },
  jobTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  jobCompany: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 10 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  jobLocation: { color: COLORS.textSecondary, fontSize: 13 },
  jobSalary: { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
  applyBtn: {
    backgroundColor: 'rgba(255,107,53,0.12)', borderRadius: 50, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)',
  },
  applyBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
