import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Switch } from 'react-native';
import { colors } from '../../src/theme/colors';
import { stores as baseStores } from '../../src/data/uiCatalog';

type StoreState = typeof baseStores;

export default function SuporteAdminScreen() {
  const [stores, setStores] = useState<StoreState>(baseStores);

  const updateStore = (id: string, changes: Partial<StoreState[number]>) => {
    setStores((prev) => prev.map((store) => (store.id === id ? { ...store, ...changes } : store)));
  };

  const updateSupport = (id: string, changes: Partial<StoreState[number]['support']>) => {
    setStores((prev) =>
      prev.map((store) => (store.id === id ? { ...store, support: { ...store.support, ...changes } } : store))
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Painel ADM · Suporte</Text>
      <Text style={styles.subtitle}>Configure lojas, horários e canais de atendimento</Text>
      <View style={styles.list}>
        {stores.map((store) => (
          <View key={store.id} style={styles.card}>
            <Text style={styles.cardTitle}>{store.name}</Text>
            <Text style={styles.label}>Nome da loja</Text>
            <TextInput
              style={styles.input}
              value={store.name}
              onChangeText={(value) => updateStore(store.id, { name: value })}
              placeholder="Nome"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Endereço</Text>
            <TextInput
              style={styles.input}
              value={store.address}
              onChangeText={(value) => updateStore(store.id, { address: value })}
              placeholder="Endereço"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Funcionamento</Text>
            <TextInput
              style={styles.input}
              value={store.hours}
              onChangeText={(value) => updateStore(store.id, { hours: value })}
              placeholder="Horário"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>Horário de suporte</Text>
            <TextInput
              style={styles.input}
              value={store.support.supportHours}
              onChangeText={(value) => updateSupport(store.id, { supportHours: value })}
              placeholder="Horário de suporte"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.label}>WhatsApp</Text>
            <TextInput
              style={styles.input}
              value={store.support.whatsapp}
              onChangeText={(value) => updateSupport(store.id, { whatsapp: value })}
              placeholder="5513999990000"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleText}>WhatsApp online</Text>
              <Switch
                value={store.support.whatsappEnabled}
                onValueChange={(value) => updateSupport(store.id, { whatsappEnabled: value })}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleText}>Chat no app online</Text>
              <Switch
                value={store.support.chatEnabled}
                onValueChange={(value) => updateSupport(store.id, { chatEnabled: value })}
              />
            </View>
            <Pressable style={styles.saveBtn}>
              <Text style={styles.saveText}>Salvar</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted },
  list: { gap: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: { backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleText: { fontSize: 14, color: colors.text },
  saveBtn: { backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontWeight: '700' }
});
