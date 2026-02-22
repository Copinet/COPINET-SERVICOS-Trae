import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        tabBarHideOnKeyboard: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          borderRadius: 20,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 6 }
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.inicio') }} />
      <Tabs.Screen name="servicos" options={{ title: t('tabs.servicos') }} />
      <Tabs.Screen name="pedidos" options={{ title: t('tabs.pedidos') }} />
      <Tabs.Screen name="perfil" options={{ title: t('tabs.perfil') }} />
    </Tabs>
  );
}
