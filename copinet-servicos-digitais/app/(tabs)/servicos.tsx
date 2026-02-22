import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors } from '../../src/theme/colors';
import { Link, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { popularItems, uiCategories } from '../../src/data/uiCatalog';
import { useMemo, useState } from 'react';

export default function ServicosScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ cat?: string }>();
  const initialCategory = typeof params.cat === 'string' ? params.cat : 'todos';
  const [selected, setSelected] = useState(initialCategory);
  const formatPrice = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
  const filteredPopulars = useMemo(() => {
    if (selected === 'todos') return popularItems;
    return popularItems.filter((item) => item.categoryId === selected);
  }, [selected]);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.servicos')}</Text>
        <Text style={styles.subtitle}>{t('servicos.subtitulo')}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Pressable style={[styles.chip, selected === 'todos' && styles.chipActive]} onPress={() => setSelected('todos')}>
          <Text style={[styles.chipText, selected === 'todos' && styles.chipTextActive]}>{t('servicos.todos', 'Todos')}</Text>
        </Pressable>
        {uiCategories.map((category) => (
          <Pressable key={category.id} style={[styles.chip, selected === category.id && styles.chipActive]} onPress={() => setSelected(category.id)}>
            <Text style={[styles.chipText, selected === category.id && styles.chipTextActive]}>{category.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('servicos.maisPopulares')}</Text>
        <View style={styles.popularList}>
          {filteredPopulars.map((item) => (
            <Link key={item.id} href={`/servico/${item.serviceId}`} asChild>
              <Pressable style={styles.popularCard}>
                <View style={styles.popularIconWrap}><Text style={styles.popularIcon}>{item.icon}</Text></View>
                <View style={styles.popularInfo}>
                  <View style={styles.popularHeader}>
                    <Text style={styles.popularTitle}>{item.title}</Text>
                    {item.partner ? <Text style={styles.partnerBadge}>Parceiro</Text> : null}
                  </View>
                  <Text style={styles.popularSub}>{item.subtitle}</Text>
                  <View style={styles.popularMeta}>
                    <Text style={styles.popularPrice}>{formatPrice(item.price)}</Text>
                    <Text style={styles.popularEta}>⏱ {item.eta}</Text>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('servicos.todasCategorias')}</Text>
        <View style={styles.categoryList}>
          {uiCategories.map((category) => (
            <Pressable key={category.id} style={styles.categoryCard} onPress={() => setSelected(category.id)}>
              <View style={styles.categoryIconWrap}><Text style={styles.categoryIcon}>{category.icon}</Text></View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryCount}>{t('servicos.servicosCount', { count: category.count })}</Text>
              </View>
              <Text style={styles.categoryArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20, backgroundColor: colors.background },
  header: { gap: 6 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted },
  chipRow: { gap: 10, paddingRight: 16 },
  chip: { backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.gold },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  popularList: { gap: 12 },
  popularCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  popularIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  popularIcon: { fontSize: 18 },
  popularInfo: { flex: 1, gap: 6 },
  popularHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  popularTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  partnerBadge: { backgroundColor: '#E9F1FF', color: '#2B5CD7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, fontSize: 11, fontWeight: '700' },
  popularSub: { fontSize: 13, color: colors.textMuted },
  popularMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  popularPrice: { fontSize: 15, fontWeight: '700', color: colors.gold },
  popularEta: { fontSize: 12, color: colors.textMuted },
  categoryList: { gap: 12 },
  categoryCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  categoryIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  categoryIcon: { fontSize: 18 },
  categoryInfo: { flex: 1, gap: 4 },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  categoryCount: { fontSize: 13, color: colors.textMuted },
  categoryArrow: { fontSize: 24, color: colors.textMuted }
});
