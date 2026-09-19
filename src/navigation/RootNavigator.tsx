import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ComponentListScreen from '../screens/ComponentListScreen';
import ComponentDetailScreen from '../screens/ComponentDetailScreen';
import ComponentFormScreen from '../screens/ComponentFormScreen';
import ResistorScannerScreen from '../screens/ResistorScannerScreen';
import SmdCodeCalculatorScreen from '../screens/SmdCodeCalculatorScreen';
import SmdCodeScannerScreen from '../screens/SmdCodeScannerScreen';
import CapacitorCodeCalculatorScreen from '../screens/CapacitorCodeCalculatorScreen';
import PackageReferenceScreen from '../screens/PackageReferenceScreen';

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="ComponentList">
      <Stack.Screen
        name="ComponentList"
        component={ComponentListScreen}
        options={{ title: 'Součástky' }}
      />
      <Stack.Screen
        name="ComponentDetail"
        component={ComponentDetailScreen}
        options={{ title: 'Detail součástky' }}
      />
      <Stack.Screen
        name="ComponentForm"
        component={ComponentFormScreen}
        options={({ route }) => ({
          title: route.params?.id ? 'Upravit součástku' : 'Nová součástka',
        })}
      />
      <Stack.Screen
        name="ResistorScanner"
        component={ResistorScannerScreen}
        options={{ title: 'Sken rezistoru' }}
      />
      <Stack.Screen
        name="SmdCodeCalculator"
        component={SmdCodeCalculatorScreen}
        options={{ title: 'SMD kód rezistoru' }}
      />
      <Stack.Screen
        name="SmdCodeScanner"
        component={SmdCodeScannerScreen}
        options={{ title: 'Sken SMD kódu' }}
      />
      <Stack.Screen
        name="CapacitorCodeCalculator"
        component={CapacitorCodeCalculatorScreen}
        options={{ title: 'Kód kondenzátoru' }}
      />
      <Stack.Screen
        name="PackageReference"
        component={PackageReferenceScreen}
        options={{ title: 'Pouzdra IC' }}
      />
    </Stack.Navigator>
  );
}
