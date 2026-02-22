import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

export default function MicrophoneInput({ value, onChangeText, placeholder }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const rec = new SR();
        rec.lang = 'pt-BR';
        rec.continuous = false;
        rec.interimResults = false;
        rec.onresult = (e: any) => {
          const transcript = e.results?.[0]?.[0]?.transcript || '';
          onChangeText(value ? `${value} ${transcript}`.trim() : transcript);
          setListening(false);
        };
        rec.onend = () => setListening(false);
        recognitionRef.current = rec;
      }
    }
  }, [onChangeText, value]);

  const startListening = () => {
    if (Platform.OS === 'web' && recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
      <Pressable style={[styles.mic, listening && { opacity: 0.7 }]} onPress={startListening} disabled={Platform.OS !== 'web'}>
        <Text style={styles.micText}>🎤</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, paddingVertical: 16, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface, fontSize: 18, color: colors.text },
  mic: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mic },
  micText: { color: '#fff', fontSize: 22, fontWeight: '700' }
});
