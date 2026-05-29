import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import apiClient from '../config/apiClient'
import { getErrorMessage } from '../utils/errorMessage'
import { COLORS, FONTS } from '../src/theme'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'

const RegisterScreen = ({ navigation }) => {
  const [tipo, setTipo] = useState('Aluno')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [turma, setTurma] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleRegister = async () => {
    try {
      const payload = { tipo, name, email, password, confirmPassword, turma }
      await apiClient.post('/auth/register', payload)
      Alert.alert('Sucesso', 'Registro realizado com sucesso!')
      navigation.navigate('Login')
    } catch (error) {
      console.error('Register error:', error?.response?.data || error.message)
      Alert.alert('Erro', getErrorMessage(error, 'Falha no registro'))
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
        <Text style={styles.title}>Registrar</Text>

        <Text style={styles.label}>Tipo de usuário</Text>
        <View style={styles.roleRow}>
          {['Aluno', 'Professor', 'Coordenador'].map((role) => {
            const selected = tipo === role
            return (
              <TouchableOpacity
                key={role}
                style={[styles.roleOption, selected && styles.roleOptionSelected]}
                onPress={() => setTipo(role)}
              >
                <Text style={[styles.roleText, selected && styles.roleTextSelected]}>
                  {role}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
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
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirme a senha"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword((prev) => !prev)}
          >
            <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Turma"
          value={turma}
          onChangeText={setTurma}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Registrar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Voltar ao Login</Text>
        </TouchableOpacity>
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
    marginTop: 42,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  panelBoard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 470,
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
    fontSize: 24,
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
    fontFamily: FONTS.body,
    color: COLORS.chalkText,
  },
  label: {
    marginBottom: 6,
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  roleOption: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.chalkBorder,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  roleOptionSelected: {
    backgroundColor: COLORS.accentYellow,
    borderColor: COLORS.accentYellow,
  },
  roleText: {
    fontFamily: FONTS.body,
    color: COLORS.chalkText,
    fontSize: 12,
  },
  roleTextSelected: {
    color: '#1f1f1f',
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
    fontFamily: FONTS.body,
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
})

export default RegisterScreen
