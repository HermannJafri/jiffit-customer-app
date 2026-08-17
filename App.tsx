import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { colors } from './src/theme';
import { OtpScreen, PhoneScreen, SplashScreen } from './src/screens/auth';
import { HomeScreen } from './src/screens/home';
import { ServiceDetailScreen, ServiceListScreen } from './src/screens/service';
import { BookScreen } from './src/screens/book';
import { AddressesScreen, BookingDetailScreen, BookingsScreen, ProfileScreen } from './src/screens/account';

type Route =
  | { name: 'splash' }
  | { name: 'phone' }
  | { name: 'otp'; phone: string }
  | { name: 'home' }
  | { name: 'group'; id: number; title: string }
  | { name: 'service'; id: number }
  | { name: 'book'; service: { id: number; name: string }; variant?: { id: number; name: string } }
  | { name: 'bookings' }
  | { name: 'booking'; id: number }
  | { name: 'profile' }
  | { name: 'addresses' };

function Shell() {
  const { ready, customer, logout } = useAuth();
  const [route, setRoute] = useState<Route>({ name: 'splash' });
  const tab = route.name === 'bookings' || route.name === 'booking' ? 'bookings' : route.name === 'profile' || route.name === 'addresses' ? 'profile' : 'home';

  const screen = useMemo(() => {
    if (!ready || route.name === 'splash') {
      return <SplashScreen onReady={(authed) => setRoute(authed ? { name: 'home' } : { name: 'phone' })} />;
    }
    if (!customer) {
      if (route.name === 'otp') return <OtpScreen phone={route.phone} onDone={() => setRoute({ name: 'home' })} />;
      return <PhoneScreen onSent={(phone) => setRoute({ name: 'otp', phone })} />;
    }
    switch (route.name) {
      case 'group':
        return <ServiceListScreen groupId={route.id} title={route.title} onOpenService={(id) => setRoute({ name: 'service', id })} />;
      case 'service':
        return (
          <ServiceDetailScreen
            serviceId={route.id}
            onBook={(service, variant) => setRoute({ name: 'book', service: { id: service.id, name: service.name }, variant: variant ? { id: variant.id, name: variant.name } : undefined })}
          />
        );
      case 'book':
        return <BookScreen service={route.service} variant={route.variant} onDone={(id) => setRoute({ name: 'booking', id })} />;
      case 'bookings':
        return <BookingsScreen onOpen={(id) => setRoute({ name: 'booking', id })} />;
      case 'booking':
        return <BookingDetailScreen bookingId={route.id} />;
      case 'addresses':
        return <AddressesScreen />;
      case 'profile':
        return (
          <ProfileScreen
            onLogout={async () => {
              await logout();
              setRoute({ name: 'phone' });
            }}
          />
        );
      default:
        return (
          <HomeScreen
            onOpenGroup={(id, title) => setRoute({ name: 'group', id, title })}
            onOpenCategory={(id, title) => setRoute({ name: 'group', id, title })}
          />
        );
    }
  }, [ready, customer, route, logout]);

  const showTabs = Boolean(customer) && ready && route.name !== 'splash';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style={route.name === 'splash' ? 'light' : 'dark'} />
      {showTabs && route.name !== 'home' && route.name !== 'bookings' && route.name !== 'profile' ? (
        <Pressable onPress={() => setRoute(tab === 'bookings' ? { name: 'bookings' } : tab === 'profile' ? { name: 'profile' } : { name: 'home' })} style={styles.back}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>{screen}</View>
      {showTabs ? (
        <View style={styles.tabs}>
          <Pressable onPress={() => setRoute({ name: 'home' })} style={styles.tab}><Text style={[styles.tabText, tab === 'home' && styles.tabOn]}>Home</Text></Pressable>
          <Pressable onPress={() => setRoute({ name: 'bookings' })} style={styles.tab}><Text style={[styles.tabText, tab === 'bookings' && styles.tabOn]}>Bookings</Text></Pressable>
          <Pressable onPress={() => setRoute({ name: 'addresses' })} style={styles.tab}><Text style={styles.tabText}>Addresses</Text></Pressable>
          <Pressable onPress={() => setRoute({ name: 'profile' })} style={styles.tab}><Text style={[styles.tabText, tab === 'profile' && styles.tabOn]}>Profile</Text></Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#E2E8F0', backgroundColor: colors.surface },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { color: colors.muted, fontWeight: '600' },
  tabOn: { color: colors.primary },
  back: { paddingHorizontal: 16, paddingVertical: 8 },
  backText: { color: colors.primary, fontWeight: '700' },
});
