import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ComponentListScreen from '../screens/ComponentListScreen';
import ComponentDetailScreen from '../screens/ComponentDetailScreen';
import ComponentFormScreen from '../screens/ComponentFormScreen';
import ResistorScannerScreen from '../screens/ResistorScannerScreen';
import SmdCodeCalculatorScreen from '../screens/SmdCodeCalculatorScreen';
import SmdCodeScannerScreen from '../screens/SmdCodeScannerScreen';
import CapacitorCodeCalculatorScreen from '../screens/CapacitorCodeCalculatorScreen';
import PackageReferenceScreen from '../screens/PackageReferenceScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useI18n } from '../i18n/I18nContext';

export interface ComponentFormPrefill {
  name?: string;
  category?: string;
  manufacturer?: string;
  packageType?: string;
  value?: string;
  tags?: string;
  notes?: string;
}

export type RootStackParamList = {
  ComponentList: undefined;
  ComponentDetail: { id: number };
  ComponentForm: { id?: number; prefill?: ComponentFormPrefill };
  ResistorScanner: undefined;
  SmdCodeCalculator: undefined;
  SmdCodeScanner: undefined;
  CapacitorCodeCalculator: undefined;
  PackageReference: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { t } = useI18n();

  return (
    <Stack.Navigator initialRouteName="ComponentList">
      <Stack.Screen
        name="ComponentList"
        component={ComponentListScreen}
        options={{ title: t('nav.componentList') }}
      />
      <Stack.Screen
        name="ComponentDetail"
        component={ComponentDetailScreen}
        options={{ title: t('nav.componentDetail') }}
      />
      <Stack.Screen
        name="ComponentForm"
        component={ComponentFormScreen}
        options={({ route }) => ({
          title: route.params?.id ? t('nav.componentFormEdit') : t('nav.componentFormNew'),
        })}
      />
      <Stack.Screen
        name="ResistorScanner"
        component={ResistorScannerScreen}
        options={{ title: t('nav.resistorScanner') }}
      />
      <Stack.Screen
        name="SmdCodeCalculator"
        component={SmdCodeCalculatorScreen}
        options={{ title: t('nav.smdCodeCalculator') }}
      />
      <Stack.Screen
        name="SmdCodeScanner"
        component={SmdCodeScannerScreen}
        options={{ title: t('nav.smdCodeScanner') }}
      />
      <Stack.Screen
        name="CapacitorCodeCalculator"
        component={CapacitorCodeCalculatorScreen}
        options={{ title: t('nav.capacitorCodeCalculator') }}
      />
      <Stack.Screen
        name="PackageReference"
        component={PackageReferenceScreen}
        options={{ title: t('nav.packageReference') }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('nav.settings') }}
      />
    </Stack.Navigator>
  );
}
