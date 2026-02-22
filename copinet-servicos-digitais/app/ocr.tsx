import { useState } from 'react';
import { Platform, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../src/theme/colors';

export default function OcrScreen() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>OCR de RG/CNH</Text>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setLoading(true);
            const Tesseract = await import('tesseract.js');
            const worker: any = await (Tesseract as any).createWorker();
            if (worker.loadLanguage && worker.initialize) {
              await worker.loadLanguage('por');
              await worker.initialize('por');
            } else if (worker.reinitialize) {
              await worker.reinitialize('por');
            }
            const { data } = await worker.recognize(file);
            setText(data.text || '');
            if (worker.terminate) {
              await worker.terminate();
            }
            setLoading(false);
          }}
        />
        {loading && <ActivityIndicator />}
        {text && <Text style={styles.result}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OCR de RG/CNH</Text>
      <Text style={styles.subtitle}>Disponível em breve no aplicativo móvel</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: 16, color: colors.text },
  result: { fontSize: 14, color: colors.text }
});
