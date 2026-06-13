import { useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native'
import apiClient from '../config/apiClient'
import { getErrorMessage } from '../utils/errorMessage'
import { COLORS, FONTS } from '../src/theme'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'

const ROLE_TYPES = {
  PAIS: 'Pais',
  DEPENDENTES: 'Dependentes',
}

const LEGACY_TO_CANONICAL_ROLE = {
  Aluno: ROLE_TYPES.DEPENDENTES,
  Professor: ROLE_TYPES.PAIS,
  Coordenador: ROLE_TYPES.PAIS,
  Dependentes: ROLE_TYPES.DEPENDENTES,
  Pais: ROLE_TYPES.PAIS,
}

const ROLE_DISPLAY = {
  [ROLE_TYPES.PAIS]: 'Responsáveis',
  [ROLE_TYPES.DEPENDENTES]: 'Dependentes',
}

const RELATION_OPTIONS = {
  [ROLE_TYPES.PAIS]: ['Pai', 'Mae', 'Responsavel'],
  [ROLE_TYPES.DEPENDENTES]: ['Filho', 'Filha', 'Dependente'],
}

const INITIAL_HOUSE_FORM = {
  organizationName: '',
  document: '',
  email: '',
}

function getCanonicalRole(role) {
  return LEGACY_TO_CANONICAL_ROLE[String(role || '').trim()] || role || ''
}

function getRoleDisplay(role) {
  const canonicalRole = getCanonicalRole(role)
  return ROLE_DISPLAY[canonicalRole] || canonicalRole
}

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cpf, setCpf] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [inviteToken, setInviteToken] = useState('')
  const [inviteInfo, setInviteInfo] = useState(null)
  const [flowStep, setFlowStep] = useState('choice')
  const [modalVisible, setModalVisible] = useState(true)
  const [houseForm, setHouseForm] = useState(INITIAL_HOUSE_FORM)
  const [statusMessage, setStatusMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [vinculo, setVinculo] = useState('Dependente')

  const resolvedRole = getCanonicalRole(
    inviteInfo?.role || ROLE_TYPES.DEPENDENTES
  )
  const shouldShowCpf = resolvedRole === ROLE_TYPES.PAIS
  const relationOptions = RELATION_OPTIONS[resolvedRole] || []
  const registerButtonLabel = inviteInfo
    ? `Registrar como ${vinculo || getRoleDisplay(resolvedRole)}`
    : 'Registrar'

  const inviteSummary = useMemo(() => {
    if (!inviteInfo) return null
    return `${inviteInfo.organizationName} • ${getRoleDisplay(inviteInfo.role)}`
  }, [inviteInfo])

  const updateHouseField = (key, value) => {
    setHouseForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleRequestOrganization = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post(
        '/auth/register/request-organization',
        houseForm
      )
      setStatusMessage(
        response?.data?.message ||
          'Convite enviado para o email informado. Agora use esse convite para continuar.'
      )
      if (response?.data?.inviteToken) {
        setInviteToken(response.data.inviteToken)
      }
      setEmail(
        String(houseForm.email || '')
          .toLowerCase()
          .trim()
      )
      setFlowStep('invite-entry')
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Nao foi possivel criar a casa.')
      )
    } finally {
      setLoading(false)
    }
  }

  const handleValidateInvite = async () => {
    try {
      setLoading(true)
      const response = await apiClient.post('/auth/register/validate-invite', {
        inviteToken,
      })
      const invite = response?.data?.invite
      const canonicalRole = getCanonicalRole(invite?.role)
      setInviteInfo(invite)
      setEmail(invite?.email || '')
      const nextRole = canonicalRole || ROLE_TYPES.DEPENDENTES
      setVinculo(nextRole === ROLE_TYPES.PAIS ? 'Responsavel' : 'Dependente')
      if (nextRole !== ROLE_TYPES.PAIS) {
        setCpf('')
      }
      setStatusMessage('Convite validado. Agora podemos concluir seu cadastro.')
      setModalVisible(false)
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Convite inválido ou expirado.')
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    try {
      setLoading(true)
      const payload = {
        inviteToken,
        name,
        email,
        password,
        confirmPassword,
        cpf,
        vinculo,
      }
      await apiClient.post('/auth/register', payload)
      Alert.alert('Sucesso', 'Registro realizado com sucesso!')
      navigation.navigate('Login')
    } catch (error) {
      console.error('Register error:', error?.response?.data || error.message)
      Alert.alert('Erro', getErrorMessage(error, 'Falha no registro'))
    } finally {
      setLoading(false)
    }
  }

  const renderChoiceStep = () => (
    <View style={styles.modalStepWrap}>
      <Text style={styles.modalTitle}>Como você deseja entrar?</Text>
      <Text style={styles.modalSubtitle}>
        Primeiro vamos vincular seu cadastro a uma casa com segurança.
      </Text>
      <TouchableOpacity
        style={styles.choiceButton}
        onPress={() => {
          setStatusMessage('')
          setFlowStep('create-organization')
        }}
      >
        <Text style={styles.choiceButtonText}>Criar nova casa</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.choiceButton, styles.choiceSecondaryButton]}
        onPress={() => {
          setStatusMessage('')
          setFlowStep('invite-entry')
        }}
      >
        <Text style={styles.choiceButtonText}>Entrar em uma casa</Text>
      </TouchableOpacity>
    </View>
  )

  const renderCreateOrganizationStep = () => (
    <View style={styles.modalStepWrap}>
      <Text style={styles.modalTitle}>Criar casa</Text>
      <Text style={styles.modalSubtitle}>
        Vamos validar os dados e enviar o convite inicial para o email
        informado.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Nome da casa"
        placeholderTextColor="rgba(255,255,255,0.7)"
        value={houseForm.organizationName}
        onChangeText={(value) => updateHouseField('organizationName', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="CPF do responsável"
        placeholderTextColor="rgba(255,255,255,0.7)"
        value={houseForm.document}
        onChangeText={(value) => updateHouseField('document', value)}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email do responsável"
        placeholderTextColor="rgba(255,255,255,0.7)"
        value={houseForm.email}
        onChangeText={(value) => updateHouseField('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleRequestOrganization}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Enviando...' : 'Criar e enviar convite'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setFlowStep('choice')}>
        <Text style={styles.link}>Voltar</Text>
      </TouchableOpacity>
    </View>
  )

  const renderInviteStep = () => (
    <View style={styles.modalStepWrap}>
      <Text style={styles.modalTitle}>Entrar com convite</Text>
      <Text style={styles.modalSubtitle}>
        {statusMessage ||
          'Digite o convite recebido por email para liberar sua ficha de cadastro.'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Código do convite"
        placeholderTextColor="rgba(255,255,255,0.7)"
        value={inviteToken}
        onChangeText={setInviteToken}
        autoCapitalize="characters"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleValidateInvite}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Validando...' : 'Validar convite'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setFlowStep('choice')}>
        <Text style={styles.link}>Voltar</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ClassroomBackground stripeTop={120}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ChalkPanel style={styles.panel} boardStyle={styles.panelBoard}>
          <View style={styles.flagsRow}>
            <Text style={styles.flag}>▲</Text>
            <Text style={styles.flag}>●</Text>
            <Text style={styles.flag}>■</Text>
            <Text style={styles.flag}>●</Text>
            <Text style={styles.flag}>▲</Text>
          </View>
          <Text style={styles.title}>Registrar</Text>

          {inviteInfo ? (
            <View style={styles.inviteCard}>
              <Text style={styles.inviteCardLabel}>Convite liberado</Text>
              <Text style={styles.inviteCardText}>{inviteSummary}</Text>
              <Text style={styles.inviteCardSmall}>{inviteInfo.email}</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.link}>Trocar convite</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.lockedCard}>
              <Text style={styles.lockedTitle}>
                Cadastro protegido por convite
              </Text>
              <Text style={styles.lockedText}>
                Antes de continuar, precisamos validar a casa do seu acesso.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.buttonText}>Abrir fluxo de convite</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Nome"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, inviteInfo && styles.inputLocked]}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!inviteInfo}
          />

          {relationOptions.length ? (
            <View style={styles.relationSection}>
              <Text style={styles.relationLabel}>
                {resolvedRole === ROLE_TYPES.PAIS
                  ? 'Você entra como'
                  : 'Esse dependente é seu'}
              </Text>
              <View style={styles.roleRow}>
                {relationOptions.map((option) => {
                  const selected = vinculo === option
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.roleChip,
                        selected && styles.roleChipSelected,
                      ]}
                      onPress={() => setVinculo(option)}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          selected && styles.roleChipTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ) : null}

          {shouldShowCpf ? (
            <TextInput
              style={styles.input}
              placeholder="CPF"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="number-pad"
            />
          ) : null}

          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Senha"
              placeholderTextColor="rgba(255,255,255,0.7)"
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
              placeholderTextColor="rgba(255,255,255,0.7)"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
            >
              <Text style={styles.eyeText}>
                {showConfirmPassword ? '🙈' : '👁'}
              </Text>
            </TouchableOpacity>
          </View>

          {!shouldShowCpf ? null : (
            <Text style={styles.helperText}>
              O primeiro cadastro de responsáveis entra vinculado à casa e
              recebe o grupo geral automaticamente.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, !inviteInfo && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={!inviteInfo || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Registrando...' : registerButtonLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Voltar ao Login</Text>
          </TouchableOpacity>
        </ChalkPanel>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ChalkPanel style={styles.modalPanel} boardStyle={styles.modalBoard}>
            <View style={styles.flagsRow}>
              <Text style={styles.flag}>▲</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>■</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>▲</Text>
            </View>
            {flowStep === 'choice' && renderChoiceStep()}
            {flowStep === 'create-organization' &&
              renderCreateOrganizationStep()}
            {flowStep === 'invite-entry' && renderInviteStep()}
            <TouchableOpacity
              onPress={() => {
                if (inviteInfo) {
                  setModalVisible(false)
                } else {
                  navigation.navigate('Login')
                }
              }}
            >
              <Text style={styles.link}>
                {inviteInfo ? 'Fechar' : 'Cancelar'}
              </Text>
            </TouchableOpacity>
          </ChalkPanel>
        </View>
      </Modal>
    </ClassroomBackground>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 42,
    paddingBottom: 24,
    paddingHorizontal: 10,
  },
  panel: {
    alignSelf: 'center',
    width: '96%',
    maxWidth: 720,
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
  inputLocked: {
    opacity: 0.78,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationSection: {
    marginBottom: 10,
  },
  relationLabel: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    marginBottom: 6,
    opacity: 0.9,
  },
  roleChip: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  roleChipSelected: {
    backgroundColor: '#ffd457',
    borderColor: '#ffe7a8',
  },
  roleChipText: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
  },
  roleChipTextSelected: {
    color: '#264117',
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
  buttonDisabled: {
    opacity: 0.55,
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
  lockedCard: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  lockedTitle: {
    color: COLORS.chalkText,
    fontFamily: FONTS.title,
    fontSize: 19,
    marginBottom: 4,
  },
  lockedText: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    opacity: 0.88,
  },
  inviteCard: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(255,214,90,0.14)',
  },
  inviteCardLabel: {
    color: '#ffe082',
    fontFamily: FONTS.body,
    marginBottom: 4,
  },
  inviteCardText: {
    color: COLORS.chalkText,
    fontFamily: FONTS.title,
    fontSize: 18,
  },
  inviteCardSmall: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    opacity: 0.88,
    marginTop: 2,
  },
  helperText: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    opacity: 0.88,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
    padding: 16,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 720,
  },
  modalBoard: {
    padding: 16,
  },
  modalStepWrap: {
    gap: 8,
  },
  modalTitle: {
    color: COLORS.chalkText,
    textAlign: 'center',
    fontFamily: FONTS.title,
    fontSize: 24,
  },
  modalSubtitle: {
    color: COLORS.chalkText,
    textAlign: 'center',
    fontFamily: FONTS.body,
    opacity: 0.88,
    marginBottom: 6,
  },
  choiceButton: {
    backgroundColor: '#68bd62',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
  },
  choiceSecondaryButton: {
    backgroundColor: '#5a93d8',
  },
  choiceButtonText: {
    color: '#fff',
    fontFamily: FONTS.body,
    fontSize: 16,
  },
})

export default RegisterScreen
