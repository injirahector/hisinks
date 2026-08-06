import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  bg: '#0B0B0B',
  accent: '#C49A44',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.4)',
  muted2: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.10)',
  borderFocus: '#C49A44',
  inputBg: 'rgba(255,255,255,0.05)',
  error: '#f87171',
  errorBg: 'rgba(239,68,68,0.08)',
  errorBorder: 'rgba(239,68,68,0.3)',
  card: 'rgba(255,255,255,0.03)',
};

const SIZES = ['Small', 'Medium', 'Large', 'Extra Large', 'Half Sleeve', 'Full Sleeve'];
const PLACEMENTS = [
  'Forearm','Upper Arm','Shoulder','Back','Chest',
  'Ribs','Wrist','Hand','Neck','Leg','Ankle','Foot','Other',
];

const EMPTY = {
  customerName: '', phone: '', email: '',
  tattooIdea: '', description: '',
  placement: '', size: '', preferredDate: '',
};

function Field({ label, required, error, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{required ? <Text style={{ color: COLORS.accent }}> *</Text> : null}
      </Text>
      {children}
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

function SelectPill({ options, value, onChange }) {
  return (
    <View style={styles.pillWrap}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.pill, value === opt && styles.pillActive]}
          onPress={() => onChange(opt)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pillText, value === opt && styles.pillTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function BookingScreen({ navigation }) {
  const { user } = useAuth();

  // ── Auth gate ────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Text style={{ fontSize: 28 }}>🔒</Text>
          </View>
          <Text style={styles.successOverline}>Account Required</Text>
          <Text style={styles.successTitle}>Sign in to book</Text>
          <Text style={styles.successBody}>
            You need an account to submit a booking request. This lets you track
            your appointment status and receive updates from the studio.
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const [form, setForm]         = useState({ ...EMPTY });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  const set = (k) => (v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: '' }));
  };

  // ── Pick image from library ──────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageUrl(''); // reset previously uploaded URL
      uploadImage(asset);
    }
  };

  // ── Upload to server ─────────────────────────────────────────────────────────
  const uploadImage = async (asset) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const ext = asset.uri.split('.').pop() || 'jpg';
      formData.append('image', {
        uri: asset.uri,
        name: `reference.${ext}`,
        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      });
      const res = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.data.url);
    } catch (e) {
      Alert.alert('Upload failed', e.message || 'Could not upload image.');
      setImageUri(null);
    } finally {
      setUploading(false);
    }
  };

  // ── Submit booking ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setServerErr('');
    setErrors({});

    // Basic client validation
    const errs = {};
    if (!form.customerName.trim()) errs.customerName = 'Full name is required.';
    if (!form.phone.trim())        errs.phone = 'Phone number is required.';
    if (!form.tattooIdea.trim())   errs.tattooIdea = 'Tattoo idea is required.';
    if (!form.description.trim())  errs.description = 'Description is required.';
    if (!form.placement)           errs.placement = 'Placement is required.';
    if (!form.size)                errs.size = 'Size is required.';
    if (!form.preferredDate.trim()) errs.preferredDate = 'Preferred date is required.';

    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Wait if still uploading
    if (uploading) {
      Alert.alert('Please wait', 'Image is still uploading…');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bookings', { ...form, referenceImage: imageUrl || undefined });
      setSuccess(true);
    } catch (e) {
      setServerErr(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({ ...EMPTY });
    setErrors({});
    setImageUri(null);
    setImageUrl('');
    setServerErr('');
    setSuccess(false);
  };

  // ── Success screen ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Text style={{ fontSize: 28 }}>✓</Text>
          </View>
          <Text style={styles.successOverline}>Request Received</Text>
          <Text style={styles.successTitle}>We'll be in touch</Text>
          <Text style={styles.successBody}>
            Your booking request has been submitted. We'll review your idea and
            contact you within 24–48 hours to confirm your appointment.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={reset} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Submit Another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.overline}>Get Inked</Text>
            <Text style={styles.title}>Book an Appointment</Text>
            <Text style={styles.subtitle}>
              Tell us about your vision. We'll reach out to confirm details.
            </Text>
          </View>

          {!!serverErr && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{serverErr}</Text>
            </View>
          )}

          {/* ── Your Details ── */}
          <Text style={styles.sectionLabel}>Your Details</Text>

          <Field label="Full Name" required error={errors.customerName}>
            <TextInput
              style={[styles.input, errors.customerName && styles.inputError]}
              value={form.customerName}
              onChangeText={set('customerName')}
              placeholder="John Doe"
              placeholderTextColor={COLORS.muted}
            />
          </Field>

          <Field label="Phone" required error={errors.phone}>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={form.phone}
              onChangeText={set('phone')}
              placeholder="+254 7XX XXX XXX"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
            />
          </Field>

          <Field label="Email (optional)" error={errors.email}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={form.email}
              onChangeText={set('email')}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          {/* ── Tattoo Details ── */}
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Tattoo Details</Text>

          <Field label="Tattoo Idea" required error={errors.tattooIdea}>
            <TextInput
              style={[styles.input, errors.tattooIdea && styles.inputError]}
              value={form.tattooIdea}
              onChangeText={set('tattooIdea')}
              placeholder="e.g. Lion, Lotus mandala, Japanese sleeve…"
              placeholderTextColor={COLORS.muted}
            />
          </Field>

          <Field label="Description" required error={errors.description}>
            <TextInput
              style={[styles.input, styles.textarea, errors.description && styles.inputError]}
              value={form.description}
              onChangeText={set('description')}
              placeholder="Describe the style, mood, colours, and any specific details…"
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>

          <Field label="Placement" required error={errors.placement}>
            <SelectPill options={PLACEMENTS} value={form.placement} onChange={set('placement')} />
          </Field>

          <Field label="Size" required error={errors.size}>
            <SelectPill options={SIZES} value={form.size} onChange={set('size')} />
          </Field>

          {/* ── Reference Image ── */}
          <Field label="Reference Image (optional)">
            {imageUri ? (
              <View>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color={COLORS.accent} />
                    <Text style={styles.uploadingText}>Uploading…</Text>
                  </View>
                )}
                {!uploading && imageUrl ? (
                  <Text style={styles.uploadedText}>✓ Uploaded</Text>
                ) : null}
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setImageUri(null); setImageUrl(''); }}>
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.7}>
                <Text style={styles.imagePickerIcon}>↑</Text>
                <Text style={styles.imagePickerText}>Tap to upload reference image</Text>
                <Text style={styles.imagePickerHint}>JPG, PNG, WebP · max 5 MB</Text>
              </TouchableOpacity>
            )}
          </Field>

          {/* ── Scheduling ── */}
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Scheduling</Text>

          <Field label="Preferred Date (YYYY-MM-DD)" required error={errors.preferredDate}>
            <TextInput
              style={[styles.input, errors.preferredDate && styles.inputError]}
              value={form.preferredDate}
              onChangeText={set('preferredDate')}
              placeholder="e.g. 2026-09-15"
              placeholderTextColor={COLORS.muted}
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.hint}>We'll confirm availability when we contact you.</Text>
          </Field>

          <TouchableOpacity
            style={[styles.btnPrimary, (loading || uploading) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading || uploading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.btnPrimaryText}>Submit Booking Request</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By submitting you agree to be contacted regarding your appointment.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },
  header: { paddingTop: 24, paddingBottom: 24 },
  overline: {
    color: COLORS.accent, fontSize: 10,
    letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8,
  },
  title: { color: COLORS.text, fontSize: 32, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 22 },
  sectionLabel: {
    color: COLORS.accent, fontSize: 10, letterSpacing: 4,
    textTransform: 'uppercase', marginBottom: 16,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  field: { marginBottom: 20 },
  label: {
    color: COLORS.muted, fontSize: 10, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1, borderColor: COLORS.border,
    color: COLORS.text,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14,
  },
  inputError: { borderColor: 'rgba(239,68,68,0.6)' },
  textarea: { height: 100, paddingTop: 12 },
  fieldError: { color: COLORS.error, fontSize: 12, marginTop: 4 },
  hint: { color: COLORS.muted2, fontSize: 11, marginTop: 6 },
  errorBox: {
    backgroundColor: COLORS.errorBg, borderWidth: 1,
    borderColor: COLORS.errorBorder, padding: 12, marginBottom: 20,
  },
  errorText: { color: COLORS.error, fontSize: 13 },

  // Pill selector
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  pillActive: { borderColor: COLORS.accent, backgroundColor: 'rgba(196,154,68,0.1)' },
  pillText: { color: COLORS.muted, fontSize: 12 },
  pillTextActive: { color: COLORS.accent },

  // Image picker
  imagePicker: {
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
    backgroundColor: COLORS.card,
    paddingVertical: 28, alignItems: 'center', gap: 6,
  },
  imagePickerIcon: { color: COLORS.muted, fontSize: 24 },
  imagePickerText: { color: COLORS.muted, fontSize: 14 },
  imagePickerHint: { color: COLORS.muted2, fontSize: 11 },
  imagePreview: { width: '100%', height: 200, backgroundColor: COLORS.card },
  uploadingOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  uploadingText: { color: COLORS.text, fontSize: 12 },
  uploadedText: { color: '#4ade80', fontSize: 12, marginTop: 6 },
  removeImageBtn: { marginTop: 8, alignSelf: 'flex-start' },
  removeImageText: { color: COLORS.error, fontSize: 12 },

  // Submit button
  btnPrimary: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: {
    color: COLORS.bg, fontSize: 12, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase',
  },
  disclaimer: {
    color: COLORS.muted2, fontSize: 11,
    textAlign: 'center', marginTop: 16, lineHeight: 18,
  },

  // Success
  successWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1, borderColor: 'rgba(196,154,68,0.3)',
    backgroundColor: 'rgba(196,154,68,0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  successOverline: {
    color: COLORS.accent, fontSize: 10, letterSpacing: 4,
    textTransform: 'uppercase', marginBottom: 8,
  },
  successTitle: {
    color: COLORS.text, fontSize: 32, fontWeight: '700',
    textAlign: 'center', marginBottom: 16,
  },
  successBody: {
    color: COLORS.muted, fontSize: 14, lineHeight: 22,
    textAlign: 'center', marginBottom: 32,
  },
});

export default BookingScreen;
