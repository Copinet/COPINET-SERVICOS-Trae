import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { colors } from '../src/theme/colors';
import MicrophoneInput from '../src/components/MicrophoneInput';
import { supabase } from '../src/lib/supabase';
import { useTranslation } from 'react-i18next';

export default function FazemosScreen() {
  const { t } = useTranslation();
  const [descricao, setDescricao] = useState('');
  const [nome, setNome] = useState('');

  const criar = async () => {
    if (!supabase) {
      Alert.alert(t('fazemos.configurarSupabase'));
      return;
    }
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user?.id ?? null;
    const { error } = await supabase.from('pedidos').insert([{ descricao, nome, uid, status: 'novo' }]);
    if (error) Alert.alert(error.message);
    else {
      setDescricao('');
      setNome('');
      Alert.alert(t('fazemos.criado'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('fazemos.titulo')}</Text>
      <View style={{ width: '100%', maxWidth: 600, gap: 12 }}>
        <MicrophoneInput value={nome} onChangeText={setNome} placeholder={t('fazemos.nome')} />
        <MicrophoneInput value={descricao} onChangeText={setDescricao} placeholder={t('fazemos.descreva')} />
        <Pressable onPress={criar} style={styles.btn}><Text style={styles.btnText}>{t('fazemos.solicitar')}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  btn: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 20, backgroundColor: colors.accent, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
