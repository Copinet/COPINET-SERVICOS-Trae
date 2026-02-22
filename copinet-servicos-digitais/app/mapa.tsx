import { Platform, View, Text, StyleSheet } from 'react-native';
import { colors } from '../src/theme/colors';
import { useTranslation } from 'react-i18next';

export default function MapaScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('mapa.titulo')}</Text>
      {Platform.OS === 'web' ? (
        <iframe
          title="Mapa Copinet"
          width="100%"
          height="400"
          style={{ border: 0, borderRadius: 12 }}
          loading="lazy"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3678.48003044605!2d-46.427!3d-23.511!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce1c8e4b0b5cfd%3A0x0!2sCubat%C3%A3o%2C%20SP!5e0!3m2!1spt-BR!2sbr!4v1710000000000"
        />
      ) : (
        <Text style={styles.subtitle}>{t('mapa.descricao')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background, gap: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.text, textAlign: 'center' }
});
