import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import apiClient from '../config/apiClient'
import { getErrorMessage } from '../utils/errorMessage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Header from '../components/Header'
import { FONTS } from '../src/theme'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'

function fmtPercent(part, total) {
  if (!total) return 0
  const p = Math.round((100 * part) / total)
  return Number.isFinite(p) && p > 0 ? p : 0
}

export default function PerformanceScreen({ navigation }) {
  const { width } = useWindowDimensions()
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [loggedUser, setLoggedUser] = useState(null)
  const [usersList, setUsersList] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [userDropdownVisible, setUserDropdownVisible] = useState(false)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [details, setDetails] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token')
        const userId = await AsyncStorage.getItem('userId')

        if (!userId) return

        setToken(storedToken)

        const authHeaders = storedToken
          ? { Authorization: `Bearer ${storedToken}` }
          : undefined

        const meResp = await apiClient.get(`/auth/login/${userId}`)
        const me = meResp.data?.user
        setLoggedUser(me)
        setSelectedUserId(me?._id || me?.id || null)

        if (me?.tipo === 'Pais') {
          const usersResp = await apiClient.get('/auth/register', {
            headers: authHeaders,
          })
          const users = Array.isArray(usersResp.data) ? usersResp.data : []
          setUsersList(users)
        }
      } catch (err) {
        console.error(
          'Erro ao carregar desempenho:',
          err?.response?.data || getErrorMessage(err)
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const selectedUser = useMemo(() => {
    if (!loggedUser) return null
    const meId = loggedUser._id || loggedUser.id
    if (!selectedUserId || selectedUserId === meId) return loggedUser

    if (loggedUser.tipo === 'Pais') {
      return usersList.find((u) => (u._id || u.id) === selectedUserId)
    }

    return loggedUser
  }, [loggedUser, selectedUserId, usersList])

  const selectableUsers = useMemo(() => {
    if (!loggedUser) return []

    const meId = loggedUser._id || loggedUser.id
    const meOption = [{ id: meId, label: `Logado: ${loggedUser.name}` }]

    if (loggedUser.tipo === 'Pais') {
      const dependentes = usersList
        .filter((u) => u.tipo === 'Dependentes')
        .map((u) => ({ id: u._id || u.id, label: u.name }))
      return [...meOption, ...dependentes]
    }

    return meOption
  }, [loggedUser, usersList])

  async function openRoundDetails(round, roundIndex) {
    try {
      const roundId = round._id || round.id
      const resp = await apiClient.get(`/round/${roundId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      const fetched = resp.data?.round
      const c = fetched?.contagemOperacoes?.contagemOperacoes || {}
      setDetails({
        index: roundIndex + 1,
        acertosPercent: fmtPercent(round.acerto || 0, round.jogou || 0),
        errosPercent: fmtPercent(round.errou || 0, round.jogou || 0),
        faPlus: c.faPlus ?? 0,
        faMinus: c.faMinus ?? 0,
        faTimes: c.faTimes ?? 0,
        faDivide: c.faDivide ?? 0,
      })
      setDetailsVisible(true)
    } catch (err) {
      console.error(
        'Erro ao obter detalhes do round:',
        err?.response?.data || getErrorMessage(err)
      )
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    )
  }

  const rounds = selectedUser?.rounds || []
  const selectedUserLabel =
    selectableUsers.find((u) => u.id === selectedUserId)?.label ||
    'Selecione um dependente'
  const gridColumns = width >= 720 ? 3 : width < 360 ? 1 : 2
  const roundCardWidth =
    gridColumns === 3 ? '31.6%' : gridColumns === 2 ? '48.2%' : '100%'

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

      <View style={styles.container}>
        <ChalkPanel fill style={styles.panel} boardStyle={styles.panelBoard}>
          <View style={styles.boardContent}>
            <View style={styles.panelHeader}>
              <Text style={styles.title}>Resultados</Text>
            </View>
            <View style={styles.flagsRow}>
              <Text style={styles.flag}>▲</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>■</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>▲</Text>
            </View>

            {selectableUsers.length > 1 && (
              <View style={styles.userDropdownWrap}>
                <TouchableOpacity
                  style={styles.userDropdownButton}
                  onPress={() => setUserDropdownVisible((visible) => !visible)}
                  accessibilityLabel="Selecionar usuário"
                >
                  <View style={styles.userDropdownLabelWrap}>
                    <Text style={styles.userDropdownCaption}>Usuário</Text>
                    <Text style={styles.userDropdownText} numberOfLines={1}>
                      {selectedUserLabel}
                    </Text>
                  </View>
                  <Text style={styles.userDropdownArrow}>
                    {userDropdownVisible ? '⌃' : '⌄'}
                  </Text>
                </TouchableOpacity>

                {userDropdownVisible && (
                  <View style={styles.userDropdownList}>
                    <ScrollView
                      nestedScrollEnabled
                      style={styles.userOptionsScroll}
                    >
                      {selectableUsers.map((u) => {
                        const active = selectedUserId === u.id
                        return (
                          <TouchableOpacity
                            key={u.id}
                            onPress={() => {
                              setSelectedUserId(u.id)
                              setUserDropdownVisible(false)
                            }}
                            style={[
                              styles.userOption,
                              active && styles.userOptionActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.userOptionText,
                                active && styles.userOptionTextActive,
                              ]}
                              numberOfLines={2}
                            >
                              {u.label}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {rounds.length === 0 ? (
                <Text style={styles.empty}>
                  Ainda não existem rodadas para este usuário
                </Text>
              ) : (
                <View style={styles.roundGrid}>
                  {rounds.map((item, index) => {
                    const acertos = fmtPercent(
                      item.acerto || 0,
                      item.jogou || 0
                    )
                    const erros = fmtPercent(item.errou || 0, item.jogou || 0)

                    return (
                      <View
                        key={item._id || item.id || index}
                        style={[styles.roundCard, { width: roundCardWidth }]}
                      >
                        <View style={styles.roundCardHeader}>
                          <Text style={styles.roundNumber}>#{index + 1}</Text>
                          <TouchableOpacity
                            accessibilityLabel={`Detalhes da rodada ${index + 1}`}
                            style={styles.expandButton}
                            onPress={() => openRoundDetails(item, index)}
                          >
                            <Text style={styles.expandButtonText}>⊕</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.metricLine}>
                          <Text style={styles.metricLabel}>Jogadas</Text>
                          <Text style={styles.metricValue}>
                            {item.jogou || 0}
                          </Text>
                        </View>
                        <View style={styles.metricLine}>
                          <Text style={styles.metricLabel}>Acertos</Text>
                          <Text style={styles.metricValue}>
                            {item.acerto || 0} ➜ {acertos}%
                          </Text>
                        </View>
                        <View style={styles.metricLine}>
                          <Text style={styles.metricLabel}>Erros</Text>
                          <Text style={styles.metricValue}>
                            {item.errou || 0} ➜ {erros}%
                          </Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </ChalkPanel>
      </View>

      <Modal visible={detailsVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailsVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              Detalhes Rodada {details?.index || ''}
            </Text>
            <Text style={styles.modalLine}>Adição: {details?.faPlus ?? 0}</Text>
            <Text style={styles.modalLine}>
              Subtração: {details?.faMinus ?? 0}
            </Text>
            <Text style={styles.modalLine}>
              Multiplicação: {details?.faTimes ?? 0}
            </Text>
            <Text style={styles.modalLine}>
              Divisão: {details?.faDivide ?? 0}
            </Text>
            <Text style={styles.modalLine}>
              Acertos (%): {details?.acertosPercent ?? 0}
            </Text>
            <Text style={styles.modalLine}>
              Erros (%): {details?.errosPercent ?? 0}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDetailsVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ClassroomBackground>
  )
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fixedBackWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  fixedBackButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b5d4c',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: '#d7c48e',
  },
  fixedBackArrow: {
    color: '#f3f1d6',
    fontSize: 20,
    marginRight: 6,
    lineHeight: 22,
    fontFamily: FONTS.title,
  },
  fixedBackText: { color: '#f3f1d6', fontSize: 13, fontFamily: FONTS.body },
  container: { flex: 1, paddingHorizontal: 14, paddingBottom: 14 },
  panel: { flex: 1 },
  panelBoard: { paddingHorizontal: 12, paddingVertical: 12 },
  boardContent: { flex: 1 },
  panelHeader: { marginBottom: 8 },
  title: { color: '#f2f4dc', fontSize: 24, fontFamily: FONTS.title },
  flagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  flag: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  userDropdownWrap: { marginBottom: 12 },
  userDropdownButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userDropdownLabelWrap: { flex: 1, marginRight: 8 },
  userDropdownCaption: {
    color: '#fff6cf',
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  userDropdownText: { color: '#f5f8f0', fontSize: 18, fontFamily: FONTS.body },
  userDropdownArrow: {
    color: '#f5f8f0',
    fontSize: 18,
    fontFamily: FONTS.title,
  },
  userDropdownList: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: '#1d5b47',
    maxHeight: 190,
  },
  userOptionsScroll: { maxHeight: 190 },
  userOption: { paddingHorizontal: 12, paddingVertical: 10 },
  userOptionActive: { backgroundColor: 'rgba(255,212,87,0.18)' },
  userOptionText: { color: '#f5f8f0', fontSize: 15, fontFamily: FONTS.body },
  userOptionTextActive: { color: '#ffe89a' },
  resultsScroll: { flex: 1 },
  resultsScrollContent: { paddingBottom: 18 },
  empty: { color: '#f5f8f0', fontSize: 16, fontFamily: FONTS.body },
  roundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  roundCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 12,
    marginBottom: 10,
  },
  roundCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roundNumber: { color: '#fff6cf', fontSize: 24, fontFamily: FONTS.title },
  expandButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4aa0ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonText: { color: '#fff', fontSize: 18, fontFamily: FONTS.title },
  metricLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 10,
  },
  metricLabel: { color: '#f5f8f0', fontSize: 18, fontFamily: FONTS.body },
  metricValue: { color: '#f5f8f0', fontSize: 18, fontFamily: FONTS.body },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    color: '#1a1a1a',
    fontSize: 24,
    fontFamily: FONTS.title,
    marginBottom: 10,
  },
  modalLine: {
    color: '#333',
    fontSize: 18,
    fontFamily: FONTS.body,
    marginBottom: 6,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    backgroundColor: '#ececec',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButtonText: { color: '#333', fontSize: 16, fontFamily: FONTS.body },
})
