import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { serviceDirectory } from '../../src/data/serviceDirectory';
import { applySozinhoDiscount } from '../../src/services/serviceRules';
import { popularItems } from '../../src/data/uiCatalog';

const findService = (id: string) => {
  for (const group of Object.values(serviceDirectory)) {
    const found = group.subServices.find((service) => service.id === id);
    if (found) return found;
  }
  return null;
};

export default function ServicoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const service = id ? findService(id) : null;
  const fallback = popularItems.find((item) => item.serviceId === id);
  const title = service?.title || fallback?.title || 'Serviço';
  const subtitle = fallback?.subtitle || 'Detalhes do serviço';
  const basePrice = service?.price ?? fallback?.price;
  const sozinhoPrice = basePrice ? applySozinhoDiscount(basePrice, 'sozinho') : undefined;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {basePrice !== undefined ? (
          <View style={styles.priceRow}>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Base</Text>
              <Text style={styles.priceValue}>R$ {basePrice.toFixed(2).replace('.', ',')}</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Sozinho</Text>
              <Text style={styles.priceValue}>R$ {sozinhoPrice?.toFixed(2).replace('.', ',')}</Text>
            </View>
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Link href={`/pagamento?service=${id}&flow=sozinho`} asChild>
          <Pressable style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Cliente faz sozinho</Text>
          </Pressable>
        </Link>
        <Link href={`/pagamento?service=${id}&flow=fazemos`} asChild>
          <Pressable style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Fazemos pra você</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 10, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted },
  priceRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  priceBlock: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 12, gap: 4 },
  priceLabel: { fontSize: 12, color: colors.textMuted },
  priceValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  actions: { gap: 12 },
  primaryBtn: { backgroundColor: colors.gold, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontSize: 16, fontWeight: '700' }
});
