import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  bg: '#0B0B0B',
  accent: '#C49A44',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.12)',
  inputBg: 'rgba(255,255,255,0.05)',
  error: '#f87171',
  errorBg: 'rgba(239,68,68,0.1)',
  errorBorder: 'rgba(239,68,68,0.3)',
};

function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const handleRegister = async () => {
    setFieldErrors({});
    setServerError('');
    setLoading(true);
    try {
      await register(form);
      // RootNavigator switches to MainStack automatically
    } catch (err) {
      if (err && typeof err === 'object' && !err.message) {
        setFieldErrors(err);
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => [
    styles.input,
    fieldErrors[field] ? styles.inputError : null,
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.overline}>Join the Studio</Text>
          <Text style={styles.title}>Create Account</Text>

          {!!serverError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          )}

          {/* First Name */}
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={inputStyle('firstName')}
            value={form.firstName}
            onChangeText={update('firstName')}
            placeholder="Jane"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
            autoComplete="given-name"
          />
          {!!fieldErrors.firstName && (
            <Text style={styles.fieldError}>{fieldErrors.firstName}</Text>
          )}

          {/* Last Name */}
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={inputStyle('lastName')}
            value={form.lastName}
            onChangeText={update('lastName')}
            placeholder="Doe"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
            autoComplete="family-name"
          />
          {!!fieldErrors.lastName && (
            <Text style={styles.fieldError}>{fieldErrors.lastName}</Text>
          )}

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={inputStyle('email')}
            value={form.email}
            onChangeText={update('email')}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {!!fieldErrors.email && (
            <Text style={styles.fieldError}>{fieldErrors.email}</Text>
          )}

          {/* Phone */}
          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            style={inputStyle('phone')}
            value={form.phone}
            onChangeText={update('phone')}
            placeholder="+254 7XX XXX XXX"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          {!!fieldErrors.phone && (
            <Text style={styles.fieldError}>{fieldErrors.phone}</Text>
          )}

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={inputStyle('password')}
            value={form.password}
            onChangeText={update('password')}
            placeholder="Min 8 chars, include a number"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
            autoComplete="new-password"
          />
          {!!fieldErrors.password && (
            <Text style={styles.fieldError}>{fieldErrors.password}</Text>
          )}

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.btnPrimaryText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  overline: {
    color: COLORS.accent,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    padding: 12,
    marginBottom: 20,
  },
  errorText: { color: COLORS.error, fontSize: 13, lineHeight: 18 },
  label: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 4,
  },
  inputError: { borderColor: COLORS.errorBorder },
  fieldError: { color: COLORS.error, fontSize: 11, marginBottom: 14, marginTop: 2 },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.55 },
  btnPrimaryText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: COLORS.muted, fontSize: 14 },
  footerLink: { color: COLORS.accent, fontSize: 14 },
});

export default RegisterScreen;
