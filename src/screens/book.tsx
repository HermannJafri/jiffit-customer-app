import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../api';
import { colors } from '../theme';

type Address = { id: number; addressLine1: string; cityId: number; isDefault: boolean };
type SlotDay = { date: string; slots: Array<{ time: string; available: boolean; displayTime?: string }> };
type Service = { id: number; name: string };
type Variant = { id: number; name: string };

export function BookScreen({
  service,
  variant,
  onDone,
}: {
  service: Service;
  variant?: Variant;
  onDone: (bookingId: number) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [days, setDays] = useState<SlotDay[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [method, setMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<Address[]>('/customer/me/addresses').then((rows) => {
      setAddresses(rows);
      const def = rows.find((row) => row.isDefault) ?? rows[0];
      if (def) setAddressId(def.id);
    }).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!addressId) return;
    void api<{ dates: SlotDay[] }>('/customer/me/booking-slots/calculate', {
      method: 'POST',
      body: JSON.stringify({
        customerAddressId: addressId,
        serviceId: service.id,
        serviceVariantId: variant?.id,
      }),
    })
      .then((result) => {
        setDays((result.dates ?? []).map((day) => ({ date: day.date, slots: day.slots ?? [] })));
      })
      .catch((err: Error) => setError(err.message));
  }, [addressId, service.id, variant?.id]);

  const selected = days.find((day) => day.date === date);

  async function submit() {
    if (!addressId || !date || !time) {
      setError('Choose an address and a slot');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ booking: { id: number; status: string } }>(
        '/customer/me/bookings',
        {
          method: 'POST',
          body: JSON.stringify({
            idempotencyKey: `cust-${Date.now()}-${service.id}`,
            addressId,
            scheduledDate: date,
            scheduledFromTime: time,
            paymentMethod: method,
            items: [
              {
                serviceId: service.id,
                serviceVariantId: variant?.id,
                name: variant ? `${service.name} · ${variant.name}` : service.name,
                quantity: 1,
                unitPrice: 0,
                totalAmount: 0,
              },
            ],
          }),
        },
      );
      const bookingId = created.booking.id;
      if (method === 'ONLINE') {
        try {
          const checkout = await api<{ attempt?: { checkoutUrl?: string | null } }>(
            `/customer/me/bookings/${bookingId}/zoho-payment-link`,
            { method: 'POST' },
          );
          if (checkout.attempt?.checkoutUrl) {
            await WebBrowser.openBrowserAsync(checkout.attempt.checkoutUrl);
          }
        } catch (err) {
          const code = (err as { code?: string }).code;
          if (code === 'ZOHO_NOT_CONFIGURED') {
            await api(`/customer/me/bookings/${bookingId}/mock-payment`, { method: 'POST' });
          } else {
            throw err;
          }
        }
      }
      onDone(bookingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create booking');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Book {service.name}</Text>
      <Text style={styles.section}>Address</Text>
      {addresses.length === 0 ? <Text style={styles.muted}>Add an address from Profile first.</Text> : null}
      {addresses.map((address) => (
        <Pressable key={address.id} style={[styles.chip, addressId === address.id && styles.chipOn]} onPress={() => setAddressId(address.id)}>
          <Text>{address.addressLine1}</Text>
        </Pressable>
      ))}
      <Text style={styles.section}>Date</Text>
      {days.map((day) => (
        <Pressable key={day.date} style={[styles.chip, date === day.date && styles.chipOn]} onPress={() => { setDate(day.date); setTime(null); }}>
          <Text>{day.date}</Text>
        </Pressable>
      ))}
      <Text style={styles.section}>Slot</Text>
      {(selected?.slots ?? []).filter((slot) => slot.available).map((slot) => (
        <Pressable key={slot.time} style={[styles.chip, time === slot.time && styles.chipOn]} onPress={() => setTime(slot.time)}>
          <Text>{slot.displayTime ?? slot.time}</Text>
        </Pressable>
      ))}
      <Text style={styles.section}>Payment</Text>
      {(['CASH', 'ONLINE'] as const).map((value) => (
        <Pressable key={value} style={[styles.chip, method === value && styles.chipOn]} onPress={() => setMethod(value)}>
          <Text>{value === 'CASH' ? 'Cash after service' : 'Pay online (Zoho)'}</Text>
        </Pressable>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={() => void submit()} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm booking</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  section: { fontWeight: '700', marginTop: 16, marginBottom: 8, color: colors.text },
  chip: { backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  chipOn: { borderColor: colors.primary, backgroundColor: '#F5F3FF' },
  muted: { color: colors.muted },
  error: { color: colors.danger, marginTop: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
