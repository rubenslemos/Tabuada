import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useFonts as useDynaPuff, DynaPuff_400Regular } from '@expo-google-fonts/dynapuff';
import { useFonts as useExpletus, ExpletusSans_400Regular } from '@expo-google-fonts/expletus-sans';

// Importar telas
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TabuadaScreen from './screens/TabuadaScreen';
import PerformanceScreen from './screens/PerformanceScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import PermissoesScreen from './screens/PermissoesScreen';

const Stack = createStackNavigator();

export default function App() {
  const [dynaLoaded] = useDynaPuff({ DynaPuff_400Regular });
  const [expLoaded] = useExpletus({ ExpletusSans_400Regular });
  if (!dynaLoaded || !expLoaded) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Tabuada" component={TabuadaScreen} />
        <Stack.Screen name="Performance" component={PerformanceScreen} />
        <Stack.Screen name="Permissoes" component={PermissoesScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
