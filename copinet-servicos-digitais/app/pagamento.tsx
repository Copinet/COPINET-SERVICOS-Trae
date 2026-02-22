import { useMemo, useState } from 'react';
import { Platform, View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { colors } from '../src/theme/colors';
import MicrophoneInput from '../src/components/MicrophoneInput';
import { buildPixPayload } from '../src/services/pix';
import { useTranslation } from 'react-i18next';

export default function PagamentoScreen() {
  const { t } = useTranslation();
  const [valor, setValor] = useState('');
  const pixKey = process.env.EXPO_PUBLIC_PIX_KEY || 'sua-chave@copinet.com.br';
  const payload = useMemo(() => {
    const v = parseFloat(valor.replace(',', '.'));
    return buildPixPayload({ chave: pixKey, nome: 'Copinet', cidade: 'CUBATAO', valor: isNaN(v) ? undefined : v, txid: 'COPINET' });
  }, [valor, pixKey]);
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(payload)}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('pagamento.titulo')}</Text>
      <View style={{ width: '100%', maxWidth: 600, gap: 12 }}>
        <MicrophoneInput value={valor} onChangeText={setValor} placeholder={t('pagamento.valor')} />
        <Text style={styles.subtitle}>{t('pagamento.instrucoes')}</Text>
        <Image source={{ uri: qrUrl }} style={{ width: 300, height: 300, alignSelf: 'center' }} />
        <View style={styles.payloadBox}><Text selectable style={styles.payloadText}>{payload}</Text></View>
        <Pressable style={styles.btn} onPress={() => { if (Platform.OS === 'web') navigator.clipboard?.writeText(payload); }}>
          <Text style={styles.btnText}>{t('pagamento.copiar')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.text, textAlign: 'center' },
  payloadBox: { padding: 12, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 12 },
  payloadText: { fontSize: 12, color: colors.text },
  btn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 20, backgroundColor: colors.accent, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
