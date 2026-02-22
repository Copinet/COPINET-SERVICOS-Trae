import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import { colors } from '../src/theme/colors';
import { useLocalSearchParams } from 'expo-router';
import { stores } from '../src/data/uiCatalog';

type Message = {
  id: string;
  author: 'cliente' | 'loja';
  text: string;
  time: string;
};

export default function ChatScreen() {
  const params = useLocalSearchParams<{ store?: string }>();
  const store = useMemo(() => stores.find((item) => item.id === params.store) ?? stores[0], [params.store]);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', author: 'loja', text: 'Olá, como podemos ajudar?', time: 'Agora' }
  ]);

  const send = () => {
    if (!text.trim()) return;
    const newMsg: Message = { id: `m${Date.now()}`, author: 'cliente', text: text.trim(), time: 'Agora' };
    setMessages((prev) => [newMsg, ...prev]);
    setText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{store?.name ?? 'Copinet'}</Text>
      <Text style={styles.subtitle}>{store?.support.supportHours}</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.author === 'cliente' ? styles.bubbleClient : styles.bubbleStore]}>
            <Text style={[styles.bubbleText, item.author === 'cliente' && styles.bubbleTextClient]}>{item.text}</Text>
            <Text style={[styles.time, item.author === 'cliente' && styles.timeClient]}>{item.time}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
        />
        <Pressable style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>Enviar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted },
  list: { gap: 10, paddingVertical: 10 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, gap: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  bubbleStore: { backgroundColor: colors.surface, alignSelf: 'flex-start' },
  bubbleClient: { backgroundColor: colors.gold, alignSelf: 'flex-end' },
  bubbleText: { color: colors.text, fontSize: 14 },
  bubbleTextClient: { color: '#fff' },
  time: { fontSize: 11, color: colors.textMuted },
  timeClient: { color: '#fff' },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text },
  sendBtn: { backgroundColor: colors.gold, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  sendText: { color: '#fff', fontWeight: '700' }
});
