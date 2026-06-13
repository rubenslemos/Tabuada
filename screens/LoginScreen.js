import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native'
import apiClient, { setAuthToken } from '../config/apiClient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getErrorMessage } from '../utils/errorMessage'
import { COLORS, FONTS } from '../src/theme'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [successVisible, setSuccessVisible] = useState(false)
  const [loginDestination, setLoginDestination] = useState('Tabuada')

  const handleLogin = async () => {
    try {
      const response = await apiClient.post(
        '/auth/login/',
        { email, password },
        {
          timeout: 5000, // add timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const token = response.data.token
      const user = response.data.user || {}
      const userId = user._id || user.id || null
      const totalAcertos = response.data.totalAcertos || 0
      const totalJogos = response.data.totalJogos || 0
      const totalErros = response.data.totalErros || 0
      const isGlobalAdmin = Boolean(user?.isGlobalAdmin)

      if (token) {
        await AsyncStorage.setItem('token', token)
        if (userId) await AsyncStorage.setItem('userId', String(userId))
        if (user && (user.name || user._id))
          await AsyncStorage.setItem('userName', user.name || user._id)
        if (user?.email) await AsyncStorage.setItem('userEmail', user.email)
        await AsyncStorage.setItem('userVinculo', user?.vinculo || '')
        await AsyncStorage.setItem('userAvatar', user?.avatar || '🧒')
        await AsyncStorage.setItem(
          'userPermissions',
          JSON.stringify(user?.permissoes || {})
        )
        await AsyncStorage.setItem(
          'userOrganizationName',
          user?.organizationName || ''
        )
        await AsyncStorage.setItem(
          'isGlobalAdmin',
          isGlobalAdmin ? 'true' : 'false'
        )
        await AsyncStorage.setItem('totalAcertos', String(totalAcertos))
        await AsyncStorage.setItem('totalJogos', String(totalJogos))
        await AsyncStorage.setItem('totalErros', String(totalErros))

        // set default Authorization header for future axios calls
        setAuthToken(token)
        setLoginDestination('Tabuada')

        setSuccessVisible(true)
      } else {
        Alert.alert('Erro', 'Resposta inválida do servidor')
      }
    } catch (error) {
      console.error('Login error:', error?.response?.data || error.message)
      Alert.alert('Erro', getErrorMessage(error, 'Falha no login'))
    }
  }

  return (
    <ClassroomBackground stripeTop={120}>
      <ChalkPanel style={styles.panel} boardStyle={styles.panelBoard}>
        <View style={styles.centeredContent}>
          <View style={styles.flagsRow}>
            <Text style={styles.flag}>▲</Text>
            <Text style={styles.flag}>●</Text>
            <Text style={styles.flag}>■</Text>
            <Text style={styles.flag}>●</Text>
            <Text style={styles.flag}>▲</Text>
          </View>
          <Text style={styles.title}>Login</Text>
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
              placeholder="Senha"
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
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.link}>Esqueceu a senha?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Registrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <Text style={styles.link}>Política de privacidade</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('DeleteAccount')}
          >
            <Text style={styles.link}>Solicitar exclusão de conta</Text>
          </TouchableOpacity>
        </View>
      </ChalkPanel>

      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ChalkPanel
            style={styles.successModalFrame}
            boardStyle={styles.successModalBoard}
          >
            <View style={styles.modalFlagsRow}>
              <Text style={styles.modalFlag}>▲</Text>
              <Text style={styles.modalFlag}>●</Text>
              <Text style={styles.modalFlag}>■</Text>
              <Text style={styles.modalFlag}>●</Text>
              <Text style={styles.modalFlag}>▲</Text>
            </View>
            <Text style={styles.successBadge}>✓</Text>
            <Text style={styles.successTitle}>Sucesso</Text>
            <Text style={styles.successMessage}>
              Login realizado com sucesso!
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setSuccessVisible(false)
                navigation.navigate(loginDestination)
              }}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
          </ChalkPanel>
        </View>
      </Modal>
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
    marginBottom: 20,
    padding: 0,
    borderRadius: 10,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  panelBoard: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 430,
    alignItems: 'center',
  },
  centeredContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
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
    fontSize: 28,
    marginBottom: 10,
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
    width: '100%',
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
    width: '100%',
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
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  link: {
    color: COLORS.chalkText,
    textAlign: 'center',
    fontFamily: FONTS.body,
    marginTop: 6,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
    padding: 18,
  },
  successModalFrame: {
    width: '88%',
    maxWidth: 420,
    backgroundColor: 'transparent',
  },
  successModalBoard: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    alignItems: 'center',
  },
  modalFlagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '86%',
    opacity: 0.45,
    marginBottom: 4,
  },
  modalFlag: {
    color: COLORS.chalkText,
    fontSize: 11,
  },
  successBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,213,79,0.9)',
    color: '#ffd54f',
    fontSize: 34,
    lineHeight: 54,
    textAlign: 'center',
    fontFamily: FONTS.title,
    marginTop: 6,
    marginBottom: 8,
  },
  successTitle: {
    color: COLORS.chalkText,
    fontFamily: FONTS.title,
    fontSize: 30,
    textAlign: 'center',
  },
  successMessage: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  successButton: {
    minWidth: 140,
    borderRadius: 8,
    backgroundColor: '#72c35f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontFamily: FONTS.body,
    fontSize: 18,
  },
})

export default LoginScreen
