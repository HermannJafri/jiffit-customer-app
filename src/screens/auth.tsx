import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../auth';

export function SplashScreen({ onReady }: { onReady: (authed: boolean) => void }) {
  const { ready, customer } = useAuth();
  useEffect(() => {
    if (ready) onReady(Boolean(customer));
  }, [ready, customer, onReady]);
  return (
    <View style={styles.splash}>
      <Text style={styles.brand}>JIFFIT</Text>
      <ActivityIndicator color="#fff" />
    </View>
  );
}

export function PhoneScreen({ onSent }: { onSent: (phone: string) => void }) {
  const { sendOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.muted}>Enter your mobile number to continue.</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="10-digit mobile"
        style={styles.input}
        maxLength={13}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await sendOtp(phone);
            onSent(phone);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not send OTP');
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
      >
        <Text style={styles.buttonText}>{busy ? 'Sending…' : 'Send OTP'}</Text>
      </Pressable>
    </View>
  );
}

export function OtpScreen({ phone, onDone }: { phone: string; onDone: () => void }) {
  const { login } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.muted}>Sent to {phone}</Text>
      <TextInput value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} style={styles.input} placeholder="6-digit OTP" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={styles.button}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await login(phone, otp);
            onDone();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid OTP');
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.buttonText}>{busy ? 'Verifying…' : 'Verify'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#fff', letterSpacing: 6, fontWeight: '800', fontSize: 28, marginBottom: 24 },
  page: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, marginVertical: 12 },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
  button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, marginTop: 20, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: colors.danger, marginTop: 8 },
});
