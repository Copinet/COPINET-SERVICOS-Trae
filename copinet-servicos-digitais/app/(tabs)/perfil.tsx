import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Linking, Modal } from 'react-native';
import { colors } from '../../src/theme/colors';
import { useTranslation } from 'react-i18next';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { stores } from '../../src/data/uiCatalog';

export default function PerfilScreen() {
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
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('perfil.titulo')}</Text>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.label}>{t('perfil.nomeCompleto')}</Text>
          <TextInput style={styles.input} placeholder="Seu nome completo" placeholderTextColor={colors.textMuted} />
          <Text style={styles.label}>{t('perfil.telefone')}</Text>
          <TextInput style={styles.input} placeholder="(13) 99999-0000" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
          <Text style={styles.label}>{t('perfil.email')}</Text>
          <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" />
          <Text style={styles.label}>{t('perfil.cpf')}</Text>
          <TextInput style={styles.input} placeholder="000.000.000-00" placeholderTextColor={colors.textMuted} keyboardType="numeric" />
          <Pressable style={styles.saveBtn}>
            <Text style={styles.saveText}>{t('perfil.salvar')}</Text>
          </Pressable>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('perfil.documentosEscaneados')}</Text>
            <Text style={styles.sectionAction}>＋</Text>
          </View>
          <View style={styles.scanCard}>
            <Text style={styles.scanIcon}>📄</Text>
            <Text style={styles.scanText}>{t('perfil.nenhumDocumento')}</Text>
            <Link href="/ocr" asChild>
              <Pressable style={styles.scanBtn}>
                <Text style={styles.scanBtnText}>{t('perfil.escanearDocumento')}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('perfil.maisOpcoes')}</Text>
          <Link href="/mapa" asChild>
            <Pressable style={styles.optionCard}>
              <Text style={styles.optionIcon}>📍</Text>
              <Text style={styles.optionText}>{t('perfil.nossasLojas')}</Text>
              <Text style={styles.optionArrow}>›</Text>
            </Pressable>
          </Link>
        <Link href="/admin/suporte" asChild>
          <Pressable style={styles.optionCard}>
            <Text style={styles.optionIcon}>🛠️</Text>
            <Text style={styles.optionText}>{t('perfil.painelAdm')}</Text>
            <Text style={styles.optionArrow}>›</Text>
          </Pressable>
        </Link>
          <Pressable style={styles.optionCard} onPress={openSupport}>
            <Text style={styles.optionIcon}>💬</Text>
            <Text style={styles.optionText}>{t('perfil.suporte')}</Text>
            <Text style={styles.optionArrow}>›</Text>
          </Pressable>
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
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 12, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  avatar: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  avatarIcon: { fontSize: 26 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: { backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
  saveBtn: { backgroundColor: colors.gold, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionAction: { fontSize: 22, color: colors.gold, fontWeight: '700' },
  scanCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  scanIcon: { fontSize: 28 },
  scanText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  scanBtn: { backgroundColor: colors.gold, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10 },
  scanBtnText: { color: '#fff', fontWeight: '700' },
  optionCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  optionIcon: { fontSize: 18 },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  optionArrow: { fontSize: 22, color: colors.textMuted },
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
