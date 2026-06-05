import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native'
import apiClient from '../config/apiClient'
import { getErrorMessage } from '../utils/errorMessage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Header from '../components/Header'
import { FONTS } from '../src/theme'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'

const DEFAULT_ACESSOS = {
  soma: false,
  menos: false,
  vezes: false,
  dividir: false,
  todas: false,
}

function normalizeAcessos(acessos = {}) {
  const normalized = {
    ...DEFAULT_ACESSOS,
    ...acessos,
  }

  if (normalized.todas) {
    normalized.soma = true
    normalized.menos = true
    normalized.vezes = true
    normalized.dividir = true
  } else {
    normalized.todas = Boolean(
      normalized.soma &&
      normalized.menos &&
      normalized.vezes &&
      normalized.dividir
    )
  }

  return normalized
}

function CheckRow({ label, value, onPress }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={`Alternar ${label}`}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.checkbox, value && styles.checkboxOn]}>
        {value ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
    </TouchableOpacity>
  )
}

export default function PermissoesScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [token, setToken] = useState(null)
  const [loggedUser, setLoggedUser] = useState(null)
  const [alunos, setAlunos] = useState([])
  const [selectedAlunoId, setSelectedAlunoId] = useState(null)
  const [alunoDropdownVisible, setAlunoDropdownVisible] = useState(false)
  const [acessos, setAcessos] = useState(DEFAULT_ACESSOS)
  const [inviteVisible, setInviteVisible] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Aluno')
  const [inviteSending, setInviteSending] = useState(false)
  const acessosRef = useRef(DEFAULT_ACESSOS)

  useEffect(() => {
    acessosRef.current = acessos
  }, [acessos])

  useEffect(() => {
    ;(async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token')
        const userId = await AsyncStorage.getItem('userId')
        if (!storedToken || !userId) return

        setToken(storedToken)
        const headers = { Authorization: `Bearer ${storedToken}` }

        const meResp = await apiClient.get(`/auth/login/${userId}`, { headers })
        const me = meResp.data?.user
        setLoggedUser(me)

        const usersResp = await apiClient.get('/auth/register', { headers })
        const users = Array.isArray(usersResp.data) ? usersResp.data : []

        let filtered = []
        if (me?.tipo === 'Professor') {
          filtered = users.filter(
            (u) => u.tipo === 'Aluno' && u.turma === me.turma
          )
        } else if (me?.tipo === 'Coordenador') {
          filtered = users.filter((u) => u.tipo !== 'Coordenador')
        } else {
          filtered = users.filter((u) => u.tipo === 'Aluno')
        }

        setAlunos(filtered)

        if (filtered.length > 0) {
          const first = filtered[0]
          const id = first._id || first.id
          setSelectedAlunoId(id)
          setAcessos(normalizeAcessos(first.permissoes))
        }
      } catch (err) {
        console.error(
          'Erro ao carregar permissões:',
          err?.response?.data || err.message
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const selectedAluno = useMemo(
    () => alunos.find((a) => (a._id || a.id) === selectedAlunoId),
    [alunos, selectedAlunoId]
  )
  const selectedAlunoLabel = selectedAluno?.name || 'Selecione um aluno'
  const inviteRoles = useMemo(() => {
    if (loggedUser?.tipo === 'Professor') return ['Aluno']
    if (loggedUser?.tipo === 'Coordenador') {
      return ['Aluno', 'Professor', 'Coordenador']
    }
    return []
  }, [loggedUser])
  const canInvite = inviteRoles.length > 0

  function onSelectAluno(id) {
    setSelectedAlunoId(id)
    setAlunoDropdownVisible(false)
    const aluno = alunos.find((a) => (a._id || a.id) === id)
    const nextAcessos = normalizeAcessos(aluno?.permissoes)
    acessosRef.current = nextAcessos
    setAcessos(nextAcessos)
  }

  function toggleAcesso(key) {
    setAcessos((prev) => {
      let normalized

      if (key === 'todas') {
        const on = !prev.todas
        normalized = normalizeAcessos({
          ...prev,
          soma: on,
          menos: on,
          vezes: on,
          dividir: on,
          todas: on,
        })
      } else {
        const next = { ...prev, [key]: !prev[key], todas: false }
        normalized = normalizeAcessos(next)
      }

      acessosRef.current = normalized
      return normalized
    })
  }

  async function salvarPermissoes() {
    if (!selectedAlunoId) return

    try {
      setSaving(true)
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined

      const acessosNormalizados = normalizeAcessos(acessosRef.current)

      await apiClient.post(
        '/acessos',
        {
          alunoId: selectedAlunoId,
          tipoUsuario: loggedUser?.tipo,
          acessos: acessosNormalizados,
        },
        { headers }
      )

      Alert.alert('Sucesso', 'Acessos concedidos com sucesso')
      setAcessos(acessosNormalizados)
      setAlunos((prev) =>
        prev.map((u) => {
          const id = u._id || u.id
          return id === selectedAlunoId
            ? { ...u, permissoes: acessosNormalizados }
            : u
        })
      )
    } catch (err) {
      console.error(
        'Erro ao salvar permissões:',
        err?.response?.data || err.message
      )
      Alert.alert(
        'Erro',
        getErrorMessage(err, 'Não foi possível salvar permissões')
      )
    } finally {
      setSaving(false)
    }
  }

  async function enviarConvite() {
    try {
      setInviteSending(true)
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const response = await apiClient.post(
        '/auth/register/request-invite',
        {
          email: inviteEmail,
          role: inviteRole,
        },
        { headers }
      )

      setInviteVisible(false)
      setInviteEmail('')
      setInviteRole(inviteRoles[0] || 'Aluno')
      Alert.alert(
        'Convite enviado',
        response?.data?.message || 'Convite enviado para o email informado.'
      )
    } catch (err) {
      console.error(
        'Erro ao enviar convite:',
        err?.response?.data || err.message
      )
      Alert.alert(
        'Erro',
        getErrorMessage(err, 'Não foi possível enviar o convite.')
      )
    } finally {
      setInviteSending(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ClassroomBackground stripeTop={120}>
      <Header />
      <View style={styles.fixedBackWrap}>
        <TouchableOpacity
          onPress={() => navigation?.navigate('Tabuada')}
          style={styles.fixedBackButton}
        >
          <Text style={styles.fixedBackArrow}>‹</Text>
          <Text style={styles.fixedBackText}>Voltar para Tabuada</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <ChalkPanel style={styles.panel} boardStyle={styles.panelBoard}>
          <View style={styles.panelHeader}>
            <Text style={styles.title}>Permissões às Tabuadas</Text>
          </View>
          <View style={styles.flagsRow}>
            <Text style={styles.flag}>▲</Text>
            <Text style={styles.flag}>●</Text>
            <Text style={styles.flag}>■</Text>
            <Text style={styles.flag}>●</Text>
            <Text style={styles.flag}>▲</Text>
          </View>

          {alunos.length > 0 && (
            <View style={styles.alunoDropdownWrap}>
              <TouchableOpacity
                style={styles.alunoDropdownButton}
                onPress={() => setAlunoDropdownVisible((visible) => !visible)}
                accessibilityLabel="Selecionar aluno"
              >
                <View style={styles.alunoDropdownLabelWrap}>
                  <Text style={styles.alunoDropdownCaption}>Aluno</Text>
                  <Text style={styles.alunoDropdownText} numberOfLines={1}>
                    {selectedAlunoLabel}
                  </Text>
                </View>
                <Text style={styles.alunoDropdownArrow}>
                  {alunoDropdownVisible ? '⌃' : '⌄'}
                </Text>
              </TouchableOpacity>

              {alunoDropdownVisible && (
                <View style={styles.alunoDropdownList}>
                  <ScrollView
                    nestedScrollEnabled
                    style={styles.alunoOptionsScroll}
                  >
                    {alunos.map((aluno) => {
                      const id = aluno._id || aluno.id
                      const active = id === selectedAlunoId
                      return (
                        <TouchableOpacity
                          key={id}
                          onPress={() => onSelectAluno(id)}
                          style={[
                            styles.alunoOption,
                            active && styles.alunoOptionActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.alunoOptionText,
                              active && styles.alunoOptionTextActive,
                            ]}
                            numberOfLines={2}
                          >
                            {aluno.name}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {canInvite ? (
            <View style={styles.inviteSection}>
              <View style={styles.inviteTextWrap}>
                <Text style={styles.inviteTitle}>Convidar novo usuário</Text>
                <Text style={styles.inviteSubtitle}>
                  Gere convites seguros para entrar na sua instituição.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => {
                  setInviteRole(inviteRoles[0] || 'Aluno')
                  setInviteVisible(true)
                }}
              >
                <Text style={styles.inviteButtonText}>Gerar convite</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!selectedAluno ? (
            <Text style={styles.empty}>
              Nenhum aluno encontrado para este perfil.
            </Text>
          ) : (
            <View>
              <CheckRow
                label="Adição"
                value={!!acessos.soma}
                onPress={() => toggleAcesso('soma')}
              />
              <CheckRow
                label="Subtração"
                value={!!acessos.menos}
                onPress={() => toggleAcesso('menos')}
              />
              <CheckRow
                label="Multiplicação"
                value={!!acessos.vezes}
                onPress={() => toggleAcesso('vezes')}
              />
              <CheckRow
                label="Divisão"
                value={!!acessos.dividir}
                onPress={() => toggleAcesso('dividir')}
              />
              <CheckRow
                label="Todas"
                value={!!acessos.todas}
                onPress={() => toggleAcesso('todas')}
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.secondary]}
                  onPress={() => onSelectAluno(selectedAlunoId)}
                >
                  <Text style={styles.secondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primary]}
                  onPress={salvarPermissoes}
                  disabled={saving}
                >
                  <Text style={styles.primaryText}>
                    {saving ? 'Salvando...' : 'Salvar Permissões'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
            <Image
              source={require('../assets/images/redCross2.png')}
              style={styles.footerIcon}
            />
          </View>
        </ChalkPanel>
      </ScrollView>

      <Modal transparent visible={inviteVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <ChalkPanel style={styles.modalFrame} boardStyle={styles.modalBoard}>
            <View style={styles.flagsRow}>
              <Text style={styles.flag}>▲</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>■</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>▲</Text>
            </View>
            <Text style={styles.modalTitle}>Gerar convite</Text>
            <Text style={styles.modalSubtitle}>
              O convite será enviado por email e já ficará vinculado à
              instituição.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Email do usuário"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.roleRow}>
              {inviteRoles.map((role) => {
                const selected = inviteRole === role
                return (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleChip,
                      selected && styles.roleChipSelected,
                    ]}
                    onPress={() => setInviteRole(role)}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        selected && styles.roleChipTextSelected,
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.secondary]}
                onPress={() => setInviteVisible(false)}
              >
                <Text style={styles.secondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.primary]}
                onPress={enviarConvite}
                disabled={inviteSending}
              >
                <Text style={styles.primaryText}>
                  {inviteSending ? 'Enviando...' : 'Enviar convite'}
                </Text>
              </TouchableOpacity>
            </View>
          </ChalkPanel>
        </View>
      </Modal>
    </ClassroomBackground>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fixedBackWrap: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'rgba(243,229,199,0.82)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(97,190,220,0.8)',
    alignItems: 'center',
  },
  fixedBackButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15553f',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#d9c29b',
    paddingVertical: 7,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fixedBackArrow: {
    color: '#f8f8f8',
    fontFamily: FONTS.body,
    fontSize: 18,
    lineHeight: 18,
    marginRight: 5,
    transform: [{ translateY: -1 }],
  },
  fixedBackText: {
    color: '#f8f8f8',
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  container: { padding: 14, paddingTop: 8 },
  panel: {
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  panelBoard: {
    paddingBottom: 8,
    minHeight: 520,
  },
  panelHeader: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  flagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '92%',
    alignSelf: 'center',
    opacity: 0.45,
    marginTop: 8,
    marginBottom: 6,
  },
  flag: { color: '#f8f8f8', fontSize: 12 },
  title: {
    fontSize: 22,
    fontFamily: FONTS.title,
    color: '#f8f8f8',
    letterSpacing: 0.3,
  },
  alunoDropdownWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  alunoDropdownButton: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.48)',
    backgroundColor: 'rgba(0,0,0,0.13)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alunoDropdownLabelWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  alunoDropdownCaption: {
    color: '#ffd54f',
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 16,
  },
  alunoDropdownText: {
    color: '#f8f8f8',
    fontFamily: FONTS.body,
    fontSize: 17,
    lineHeight: 22,
  },
  alunoDropdownArrow: {
    color: '#f8f8f8',
    fontFamily: FONTS.title,
    fontSize: 22,
    lineHeight: 24,
  },
  alunoDropdownList: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: '#174d3b',
    overflow: 'hidden',
  },
  alunoOptionsScroll: {
    maxHeight: 190,
  },
  alunoOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  alunoOptionActive: {
    backgroundColor: '#ffd54f',
  },
  alunoOptionText: {
    color: '#f8f8f8',
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  alunoOptionTextActive: { color: '#1f1f1f' },
  inviteSection: {
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  inviteTextWrap: {
    flex: 1,
  },
  inviteTitle: {
    color: '#f8f8f8',
    fontFamily: FONTS.title,
    fontSize: 19,
  },
  inviteSubtitle: {
    color: '#f8f8f8',
    opacity: 0.85,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  inviteButton: {
    backgroundColor: '#5a93d8',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.42)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inviteButtonText: {
    color: '#fff',
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { fontFamily: FONTS.body, fontSize: 16, color: '#f8f8f8' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  checkboxOn: {
    backgroundColor: '#42a5f5',
    borderColor: '#42a5f5',
  },
  checkMark: { color: '#fff', fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
    marginHorizontal: 14,
    marginBottom: 14,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  primary: {
    backgroundColor: '#42a5f5',
  },
  secondaryText: { fontFamily: FONTS.body, color: '#f8f8f8' },
  primaryText: { fontFamily: FONTS.body, color: '#fff' },
  empty: {
    fontFamily: FONTS.body,
    color: '#f8f8f8',
    marginTop: 10,
    marginHorizontal: 14,
    marginBottom: 14,
  },
  footerDecor: {
    marginTop: 6,
    marginBottom: 14,
    width: '92%',
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: 'rgba(120,72,32,0.5)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'center',
  },
  footerIcon: { width: 22, height: 22, resizeMode: 'contain' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalFrame: {
    width: '100%',
    maxWidth: 720,
  },
  modalBoard: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  modalTitle: {
    color: '#f8f8f8',
    fontFamily: FONTS.title,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#f8f8f8',
    opacity: 0.88,
    fontFamily: FONTS.body,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalInput: {
    height: 46,
    borderColor: 'rgba(255,255,255,0.5)',
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#f8f8f8',
    fontFamily: FONTS.body,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  roleChip: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  roleChipSelected: {
    backgroundColor: '#ffd54f',
    borderColor: '#ffd54f',
  },
  roleChipText: {
    color: '#f8f8f8',
    fontFamily: FONTS.body,
  },
  roleChipTextSelected: {
    color: '#1f1f1f',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
})
