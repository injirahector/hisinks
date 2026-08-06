import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

const Root = createNativeStackNavigator();

// ── Admin placeholder — admin work lives on the web dashboard ─────────────────
function AdminScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Admin</Text>
        </View>
        <Text style={styles.title}>Hi, {user?.firstName}</Text>
        <Text style={styles.body}>
          The admin dashboard is available on the web. Open the studio management
          panel in your browser to manage bookings, tattoos, and more.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => Linking.openURL('http://localhost:5173/admin')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Open Web Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RootNavigator() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#C49A44" size="large" />
      </View>
    );
  }

  // Not logged in — show auth screens
  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <Root.Navigator screenOptions={{ headerShown: false }}>
          <Root.Screen name="Auth" component={AuthStack} />
        </Root.Navigator>
      </NavigationContainer>
    );
  }

  // Admin — show redirect screen instead of customer app
  if (user?.role === 'admin') {
    return (
      <NavigationContainer>
        <Root.Navigator screenOptions={{ headerShown: false }}>
          <Root.Screen name="Admin" component={AdminScreen} />
        </Root.Navigator>
      </NavigationContainer>
    );
  }

  // Customer — show full app
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        <Root.Screen name="Main" component={MainStack} />
      </Root.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0B0B0B',
    justifyContent: 'center', alignItems: 'center',
  },
  inner: {
    paddingHorizontal: 32, alignItems: 'center',
  },
  badge: {
    borderWidth: 1, borderColor: 'rgba(196,154,68,0.4)',
    backgroundColor: 'rgba(196,154,68,0.1)',
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: 24,
  },
  badgeText: {
    color: '#C49A44', fontSize: 10,
    letterSpacing: 4, textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF', fontSize: 28, fontWeight: '700',
    textAlign: 'center', marginBottom: 16,
  },
  body: {
    color: 'rgba(255,255,255,0.45)', fontSize: 14,
    lineHeight: 22, textAlign: 'center', marginBottom: 32,
  },
  btn: {
    backgroundColor: '#C49A44',
    paddingVertical: 14, paddingHorizontal: 32,
    marginBottom: 16,
  },
  btnText: {
    color: '#0B0B0B', fontSize: 12, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase',
  },
  logoutBtn: { paddingVertical: 8 },
  logoutText: {
    color: 'rgba(255,255,255,0.35)', fontSize: 12,
    letterSpacing: 2, textTransform: 'uppercase',
  },
});

export default RootNavigator;
