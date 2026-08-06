import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  bg: '#0B0B0B',
  accent: '#C49A44',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.4)',
  muted2: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.08)',
  card: 'rgba(255,255,255,0.03)',
  red: '#f87171',
  redBg: 'rgba(248,113,113,0.08)',
  redBorder: 'rgba(248,113,113,0.25)',
};

function Avatar({ user }) {
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
              // RootNavigator will automatically switch to AuthStack
            } catch {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.overline}>Your Account</Text>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar + name */}
        <View style={styles.profileCard}>
          <Avatar user={user} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.firstName} {user.lastName}</Text>
            <View style={[styles.roleBadge, user.role === 'admin' && styles.roleBadgeAdmin]}>
              <Text style={[styles.roleText, user.role === 'admin' && styles.roleTextAdmin]}>
                {user.role === 'admin' ? 'Studio Admin' : 'Customer'}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account Details</Text>
          <View style={styles.detailCard}>
            <InfoRow label="First Name"  value={user.firstName} />
            <InfoRow label="Last Name"   value={user.lastName} />
            <InfoRow label="Email"       value={user.email} />
            <InfoRow label="Phone"       value={user.phone} />
            {user.location ? <InfoRow label="Location" value={user.location} /> : null}
          </View>
        </View>

        {user.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bio</Text>
            <View style={styles.detailCard}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          </View>
        ) : null}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && styles.logoutDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator color={COLORS.red} size="small" />
          ) : (
            <Text style={styles.logoutText}>Sign Out</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.version}>His Inks Studio · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },
  header: { paddingTop: 24, paddingBottom: 24 },
  overline: {
    color: COLORS.accent, fontSize: 10,
    letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6,
  },
  title: { color: COLORS.text, fontSize: 32, fontWeight: '700' },

  // Avatar
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 32,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(196,154,68,0.15)',
    borderWidth: 1, borderColor: 'rgba(196,154,68,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: COLORS.accent, fontSize: 22, fontWeight: '700' },
  profileInfo: { gap: 8 },
  profileName: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  roleBadge: {
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  roleBadgeAdmin: {
    borderColor: 'rgba(196,154,68,0.4)',
    backgroundColor: 'rgba(196,154,68,0.08)',
  },
  roleText: { color: COLORS.muted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  roleTextAdmin: { color: COLORS.accent },

  // Sections
  section: { marginBottom: 24 },
  sectionLabel: {
    color: COLORS.muted, fontSize: 10, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 12,
  },
  detailCard: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoLabel: { color: COLORS.muted, fontSize: 12 },
  infoValue: { color: COLORS.text, fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  bioText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, padding: 16 },

  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 24 },

  // Logout
  logoutBtn: {
    borderWidth: 1, borderColor: COLORS.redBorder,
    backgroundColor: COLORS.redBg,
    paddingVertical: 14, alignItems: 'center', marginBottom: 24,
  },
  logoutDisabled: { opacity: 0.5 },
  logoutText: {
    color: COLORS.red, fontSize: 12, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase',
  },
  version: { color: COLORS.muted2, fontSize: 11, textAlign: 'center' },
});

export default ProfileScreen;
