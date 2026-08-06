import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen       from '../screens/HomeScreen';
import PortfolioScreen  from '../screens/PortfolioScreen';
import BookingScreen    from '../screens/BookingScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import ProfileScreen    from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const COLORS = {
  bg:     '#0B0B0B',
  bar:    '#111111',
  accent: '#C49A44',
  muted:  'rgba(255,255,255,0.35)',
  border: 'rgba(255,255,255,0.08)',
};

// ── SVG-free icons using text/unicode ─────────────────────────────────────────
const ICONS = {
  Home:       { active: '⌂',  inactive: '⌂'  },
  Portfolio:  { active: '◈',  inactive: '◈'  },
  Booking:    { active: '✦',  inactive: '✦'  },
  MyBookings: { active: '▤',  inactive: '▤'  },
  Profile:    { active: '◉',  inactive: '◉'  },
};

function TabIcon({ name, focused }) {
  const icon = ICONS[name];
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
        {focused ? icon.active : icon.inactive}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 28, height: 28 },
  icon: { fontSize: 20, color: COLORS.muted },
  iconActive: { color: COLORS.accent },
});

function MainStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bar,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: {
          fontSize: 9,
          letterSpacing: 1,
          textTransform: 'uppercase',
          fontWeight: '600',
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen}       options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Portfolio"  component={PortfolioScreen}  options={{ tabBarLabel: 'Portfolio' }} />
      <Tab.Screen name="Booking"    component={BookingScreen}    options={{ tabBarLabel: 'Book' }} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}    options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default MainStack;
