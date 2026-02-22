import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Linking, Alert, ActionSheetIOS, Modal } from 'react-native';
import { colors } from '../../src/theme/colors';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { stores, uiCategories } from '../../src/data/uiCatalog';
import { useState } from 'react';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [supportVisible, setSupportVisible] = useState(false);

  const openSupport = () => {
    setSupportVisible(true);
  };

  const openWhatsApp = (number: string) => {
    Linking.openURL(`https://wa.me/${number}`);
  };

  const openChat = (storeId: string) => {
    setSupportVisible(false);
    router.push(`/chat?store=${storeId}`);
  };

  const openMapOptions = (address: string) => {
    const encoded = encodeURIComponent(address);
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    const wazeUrl = `https://waze.com/ul?q=${encoded}`;
    const uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encoded}`;
    const options = ['Google Maps', 'Waze', 'Uber', t('comum.cancelar')];
    const handlers = [
      () => Linking.openURL(googleUrl),
      () => Linking.openURL(wazeUrl),
      () => Linking.openURL(uberUrl),
      () => {}
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3, title: t('home.abrirMapa') },
        (index) => handlers[index]?.()
      );
      return;
    }
    Alert.alert(t('home.abrirMapa'), '', [
      { text: 'Google Maps', onPress: handlers[0] },
      { text: 'Waze', onPress: handlers[1] },
      { text: 'Uber', onPress: handlers[2] },
      { text: t('comum.cancelar'), style: 'cancel' }
    ]);
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Pressable style={styles.supportBtn} onPress={openSupport}>
            <Text style={styles.supportIcon}>💬</Text>
          </Pressable>
          <Text style={styles.heroSmall}>{t('home.bemVindo')}</Text>
          <Text style={styles.heroBrand}>Copinet</Text>
          <Text style={styles.heroTitle}>{t('home.servicosDigitais')}</Text>
          <Text style={styles.heroSubtitle}>{t('home.subtitulo')}</Text>
        </View>
        <Link href="/impressao-rapida" asChild>
          <Pressable style={styles.primaryCard}>
            <View style={styles.primaryIcon}>
              <Text style={styles.primaryIconText}>🖨️</Text>
            </View>
            <View style={styles.primaryInfo}>
              <Text style={styles.primaryTitle} numberOfLines={2}>{t('home.impressaoRapida')}</Text>
              <Text style={styles.primarySub}>{t('home.impressaoRapidaSub')}</Text>
            </View>
            <Text style={styles.primaryArrow}>›</Text>
          </Pressable>
        </Link>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.acessoRapido')}</Text>
          <View style={styles.quickGrid}>
            <Link href="/ocr" asChild>
              <Pressable style={styles.quickCard}>
                <View style={styles.quickIconWrap}><Text style={styles.quickIcon}>📷</Text></View>
                <Text style={styles.quickText}>{t('home.escanearDocumento')}</Text>
              </Pressable>
            </Link>
            <Pressable style={styles.quickCard} onPress={() => openMapOptions(stores[0]?.address || 'Cubatão - SP')}>
              <View style={styles.quickIconWrap}><Text style={styles.quickIcon}>📍</Text></View>
              <Text style={styles.quickText}>{t('home.encontrarLoja')}</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={openSupport}>
              <View style={styles.quickIconWrap}><Text style={styles.quickIcon}>💬</Text></View>
              <Text style={styles.quickText}>{t('home.falarSuporte')}</Text>
            </Pressable>
            <Link href="/fazemos" asChild>
              <Pressable style={styles.quickCard}>
                <View style={styles.quickIconWrap}><Text style={styles.quickIcon}>🖐️</Text></View>
                <Text style={styles.quickText}>{t('home.fazemosPraVoce')}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.categorias')}</Text>
          <View style={styles.categoryList}>
            {uiCategories.map((category) => (
              <Link key={category.id} href={`/servicos?cat=${category.id}`} asChild>
                <Pressable style={styles.categoryCard}>
                  <View style={styles.categoryIconWrap}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categorySub}>{category.subtitle}</Text>
                  </View>
                  <Text style={styles.categoryArrow}>›</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.nossasLojas')}</Text>
          <View style={styles.storeList}>
            {stores.map((store) => (
              <Pressable key={store.id} style={styles.storeCard} onPress={() => openMapOptions(store.address)}>
                <View style={styles.storeIconWrap}><Text style={styles.storeIcon}>🏬</Text></View>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeTitle}>{store.name}</Text>
                  <Text style={styles.storeSub}>{store.address}</Text>
                  <Text style={styles.storeHours}>{store.hours}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <Modal transparent visible={supportVisible} animationType="fade" onRequestClose={() => setSupportVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('home.suporteTitulo')}</Text>
            <Text style={styles.modalSubtitle}>{t('home.suporteDescricao')}</Text>
            <View style={styles.modalList}>
              {stores.map((store) => (
                <View key={store.id} style={styles.supportCard}>
                  <View style={styles.supportInfo}>
                    <Text style={styles.supportName}>{store.name}</Text>
                    <Text style={styles.supportHours}>{store.support.supportHours}</Text>
                  </View>
                  <View style={styles.supportActions}>
                    {store.support.whatsappEnabled && (
                      <Pressable style={styles.supportBtnPrimary} onPress={() => openWhatsApp(store.support.whatsapp)}>
                        <Text style={styles.supportBtnText}>{t('home.whatsapp')}</Text>
                      </Pressable>
                    )}
                    {store.support.chatEnabled && (
                      <Pressable style={styles.supportBtnSecondary} onPress={() => openChat(store.id)}>
                        <Text style={styles.supportBtnTextDark}>{t('home.chatApp')}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
            </View>
            <Pressable style={styles.modalClose} onPress={() => setSupportVisible(false)}>
              <Text style={styles.modalCloseText}>{t('comum.cancelar')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20, backgroundColor: colors.background },
  heroCard: { backgroundColor: colors.cardDark, borderRadius: 22, padding: 20, gap: 6, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  supportBtn: { position: 'absolute', right: 16, top: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B3A4A', alignItems: 'center', justifyContent: 'center' },
  supportIcon: { color: '#fff', fontSize: 18 },
  heroSmall: { color: '#B7B4C1', fontSize: 14 },
  heroBrand: { color: colors.gold, fontSize: 30, fontWeight: '700' },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '600' },
  heroSubtitle: { color: '#B7B4C1', fontSize: 14 },
  primaryCard: { backgroundColor: colors.gold, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  primaryIcon: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  primaryIconText: { fontSize: 22 },
  primaryInfo: { flex: 1, gap: 4, minWidth: 0 },
  primaryTitle: { color: '#fff', fontSize: 18, fontWeight: '700', flexShrink: 1 },
  primarySub: { color: '#fff', opacity: 0.9, fontSize: 13 },
  primaryArrow: { color: '#fff', fontSize: 26, fontWeight: '700' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: '48%', backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  quickIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  quickIcon: { fontSize: 20 },
  quickText: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center' },
  categoryList: { gap: 12 },
  categoryCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  categoryIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  categoryIcon: { fontSize: 18 },
  categoryInfo: { flex: 1, gap: 4 },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  categorySub: { fontSize: 13, color: colors.textMuted },
  categoryArrow: { fontSize: 24, color: colors.textMuted },
  storeList: { gap: 12 },
  storeCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  storeIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  storeIcon: { fontSize: 18 },
  storeInfo: { flex: 1, gap: 4 },
  storeTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  storeSub: { fontSize: 13, color: colors.textMuted },
  storeHours: { fontSize: 12, color: colors.gold, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 520, backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSubtitle: { fontSize: 14, color: colors.textMuted },
  modalList: { gap: 12 },
  supportCard: { backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 14, gap: 10 },
  supportInfo: { gap: 4 },
  supportName: { fontSize: 16, fontWeight: '700', color: colors.text },
  supportHours: { fontSize: 12, color: colors.textMuted },
  supportActions: { flexDirection: 'row', gap: 10 },
  supportBtnPrimary: { backgroundColor: colors.gold, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  supportBtnSecondary: { backgroundColor: colors.background, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  supportBtnText: { color: '#fff', fontWeight: '700' },
  supportBtnTextDark: { color: colors.text, fontWeight: '700' },
  modalClose: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12 },
  modalCloseText: { color: colors.textMuted, fontWeight: '700' }
});
