import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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

function CheckRow({ label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
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
          setAcessos({ ...DEFAULT_ACESSOS, ...(first.permissoes || {}) })
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

  function onSelectAluno(id) {
    setSelectedAlunoId(id)
    setAlunoDropdownVisible(false)
    const aluno = alunos.find((a) => (a._id || a.id) === id)
    setAcessos({ ...DEFAULT_ACESSOS, ...(aluno?.permissoes || {}) })
  }

  function toggleAcesso(key) {
    setAcessos((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (key === 'todas') {
        const on = !prev.todas
        next.soma = on
        next.menos = on
        next.vezes = on
        next.dividir = on
      } else {
        next.todas = Boolean(
          next.soma && next.menos && next.vezes && next.dividir
        )
      }
      return next
    })
  }

  async function salvarPermissoes() {
    if (!selectedAlunoId) return

    try {
      setSaving(true)
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined

      await apiClient.post(
        '/acessos',
        {
          alunoId: selectedAlunoId,
          tipoUsuario: loggedUser?.tipo,
          acessos,
        },
        { headers }
      )

      Alert.alert('Sucesso', 'Acessos concedidos com sucesso')
      setAlunos((prev) =>
        prev.map((u) => {
          const id = u._id || u.id
          return id === selectedAlunoId ? { ...u, permissoes: acessos } : u
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
})
