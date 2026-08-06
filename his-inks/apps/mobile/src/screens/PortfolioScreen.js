import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import api from '../services/api';

const { width } = Dimensions.get('window');
const TILE = (width - 48 - 8) / 2; // 2-column grid with gaps

const COLORS = {
  bg: '#0B0B0B',
  accent: '#C49A44',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.4)',
  muted2: 'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.08)',
  card: 'rgba(255,255,255,0.04)',
};

function PortfolioScreen({ navigation }) {
  const [tattoos, setTattoos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/tattoos?limit=50')
      .then((r) => setTattoos(r.data.data.tattoos))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => setSelected(item)}
      activeOpacity={0.8}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.tileImage} />
      ) : (
        <View style={[styles.tileImage, styles.tileImagePlaceholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.tileInfo}>
        <Text style={styles.tileTitle} numberOfLines={1}>{item.title}</Text>
        {item.category ? <Text style={styles.tileStyle}>{item.category}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.overline}>The Work</Text>
        <Text style={styles.title}>Portfolio</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : tattoos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No portfolio pieces yet.</Text>
        </View>
      ) : (
        <FlatList
          data={tattoos}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Lightbox modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelected(null)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>

          {selected?.image ? (
            <Image
              source={{ uri: selected.image }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.modalImage, styles.tileImagePlaceholder]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          <View style={styles.modalInfo}>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            {selected?.category ? <Text style={styles.modalStyle}>{selected.category}</Text> : null}
            {selected?.description ? (
              <Text style={styles.modalDesc}>{selected.description}</Text>
            ) : null}
            {selected?.priceRange ? (
              <Text style={[styles.modalStyle, { marginTop: 6 }]}>{selected.priceRange}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => { setSelected(null); navigation.navigate('Booking'); }}
            activeOpacity={0.85}
          >
            <Text style={styles.bookBtnText}>Book Similar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  overline: {
    color: COLORS.accent,
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: COLORS.text, fontSize: 32, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 14 },
  errorBox: {
    margin: 24,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: '#f87171', fontSize: 13 },
  grid: { paddingHorizontal: 24, paddingBottom: 32 },
  row: { gap: 8, marginBottom: 8 },
  tile: {
    width: TILE,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tileImage: { width: TILE, height: TILE, backgroundColor: COLORS.card },
  tileImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: COLORS.muted2, fontSize: 11 },
  tileInfo: { padding: 10 },
  tileTitle: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  tileStyle: { color: COLORS.accent, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.93)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalClose: {
    position: 'absolute',
    top: 56,
    right: 24,
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: { color: COLORS.muted, fontSize: 16 },
  modalImage: {
    width: width - 48,
    height: width - 48,
    backgroundColor: COLORS.card,
  },
  modalInfo: { width: '100%', marginTop: 16 },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modalStyle: {
    color: COLORS.accent,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  modalDesc: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  bookBtn: {
    marginTop: 20,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  bookBtnText: {
    color: COLORS.bg,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

export default PortfolioScreen;
