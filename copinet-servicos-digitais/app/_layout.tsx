import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { colors } from '../src/theme/colors';
import '../src/i18n/i18n';

export default function RootLayout() {
  useFonts({});
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Slot />
    </View>
  );
}
