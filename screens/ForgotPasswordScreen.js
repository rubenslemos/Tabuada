import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native'
import apiClient from '../config/apiClient'
import { getErrorMessage } from '../utils/errorMessage'
import { COLORS, FONTS } from '../src/theme'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('')

  const handleSend = async () => {
    try {
      const response = await apiClient.post('/auth/login/forgot_password', {
        email,
      })
      const token = response?.data?.token

      Alert.alert('Enviado', 'Token gerado com sucesso. Continue para alterar a senha.')
      navigation.navigate('ResetPassword', { email: email.toLowerCase().trim(), token })
    } catch (err) {
      console.error(
        'Forgot password error:',
        err?.response?.data || err.message
      )
      Alert.alert(
        'Erro',
        getErrorMessage(err, 'Não foi possível enviar instruções.')
      )
    }
  }

  return (
    <ClassroomBackground stripeTop={120}>
      <ChalkPanel style={styles.panel} boardStyle={styles.panelBoard}>
        <View style={styles.flagsRow}>
          <Text style={styles.flag}>▲</Text>
          <Text style={styles.flag}>●</Text>
          <Text style={styles.flag}>■</Text>
          <Text style={styles.flag}>●</Text>
          <Text style={styles.flag}>▲</Text>
        </View>
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
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Voltar ao Login</Text>
        </TouchableOpacity>
        <View style={styles.footerDecor}>
          <Image source={require('../assets/images/estrela.png')} style={styles.footerIcon} />
          <Image source={require('../assets/images/check2.png')} style={styles.footerIcon} />
          <Image source={require('../assets/images/calculadora.png')} style={styles.footerIcon} />
        </View>
      </ChalkPanel>
    </ClassroomBackground>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  panel: {
    alignSelf: 'center',
    width: '96%',
    maxWidth: 720,
    marginTop: 62,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  panelBoard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 300,
  },
  flagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '92%',
    alignSelf: 'center',
    opacity: 0.45,
    marginBottom: 4,
  },
  flag: { color: COLORS.chalkText, fontSize: 12 },
  title: {
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: FONTS.title,
    color: COLORS.chalkText,
  },
  input: {
    height: 46,
    borderColor: COLORS.chalkBorder,
    borderWidth: 2,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: COLORS.chalkText,
  },
  button: {
    backgroundColor: '#68bd62',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  buttonText: { color: 'white', fontFamily: FONTS.body },
  link: {
    color: COLORS.chalkText,
    textAlign: 'center',
    fontFamily: FONTS.body,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  footerDecor: {
    marginTop: 12,
    width: '90%',
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: 'rgba(120,72,32,0.5)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'center',
  },
  footerIcon: { width: 22, height: 22, resizeMode: 'contain' },
})
