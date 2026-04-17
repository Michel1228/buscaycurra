import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { cv } from '../services/api';
import { SECTOR_OPTIONS, SECTOR_TIPS } from '../utils/sectors';
import { Linking } from 'react-native';

export default function CreateCVScreen({ route }) {
  const [step, setStep] = useState(1); // 1=sector, 2=datos, 3=experiencia, 4=educación, 5=resultado
  const [loading, setLoading] = useState(false);
  const [createdCV, setCreatedCV] = useState(null);
  const [existingCVs, setExistingCVs] = useState([]);
  const [showList, setShowList] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', city: '',
    targetSector: '', targetPosition: '',
  });

  const [experiences, setExperiences] = useState([]);
  const [currentExp, setCurrentExp] = useState({ company: '', position: '', startDate: '', endDate: '', description: '' });

  const [educations, setEducations] = useState([]);
  const [currentEdu, setCurrentEdu] = useState({ institution: '', degree: '', year: '' });

  // Load existing CVs on mount
  useEffect(() => {
    loadCVs();
  }, []);

  const loadCVs = async () => {
    try {
      const { data } = await cv.list();
      if (data.cvs && data.cvs.length > 0) {
        setExistingCVs(data.cvs);
        setShowList(true);
      }
    } catch (e) {}
  };

  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const sectorTip = SECTOR_TIPS[formData.targetSector];

  const addExperience = () => {
    if (!currentExp.company || !currentExp.position) {
      Alert.alert('', 'Empresa y puesto son obligatorios');
      return;
    }
    setExperiences(prev => [...prev, currentExp]);
    setCurrentExp({ company: '', position: '', startDate: '', endDate: '', description: '' });
  };

  const removeExperience = (i) => setExperiences(prev => prev.filter((_, idx) => idx !== i));

  const addEducation = () => {
    if (!currentEdu.institution || !currentEdu.degree) {
      Alert.alert('', 'Centro y título son obligatorios');
      return;
    }
    setEducations(prev => [...prev, currentEdu]);
    setCurrentEdu({ institution: '', degree: '', year: '' });
  };

  const removeEducation = (i) => setEducations(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.targetSector) {
      Alert.alert('', 'Nombre y sector son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        experience: experiences,
        education: educations,
        skills: [],
        languages: [],
      };
      const { data } = await cv.create(payload);
      // Fetch the full CV (IA may have enhanced it)
      setTimeout(async () => {
        try {
          const { data: cvData } = await cv.get(data.cv.id);
          setCreatedCV(cvData.cv);
        } catch (e) {
          setCreatedCV(data.cv);
        }
        setStep(5);
        setLoading(false);
      }, 3000); // Give IA 3 seconds to process
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error al crear CV');
      setLoading(false);
    }
  };

  const viewCV = async (cvItem) => {
    try {
      const { data } = await cv.get(cvItem.id);
      setCreatedCV(data.cv);
      setStep(5);
      setShowList(false);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el CV');
    }
  };

  const startNew = () => {
    setShowList(false);
    setStep(1);
    setCreatedCV(null);
    setFormData({ fullName: '', email: '', phone: '', city: '', targetSector: '', targetPosition: '' });
    setExperiences([]);
    setEducations([]);
  };

  // CV List view
  if (showList && existingCVs.length > 0 && step !== 5) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mis Currículums</Text>
        <Text style={styles.subtitle}>Toca uno para ver el detalle</Text>

        {existingCVs.map((c, i) => (
          <TouchableOpacity key={c.id} style={styles.cvCard} onPress={() => viewCV(c)}>
            <View style={styles.cvCardLeft}>
              <Text style={styles.cvCardName}>{c.fullName}</Text>
              <Text style={styles.cvCardMeta}>{c.targetSector} — {c.targetPosition}</Text>
              <Text style={styles.cvCardDate}>{new Date(c.updatedAt).toLocaleDateString('es-ES')}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.btn} onPress={startNew}>
          <Text style={styles.btnText}>+ Crear nuevo CV</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 5: Show result
  if (step === 5 && createdCV) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tu CV está listo 🎉</Text>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Nombre</Text>
          <Text style={styles.resultValue}>{createdCV.fullName}</Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Sector → Puesto</Text>
          <Text style={styles.resultValue}>{createdCV.targetSector} → {createdCV.targetPosition}</Text>
        </View>

        {createdCV.summary ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>✨ Resumen profesional (generado por IA)</Text>
            <Text style={styles.resultText}>{createdCV.summary}</Text>
          </View>
        ) : null}

        {createdCV.skills && createdCV.skills.length > 0 ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>🎯 Habilidades</Text>
            <View style={styles.skillsRow}>
              {createdCV.skills.map((s, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {createdCV.coverLetter ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>📝 Carta de presentación</Text>
            <Text style={styles.resultText}>{createdCV.coverLetter}</Text>
          </View>
        ) : null}

        {createdCV.experience && createdCV.experience.length > 0 ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>💼 Experiencia</Text>
            {createdCV.experience.map((e, i) => (
              <View key={i} style={styles.expItem}>
                <Text style={styles.expTitle}>{e.position} en {e.company}</Text>
                <Text style={styles.expDate}>{e.startDate} — {e.endDate || 'Actual'}</Text>
                {e.description ? <Text style={styles.expDesc}>{e.description}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(cv.pdfUrl(createdCV.id))}>
          <Text style={styles.btnText}>Descargar PDF 📄</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={startNew}>
          <Text style={styles.btnSecondaryText}>Crear otro CV</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnSecondary, { marginTop: 8 }]} onPress={() => { setShowList(true); setStep(1); }}>
          <Text style={styles.btnSecondaryText}>Ver mis CVs</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {[1,2,3,4].map(s => (
          <View key={s} style={[styles.progressDot, step >= s && styles.progressDotActive]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>Paso {step} de 4</Text>

      {/* STEP 1: Sector */}
      {step === 1 && (
        <>
          <Text style={styles.title}>¿En qué sector buscas?</Text>
          <Text style={styles.subtitle}>Elegimos las mejores habilidades para tu sector</Text>

          <View style={styles.sectorGrid}>
            {SECTOR_OPTIONS.map(s => (
              <TouchableOpacity
                key={s.value}
                style={[styles.sectorChip, formData.targetSector === s.value && styles.sectorChipActive]}
                onPress={() => updateField('targetSector', s.value)}
              >
                <Text style={styles.sectorEmoji}>{s.emoji}</Text>
                <Text style={[styles.sectorText, formData.targetSector === s.value && styles.sectorTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {sectorTip && (
            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 Para {formData.targetSector.toLowerCase()}</Text>
              <Text style={styles.tipText}>{sectorTip}</Text>
            </View>
          )}

          <TextInput
            style={[styles.input, { marginTop: 20 }]}
            placeholder="Puesto que buscas (ej: Camarero, Operario...)"
            placeholderTextColor="#5a6478"
            value={formData.targetPosition}
            onChangeText={(v) => updateField('targetPosition', v)}
          />

          <TouchableOpacity
            style={[styles.btn, !formData.targetSector && styles.btnDisabled]}
            disabled={!formData.targetSector}
            onPress={() => setStep(2)}
          >
            <Text style={styles.btnText}>Siguiente →</Text>
          </TouchableOpacity>
        </>
      )}

      {/* STEP 2: Personal data */}
      {step === 2 && (
        <>
          <Text style={styles.title}>Tus datos personales</Text>

          <TextInput style={styles.input} placeholder="Nombre completo *" placeholderTextColor="#5a6478"
            value={formData.fullName} onChangeText={(v) => updateField('fullName', v)} />
          <TextInput style={styles.input} placeholder="Email *" placeholderTextColor="#5a6478"
            value={formData.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor="#5a6478"
            value={formData.phone} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Ciudad" placeholderTextColor="#5a6478"
            value={formData.city} onChangeText={(v) => updateField('city', v)} />

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(1)}>
              <Text style={styles.btnBackText}>← Atrás</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { flex: 1 }, !formData.fullName && styles.btnDisabled]}
              disabled={!formData.fullName}
              onPress={() => setStep(3)}
            >
              <Text style={styles.btnText}>Siguiente →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* STEP 3: Experience */}
      {step === 3 && (
        <>
          <Text style={styles.title}>Experiencia laboral</Text>
          <Text style={styles.subtitle}>Añade tus trabajos anteriores. Si no tienes, sáltalo.</Text>

          {experiences.map((e, i) => (
            <View key={i} style={styles.addedItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.addedTitle}>{e.position} — {e.company}</Text>
                <Text style={styles.addedMeta}>{e.startDate} → {e.endDate || 'Actual'}</Text>
              </View>
              <TouchableOpacity onPress={() => removeExperience(i)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addForm}>
            <TextInput style={styles.inputSmall} placeholder="Empresa *" placeholderTextColor="#5a6478"
              value={currentExp.company} onChangeText={(v) => setCurrentExp(p => ({...p, company: v}))} />
            <TextInput style={styles.inputSmall} placeholder="Puesto *" placeholderTextColor="#5a6478"
              value={currentExp.position} onChangeText={(v) => setCurrentExp(p => ({...p, position: v}))} />
            <View style={styles.dateRow}>
              <TextInput style={[styles.inputSmall, { flex: 1 }]} placeholder="Inicio (2023-01)" placeholderTextColor="#5a6478"
                value={currentExp.startDate} onChangeText={(v) => setCurrentExp(p => ({...p, startDate: v}))} />
              <TextInput style={[styles.inputSmall, { flex: 1 }]} placeholder="Fin (o vacío=actual)" placeholderTextColor="#5a6478"
                value={currentExp.endDate} onChangeText={(v) => setCurrentExp(p => ({...p, endDate: v}))} />
            </View>
            <TextInput style={[styles.inputSmall, { minHeight: 60 }]} placeholder="Descripción breve" placeholderTextColor="#5a6478"
              value={currentExp.description} onChangeText={(v) => setCurrentExp(p => ({...p, description: v}))} multiline />
            <TouchableOpacity style={styles.addBtn} onPress={addExperience}>
              <Text style={styles.addBtnText}>+ Añadir experiencia</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(2)}>
              <Text style={styles.btnBackText}>← Atrás</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={() => setStep(4)}>
              <Text style={styles.btnText}>{experiences.length > 0 ? 'Siguiente →' : 'Saltar →'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* STEP 4: Education */}
      {step === 4 && (
        <>
          <Text style={styles.title}>Educación / Formación</Text>
          <Text style={styles.subtitle}>Añade tus estudios. Si no tienes, sáltalo.</Text>

          {educations.map((e, i) => (
            <View key={i} style={styles.addedItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.addedTitle}>{e.degree}</Text>
                <Text style={styles.addedMeta}>{e.institution} — {e.year}</Text>
              </View>
              <TouchableOpacity onPress={() => removeEducation(i)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addForm}>
            <TextInput style={styles.inputSmall} placeholder="Centro / Instituto *" placeholderTextColor="#5a6478"
              value={currentEdu.institution} onChangeText={(v) => setCurrentEdu(p => ({...p, institution: v}))} />
            <TextInput style={styles.inputSmall} placeholder="Título / Grado *" placeholderTextColor="#5a6478"
              value={currentEdu.degree} onChangeText={(v) => setCurrentEdu(p => ({...p, degree: v}))} />
            <TextInput style={styles.inputSmall} placeholder="Año (2022)" placeholderTextColor="#5a6478"
              value={currentEdu.year} onChangeText={(v) => setCurrentEdu(p => ({...p, year: v}))} keyboardType="numeric" />
            <TouchableOpacity style={styles.addBtn} onPress={addEducation}>
              <Text style={styles.addBtnText}>+ Añadir formación</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(3)}>
              <Text style={styles.btnBackText}>← Atrás</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { flex: 1 }, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="#0B0E17" size="small" />
                  <Text style={[styles.btnText, { marginLeft: 8 }]}>La IA trabaja...</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>Crear mi CV con IA ✨</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0E17' },
  content: { padding: 20, paddingBottom: 60 },

  // Progress
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressDotActive: { backgroundColor: '#FF6B35' },
  stepLabel: { color: '#5a6478', fontSize: 12, marginBottom: 16 },

  // Typography
  title: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#5a6478', marginBottom: 20 },

  // Sectors
  sectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectorChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(20,25,45,0.9)'
  },
  sectorChipActive: { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.15)' },
  sectorEmoji: { fontSize: 18, marginRight: 6 },
  sectorText: { color: '#5a6478', fontSize: 14 },
  sectorTextActive: { color: '#FF6B35', fontWeight: '700' },

  // Tip
  tipBox: { backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  tipTitle: { color: '#FFD700', fontWeight: '700', marginBottom: 6, fontSize: 14 },
  tipText: { color: '#8892b0', lineHeight: 20, fontSize: 13 },

  // Inputs
  input: {
    backgroundColor: 'rgba(20,25,45,0.9)', borderRadius: 14, padding: 16,
    color: '#fff', fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
  },
  inputSmall: {
    backgroundColor: 'rgba(20,25,45,0.9)', borderRadius: 12, padding: 12,
    color: '#fff', fontSize: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
  },
  dateRow: { flexDirection: 'row', gap: 8 },

  // Buttons
  btn: { backgroundColor: '#FF6B35', borderRadius: 50, padding: 16, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#0B0E17', fontSize: 16, fontWeight: '800' },
  btnBack: { padding: 16, marginTop: 20, marginRight: 12 },
  btnBackText: { color: '#5a6478', fontSize: 16, fontWeight: '600' },
  btnSecondary: { borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)', borderRadius: 50, padding: 16, alignItems: 'center', marginTop: 12 },
  btnSecondaryText: { color: '#FF6B35', fontSize: 16, fontWeight: '700' },
  navRow: { flexDirection: 'row', alignItems: 'center' },

  // Add form
  addForm: { backgroundColor: 'rgba(20,25,45,0.5)', borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  addBtn: { backgroundColor: 'rgba(255,107,53,0.15)', borderRadius: 50, padding: 12, alignItems: 'center', marginTop: 4 },
  addBtnText: { color: '#FF6B35', fontWeight: '700', fontSize: 14 },

  // Added items
  addedItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,229,255,0.08)',
    borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)'
  },
  addedTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  addedMeta: { color: '#5a6478', fontSize: 12, marginTop: 2 },
  removeBtn: { color: '#ff4757', fontSize: 18, fontWeight: '700', paddingHorizontal: 8 },

  // CV List
  cvCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,25,45,0.9)',
    borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)'
  },
  cvCardLeft: { flex: 1 },
  cvCardName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cvCardMeta: { color: '#FF6B35', fontSize: 13, marginTop: 2 },
  cvCardDate: { color: '#5a6478', fontSize: 12, marginTop: 2 },
  arrow: { color: '#FF6B35', fontSize: 24, fontWeight: '700' },

  // Result
  resultCard: {
    backgroundColor: 'rgba(20,25,45,0.9)', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  resultLabel: { color: '#FF6B35', fontWeight: '700', fontSize: 13, marginBottom: 8 },
  resultValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultText: { color: '#c0c8d8', fontSize: 14, lineHeight: 22 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { backgroundColor: 'rgba(0,229,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)' },
  skillText: { color: '#00E5FF', fontSize: 13, fontWeight: '600' },
  expItem: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  expTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  expDate: { color: '#5a6478', fontSize: 12, marginTop: 2 },
  expDesc: { color: '#8892b0', fontSize: 13, marginTop: 4 },
});
