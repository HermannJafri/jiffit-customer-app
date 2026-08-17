import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export const colors = {
  primary: '#7C3AED',
  dark: '#6B21A8',
  background: '#F6F7FB',
  text: '#0F172A',
};

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.brand}>JIFFIT</Text>
      <Text style={styles.title}>Customer app scaffold</Text>
      <Text style={styles.body}>
        OTP, catalog, slots, Zoho checkout, and live hero tracking will be rebuilt in Expo from the
        Flutter app specification.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  brand: { color: '#fff', letterSpacing: 4, fontWeight: '700', marginBottom: 12 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center' },
  body: { color: '#EDE9FE', marginTop: 16, textAlign: 'center', lineHeight: 22 },
});
