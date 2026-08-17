import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { colors } from '../theme';

type Service = { id: number; name: string; price: string | number | null; duration: number | null; description?: string | null };
type Variant = { id: number; name: string; singlePrice: string | number | null; durationMinutes: number };

export function ServiceListScreen({
  groupId,
  title,
  onOpenService,
}: {
  groupId: number;
  title: string;
  onOpenService: (id: number) => void;
}) {
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void api<Service[]>(`/public/service-groups/${groupId}/services`, {}, false)
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [groupId]);
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={rows}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={<Text style={styles.heading}>{title}</Text>}
      ListEmptyComponent={<Text style={styles.muted}>No services in this group.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => onOpenService(item.id)}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.muted}>{item.price != null ? `₹${item.price}` : 'See options'} · {item.duration ?? 60} min</Text>
        </Pressable>
      )}
    />
  );
}

export function ServiceDetailScreen({ serviceId, onBook }: { serviceId: number; onBook: (service: Service & { variants: Variant[] }, variant?: Variant) => void }) {
  const [service, setService] = useState<(Service & { variants: Variant[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void api<Service & { variants: Variant[] }>(`/public/services/${serviceId}`, {}, false)
      .then(setService)
      .catch((err: Error) => setError(err.message));
  }, [serviceId]);
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  if (!service) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>{service.name}</Text>
      {service.description ? <Text style={styles.muted}>{service.description}</Text> : null}
      {(service.variants ?? []).map((variant) => (
        <Pressable key={variant.id} style={styles.card} onPress={() => onBook(service, variant)}>
          <Text style={styles.name}>{variant.name}</Text>
          <Text style={styles.muted}>₹{variant.singlePrice ?? service.price ?? '—'} · {variant.durationMinutes} min</Text>
          <Text style={styles.link}>Book this package</Text>
        </Pressable>
      ))}
      <Pressable style={styles.button} onPress={() => onBook(service)}>
        <Text style={styles.buttonText}>Book without variant</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  name: { fontWeight: '700', color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, marginTop: 6 },
  link: { color: colors.primary, marginTop: 8, fontWeight: '700' },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: colors.danger, textAlign: 'center' },
});
