import React, { useState } from 'react';
import { ImageBackground, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { COLORS, FONTS } from '../src/theme';

const RegisterScreen = ({ navigation }) => {
  const [tipo, setTipo] = useState('Aluno');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [turma, setTurma] = useState('A1');

  const handleRegister = async () => {
    try {
      const payload = { tipo, name, email, password, confirmPassword, turma };
      await axios.post(`${API_BASE_URL}/auth/register`, payload);
      Alert.alert('Sucesso', 'Registro realizado com sucesso!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Register error:', error?.response?.data || error.message);
      const msg = error?.response?.data?.Msg || error?.response?.data?.error || 'Falha no registro';
      Alert.alert('Erro', String(msg));
    }
  };

  return (
    <ImageBackground source={require('../assets/images/math2.jpg')} style={styles.bg} resizeMode="cover">
      <View style={styles.panel}>
        <Text style={styles.title}>Registrar</Text>

        <TextInput
          style={styles.input}
          placeholder="Tipo (Aluno/Professor/Coordenador)"
          value={tipo}
          onChangeText={setTipo}
        />
        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirme a senha"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Turma (ex: A1)"
          value={turma}
          onChangeText={setTurma}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Voltar ao Login</Text>
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
    marginTop: 60,
    marginBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 24,
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    fontFamily: FONTS.body,
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
    marginTop: 6,
  },
});

export default RegisterScreen;