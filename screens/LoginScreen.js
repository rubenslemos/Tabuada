import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';
import { COLORS, FONTS } from '../src/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const token = response.data.token;
      const user = response.data.user || {};
      const userId = user._id || user.id || null;
      const totalAcertos = response.data.totalAcertos || 0;
      const totalJogos = response.data.totalJogos || 0;
      const totalErros = response.data.totalErros || 0;

      if (token) {
        await AsyncStorage.setItem('token', token);
        if (userId) await AsyncStorage.setItem('userId', String(userId));
        if (user && (user.name || user._id)) await AsyncStorage.setItem('userName', user.name || user._id);
        await AsyncStorage.setItem('totalAcertos', String(totalAcertos));
        await AsyncStorage.setItem('totalJogos', String(totalJogos));
        await AsyncStorage.setItem('totalErros', String(totalErros));

        // set default Authorization header for future axios calls
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        Alert.alert('Sucesso', 'Login realizado com sucesso!');
        navigation.navigate('Tabuada');
      } else {
        Alert.alert('Erro', 'Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Login error:', error?.response?.data || error.message);
      Alert.alert('Erro', 'Falha no login');
    }
  };

  return (
    <ImageBackground source={require('../assets/images/math2.jpg')} style={styles.bg} resizeMode="cover">
      <View style={styles.panel}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Esqueceu a senha?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Registrar</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  panel: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 520,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginTop: 80,
    marginBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 12,
    // give subtle shadow on Android/iOS
    elevation: 3,
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: FONTS.title,
    color: COLORS.primaryDarker,
  },
  input: {
    height: 46,
    borderColor: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.95)'
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: FONTS.body,
    marginTop: 6
  },
});

export default LoginScreen;