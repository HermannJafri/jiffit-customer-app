import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { colors } from '../theme';

type Booking = {
  id: number;
  bookingNo: string;
  status: string;
  paymentStatus: string;
  payableTotal: string;
  scheduledDate: string | null;
  scheduledFromTime: string | null;
  items: Array<{ name: string }>;
};

export function BookingsScreen({ onOpen }: { onOpen: (id: number) => void }) {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void api<{ bookings: Booking[] }>('/customer/me/bookings')
      .then((data) => setRows(data.bookings))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={<Text style={styles.heading}>Your bookings</Text>}
      ListEmptyComponent={<Text style={styles.muted}>No bookings yet.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => onOpen(item.id)}>
          <Text style={styles.name}>{item.bookingNo}</Text>
          <Text style={styles.muted}>{item.items[0]?.name ?? 'Service'} · {item.status}</Text>
          <Text style={styles.muted}>{item.scheduledDate?.slice(0, 10)} {item.scheduledFromTime} · ₹{item.payableTotal}</Text>
        </Pressable>
      )}
    />
  );
}

export function BookingDetailScreen({ bookingId }: { bookingId: number }) {
  const [booking, setBooking] = useState<Booking & { serviceAddress?: string; customerNotes?: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    setBooking(await api(`/customer/me/bookings/${bookingId}`));
  }
  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [bookingId]);
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  if (!booking) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>{booking.bookingNo}</Text>
      <Text style={styles.muted}>{booking.status} · {booking.paymentStatus}</Text>
      <Text style={styles.body}>{booking.items.map((item) => item.name).join(', ')}</Text>
      <Text style={styles.body}>₹{booking.payableTotal}</Text>
      <Pressable
        style={[styles.button, { backgroundColor: colors.danger }]}
        disabled={busy || booking.status === 'CANCELLED' || booking.status === 'COMPLETED'}
        onPress={async () => {
          setBusy(true);
          try {
            await api(`/customer/me/bookings/${bookingId}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason: 'Customer cancelled from app' }) });
            await load();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Cancel failed');
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.buttonText}>Cancel booking</Text>
      </Pressable>
    </ScrollView>
  );
}

type Address = { id: number; label: string | null; addressLine1: string; pincode: string; isDefault: boolean };
type City = { id: number; name: string };

export function AddressesScreen() {
  const [rows, setRows] = useState<Address[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [line, setLine] = useState('');
  const [pincode, setPincode] = useState('');
  const [cityId, setCityId] = useState<number | null>(null);
  const [lat, setLat] = useState('25.5941');
  const [lng, setLng] = useState('85.1376');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [addresses, cityRows] = await Promise.all([
      api<Address[]>('/customer/me/addresses'),
      api<City[]>('/public/cities', {}, false),
    ]);
    setRows(addresses);
    setCities(cityRows);
    if (!cityId && cityRows[0]) setCityId(cityRows[0].id);
  }
  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Addresses</Text>
      {rows.map((row) => (
        <View key={row.id} style={styles.card}>
          <Text style={styles.name}>{row.label || row.addressLine1}</Text>
          <Text style={styles.muted}>{row.pincode}{row.isDefault ? ' · default' : ''}</Text>
        </View>
      ))}
      <Text style={styles.section}>Add address</Text>
      <TextInput placeholder="Address line" value={line} onChangeText={setLine} style={styles.input} />
      <TextInput placeholder="Pincode" value={pincode} onChangeText={setPincode} style={styles.input} keyboardType="number-pad" />
      <Text style={styles.muted}>City: pick from loaded list (first city used if you tap save).</Text>
      {cities.map((city) => (
        <Pressable key={city.id} style={[styles.chip, cityId === city.id && styles.chipOn]} onPress={() => setCityId(city.id)}>
          <Text>{city.name}</Text>
        </Pressable>
      ))}
      <TextInput placeholder="Latitude" value={lat} onChangeText={setLat} style={styles.input} />
      <TextInput placeholder="Longitude" value={lng} onChangeText={setLng} style={styles.input} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        onPress={async () => {
          if (!cityId) return;
          try {
            await api('/customer/me/addresses', {
              method: 'POST',
              body: JSON.stringify({
                addressLine1: line,
                cityId,
                pincode,
                latitude: Number(lat),
                longitude: Number(lng),
                isDefault: rows.length === 0,
              }),
            });
            setLine('');
            await load();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save address');
          }
        }}
      >
        <Text style={styles.buttonText}>Save address</Text>
      </Pressable>
    </ScrollView>
  );
}

export function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [me, setMe] = useState<{ name: string | null; phone: string } | null>(null);
  useEffect(() => {
    void api<{ name: string | null; phone: string }>('/auth/customer/me').then(setMe);
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.heading}>Profile</Text>
      <Text style={styles.body}>{me?.name || 'Jiffit customer'}</Text>
      <Text style={styles.muted}>{me?.phone}</Text>
      <Pressable style={[styles.button, { marginTop: 32 }]} onPress={onLogout}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12 },
  section: { fontWeight: '700', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  name: { fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, marginTop: 4 },
  body: { color: colors.text, marginTop: 8 },
  error: { color: colors.danger },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '700' },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  chip: { backgroundColor: colors.surface, padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  chipOn: { borderColor: colors.primary, backgroundColor: '#F5F3FF' },
});
