import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const COLORS = {
  bg: '#0B0B0B',
  accent: '#C49A44',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.4)',
  muted2: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.08)',
  card: 'rgba(255,255,255,0.03)',
};

const STATUS = {
  pending:   { label: 'Pending Review', text: '#facc15', bg: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.3)' },
  confirmed: { label: 'Confirmed',      text: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)' },
  completed: { label: 'Completed',      text: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)' },
  cancelled: { label: 'Cancelled',      text: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
};

const STATUS_MESSAGES = {
  pending:   "We've received your request and will be in touch within 24–48 hours.",
  confirmed: 'Your appointment is confirmed! We look forward to seeing you.',
  completed: 'Session complete. Thank you for choosing His Inks Studio.',
  cancelled: 'This booking was cancelled. Feel free to submit a new request.',
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

// ── Booking detail modal ──────────────────────────────────────────────────────
function BookingModal({ booking, onClose }) {
  const s = STATUS[booking.status] || STATUS.pending;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modalStyles.container}>
        {/* Handle bar */}
        <View style={modalStyles.handle} />

        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.title} numberOfLines={1}>{booking.tattooIdea}</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Text style={modalStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <FlatList
            data={[booking]}
            keyExtractor={() => 'detail'}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scroll}
            renderItem={() => (
              <>
                {/* Status banner */}
                <View style={[modalStyles.statusBanner, { backgroundColor: s.bg, borderColor: s.border }]}>
                  <Text style={[modalStyles.statusBannerText, { color: s.text }]}>
                    {STATUS_MESSAGES[booking.status]}
                  </Text>
                </View>

                {/* Studio note */}
                {booking.notes ? (
                  <View style={modalStyles.noteBox}>
                    <Text style={modalStyles.noteLabel}>Studio Note</Text>
                    <Text style={modalStyles.noteText}>{booking.notes}</Text>
                  </View>
                ) : null}

                {/* Details grid */}
                <View style={modalStyles.grid}>
                  {[
                    ['Placement',      booking.placement],
                    ['Size',           booking.size],
                    ['Preferred Date', fmtDate(booking.preferredDate)],
                    ['Phone',          booking.phone],
                    ['Submitted',      fmtDate(booking.createdAt)],
                  ].map(([label, value]) => (
                    <View key={label} style={modalStyles.gridItem}>
                      <Text style={modalStyles.gridLabel}>{label}</Text>
                      <Text style={modalStyles.gridValue}>{value}</Text>
                    </View>
                  ))}
                </View>

                {/* Description */}
                {booking.description ? (
                  <View style={modalStyles.section}>
                    <Text style={modalStyles.sectionLabel}>Description</Text>
                    <Text style={modalStyles.sectionText}>{booking.description}</Text>
                  </View>
                ) : null}

                {/* Reference image */}
                {booking.referenceImage ? (
                  <View style={modalStyles.section}>
                    <Text style={modalStyles.sectionLabel}>Reference Image</Text>
                    <Image
                      source={{ uri: booking.referenceImage }}
                      style={modalStyles.refImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}
              </>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

// ── Booking card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, onPress }) {
  const s = STATUS[booking.status] || STATUS.pending;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardMain}>
        <Text style={styles.cardTitle} numberOfLines={1}>{booking.tattooIdea}</Text>
        <Text style={styles.cardSub}>
          {booking.placement} · {booking.size} · {fmtDate(booking.preferredDate)}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
        <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');
  const [selected, setSelected]   = useState(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/users/my-bookings');
      setBookings(res.data.data.bookings);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload whenever screen is focused (e.g. after submitting a booking)
  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = () => { setRefreshing(true); load(true); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.overline}>Your Account</Text>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No booking requests yet.</Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Booking')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Book an Appointment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b._id}
          renderItem={({ item }) => (
            <BookingCard booking={item} onPress={() => setSelected(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
        />
      )}

      {selected && (
        <BookingModal booking={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  overline: {
    color: COLORS.accent, fontSize: 10,
    letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6,
  },
  title: { color: COLORS.text, fontSize: 32, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, padding: 24 },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: 'center' },
  errorBox: {
    margin: 24, padding: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: '#f87171', fontSize: 13 },
  list: { paddingHorizontal: 24, paddingBottom: 32, gap: 10 },
  card: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cardMain: { flex: 1, minWidth: 0 },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardSub: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  badge: {
    borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
    flexShrink: 0,
  },
  badgeText: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  btnPrimaryText: {
    color: COLORS.bg, fontSize: 12, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase',
  },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  handle: {
    width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { flex: 1, color: COLORS.text, fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  closeBtnText: { color: COLORS.muted, fontSize: 18 },
  scroll: { padding: 20, gap: 16 },
  statusBanner: {
    borderWidth: 1, padding: 12,
  },
  statusBannerText: { fontSize: 13, lineHeight: 20 },
  noteBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: COLORS.border, padding: 14,
  },
  noteLabel: {
    color: COLORS.muted, fontSize: 10, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 6,
  },
  noteText: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridItem: { width: '45%' },
  gridLabel: {
    color: COLORS.muted2, fontSize: 10, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 4,
  },
  gridValue: { color: COLORS.text, fontSize: 13 },
  section: { gap: 8 },
  sectionLabel: {
    color: COLORS.muted, fontSize: 10, letterSpacing: 3,
    textTransform: 'uppercase',
  },
  sectionText: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  refImage: { width: '100%', height: 200, backgroundColor: COLORS.card },
});

export default MyBookingsScreen;
