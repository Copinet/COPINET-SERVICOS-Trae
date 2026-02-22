import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { colors } from '../../src/theme/colors';
import { supabase } from '../../src/lib/supabase';
import { useTranslation } from 'react-i18next';

export default function PedidosScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'andamento' | 'concluido'>('todos');

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data) setItems(data);
      setLoading(false);
    };
    fetchData();
    if (!supabase) return;
    const channel = supabase
      .channel('pedidos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchData();
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const filteredItems = items.filter((item) => (filter === 'todos' ? true : item.status === filter));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('pedidos.titulo')}</Text>
        <Text style={styles.count}>{items.length} pedidos</Text>
      </View>
      <View style={styles.filters}>
        <Pressable style={[styles.filterChip, filter === 'todos' && styles.filterActive]} onPress={() => setFilter('todos')}>
          <Text style={[styles.filterText, filter === 'todos' && styles.filterTextActive]}>{t('pedidos.todos')}</Text>
        </Pressable>
        <Pressable style={[styles.filterChip, filter === 'pendente' && styles.filterActive]} onPress={() => setFilter('pendente')}>
          <Text style={[styles.filterText, filter === 'pendente' && styles.filterTextActive]}>{t('pedidos.pendente')}</Text>
        </Pressable>
        <Pressable style={[styles.filterChip, filter === 'andamento' && styles.filterActive]} onPress={() => setFilter('andamento')}>
          <Text style={[styles.filterText, filter === 'andamento' && styles.filterTextActive]}>{t('pedidos.andamento')}</Text>
        </Pressable>
        <Pressable style={[styles.filterChip, filter === 'concluido' && styles.filterActive]} onPress={() => setFilter('concluido')}>
          <Text style={[styles.filterText, filter === 'concluido' && styles.filterTextActive]}>{t('pedidos.concluido')}</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nome || t('comum.ok')}</Text>
              <Text style={styles.cardDesc}>{item.descricao}</Text>
              <Text style={styles.cardStatus}>{item.status}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>{t('pedidos.vazioTitulo')}</Text>
              <Text style={styles.emptySub}>{t('pedidos.vazioSub')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 20 },
  header: { gap: 6, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  count: { fontSize: 14, color: colors.textMuted },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.gold },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  filterTextActive: { color: '#fff' },
  list: { gap: 12, paddingBottom: 20 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 6, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 13, color: colors.textMuted },
  cardStatus: { fontSize: 12, color: colors.gold, fontWeight: '600' },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' }
});
