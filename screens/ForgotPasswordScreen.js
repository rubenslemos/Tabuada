import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground } from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { COLORS, FONTS } from '../src/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleSend = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/login/forgot_password`, { email });
      Alert.alert('Enviado', 'Se o e-mail existir, instruções foram enviadas.');
      navigation.navigate('Login');
      // optionally show message or token in dev env
      // console.log('Forgot password request sent for', email);
    } catch (err) {
      console.error('Forgot password error:', err?.response?.data || err.message);
      Alert.alert('Erro', 'Não foi possível enviar instruções.');
    }
  };

  return (
    <ImageBackground source={require('../assets/images/math2.jpg')} style={styles.bg} resizeMode="cover">
      <View style={styles.panel}>
        <Text style={styles.title}>Recuperar Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleSend}>
          <Text style={styles.buttonText}>Enviar instruções</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

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
    elevation: 3,
  },
  title: { fontSize: 22, marginBottom: 12, textAlign: 'center', fontFamily: FONTS.title, color: COLORS.primaryDarker },
  input: { height: 46, borderColor: 'rgba(0,0,0,0.12)', borderWidth: 1, marginBottom: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.95)' },
  button: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center', marginTop: 8, borderRadius: 8 },
  buttonText: { color: 'white', fontFamily: FONTS.body }
});