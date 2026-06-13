import { useState } from 'react'
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native'
import apiClient from '../config/apiClient'
import { getErrorMessage } from '../utils/errorMessage'
import { COLORS, FONTS } from '../src/theme'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'

export default function ResetPasswordScreen({ navigation, route }) {
  const [email, setEmail] = useState(route?.params?.email || '')
  const [token] = useState(route?.params?.token || '')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const handleReset = async () => {
    try {
      await apiClient.post('/auth/login/reset_password', {
        email,
        token,
        password,
        confirmPass,
      })
      Alert.alert('Sucesso', 'Senha alterada com sucesso!')
      navigation.navigate('Login')
    } catch (err) {
      console.error('Reset password error:', err?.response?.data || err.message)
      Alert.alert(
        'Erro',
        getErrorMessage(err, 'Não foi possível alterar a senha.')
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
        <Text style={styles.title}>Alterar Senha</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Nova senha"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirme a nova senha"
            secureTextEntry={!showConfirmPass}
            value={confirmPass}
            onChangeText={setConfirmPass}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPass((prev) => !prev)}
          >
            <Text style={styles.eyeText}>{showConfirmPass ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Salvar nova senha</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Voltar ao Login</Text>
        </TouchableOpacity>
        <View style={styles.footerDecor}>
          <Image
            source={require('../assets/images/estrela.png')}
            style={styles.footerIcon}
          />
          <Image
            source={require('../assets/images/check2.png')}
            style={styles.footerIcon}
          />
          <Image
            source={require('../assets/images/calculadora.png')}
            style={styles.footerIcon}
          />
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
    marginTop: 52,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  panelBoard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 360,
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderColor: COLORS.chalkBorder,
    borderWidth: 2,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingRight: 6,
  },
  passwordInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 12,
    color: COLORS.chalkText,
  },
  eyeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 18,
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
