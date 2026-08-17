import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { colors } from '../theme';

type Group = { id: number; name: string; iconUrl: string | null; _count: { services: number } };
type Category = { id: number; name: string; iconUrl: string | null };

export function HomeScreen({ onOpenGroup, onOpenCategory }: { onOpenGroup: (id: number, name: string) => void; onOpenCategory: (id: number, name: string) => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [groupRows, categoryRows] = await Promise.all([
          api<Group[]>('/public/service-groups', {}, false),
          api<Category[]>('/public/categories', {}, false),
        ]);
        setGroups(groupRows);
        setCategories(categoryRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Catalog unavailable');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      data={groups.length ? groups : categories.map((category) => ({ id: category.id, name: category.name, iconUrl: category.iconUrl, _count: { services: 0 } }))}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={<Text style={styles.heading}>Home services</Text>}
      ListEmptyComponent={<Text style={styles.muted}>No services are published for this hub yet.</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => (groups.length ? onOpenGroup(item.id, item.name) : onOpenCategory(item.id, item.name))}
        >
          {item.iconUrl ? <Image source={{ uri: item.iconUrl }} style={styles.icon} /> : <View style={styles.iconFallback} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.muted}>{item._count.services ? `${item._count.services} services` : 'View services'}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 12, gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 12 },
  iconFallback: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EDE9FE' },
  name: { fontWeight: '700', color: colors.text, fontSize: 16 },
  muted: { color: colors.muted, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: colors.danger, textAlign: 'center' },
});
