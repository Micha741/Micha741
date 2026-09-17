import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ComponentListScreen from '../screens/ComponentListScreen';
import ComponentDetailScreen from '../screens/ComponentDetailScreen';
import ComponentFormScreen from '../screens/ComponentFormScreen';

export type RootStackParamList = {
  ComponentList: undefined;
  ComponentDetail: { id: number };
  ComponentForm: { id?: number };
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
    </Stack.Navigator>
  );
}
