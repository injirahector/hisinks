import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const COLORS = {
  bg: '#0B0B0B',
  accent: '#C49A44',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.08)',
};

function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.overline}>Premium Tattoo Art</Text>
          <Text style={styles.title}>His Inks{'\n'}Studio</Text>
          <Text style={styles.subtitle}>
            Where skin becomes a canvas. Bespoke tattoo artistry crafted with
            precision, passion, and permanent beauty.
          </Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Booking')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Book Appointment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnOutline}
            onPress={() => navigation.navigate('Portfolio')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnOutlineText}>View Portfolio</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionOverline}>What We Offer</Text>
          <Text style={styles.sectionTitle}>Services</Text>

          {[
            { title: 'Custom Designs', desc: 'Original artwork created exclusively for you.' },
            { title: 'Fine Line', desc: 'Delicate, precise linework for minimal aesthetics.' },
            { title: 'Black & Grey', desc: 'Timeless shading and depth in monochrome.' },
            { title: 'Cover-Ups', desc: 'Transform old ink into something new.' },
          ].map((item) => (
            <View key={item.title} style={styles.serviceCard}>
              <View style={styles.serviceAccentBar} />
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Text style={styles.serviceDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 },
  overline: {
    color: COLORS.accent,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
    marginBottom: 16,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 24,
  },
  ctaRow: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: COLORS.bg,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 24,
    marginBottom: 32,
  },
  section: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionOverline: {
    color: COLORS.accent,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginBottom: 12,
  },
  serviceAccentBar: {
    width: 32,
    height: 2,
    backgroundColor: COLORS.accent,
    marginBottom: 12,
  },
  serviceTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  serviceDesc: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
});

export default HomeScreen;
