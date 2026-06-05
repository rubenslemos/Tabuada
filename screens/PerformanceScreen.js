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
  Image,
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

        if (me && (me.tipo === 'Professor' || me.tipo === 'Coordenador')) {
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

    if (loggedUser.tipo === 'Professor') {
      return usersList
        .filter((u) => u.tipo === 'Aluno' && u.turma === loggedUser.turma)
        .find((u) => (u._id || u.id) === selectedUserId)
    }

    if (loggedUser.tipo === 'Coordenador') {
      return usersList.find((u) => (u._id || u.id) === selectedUserId)
    }

    return loggedUser
  }, [loggedUser, selectedUserId, usersList])

  const selectableUsers = useMemo(() => {
    if (!loggedUser) return []

    const meId = loggedUser._id || loggedUser.id
    const meOption = [{ id: meId, label: `Logado: ${loggedUser.name}` }]

    if (loggedUser.tipo === 'Professor') {
      const turmaUsers = usersList
        .filter((u) => u.tipo === 'Aluno' && u.turma === loggedUser.turma)
        .map((u) => ({ id: u._id || u.id, label: u.name }))
      return [...meOption, ...turmaUsers]
    }

    if (loggedUser.tipo === 'Coordenador') {
      const all = usersList.map((u) => ({ id: u._id || u.id, label: u.name }))
      return [...meOption, ...all]
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
    'Selecione um usuário'
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
                        key={String(item._id || item.id || index)}
                        style={[styles.roundCard, { width: roundCardWidth }]}
                      >
                        <View style={styles.roundCardHeader}>
                          <Text style={styles.roundTitle}>#{index + 1}</Text>
                          <TouchableOpacity
                            style={styles.detailsMiniBtn}
                            onPress={() => openRoundDetails(item, index)}
                            accessibilityLabel={`Detalhes da rodada ${index + 1}`}
                          >
                            <Text style={styles.detailsMiniText}>＋</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.roundStatsBox}>
                          <View style={styles.roundStatRow}>
                            <Text style={styles.roundStatLabel}>Jogadas</Text>
                            <Text style={styles.roundStatValue}>
                              {item.jogou || 0}
                            </Text>
                            <Text style={styles.roundStatArrow} />
                            <Text style={styles.roundPercentValue} />
                          </View>
                          <View style={styles.roundStatRow}>
                            <Text style={styles.roundStatLabel}>Acertos</Text>
                            <Text style={styles.roundStatValue}>
                              {item.acerto || 0}
                            </Text>
                          </View>
                          <View style={styles.roundStatRow}>
                            <Text style={styles.roundStatLabel}>Erros</Text>
                            <Text style={styles.roundStatValue}>
                              {item.errou || 0}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              )}
            </ScrollView>
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
          </View>
        </ChalkPanel>
      </View>

      <Modal
        visible={detailsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailsVisible(false)}
        >
          <Pressable onPress={(event) => event.stopPropagation()}>
            <ChalkPanel
              style={styles.modalFrame}
              boardStyle={styles.modalBoard}
            >
              <View style={styles.modalFlagsRow}>
                <Text style={styles.modalFlag}>▲</Text>
                <Text style={styles.modalFlag}>●</Text>
                <Text style={styles.modalFlag}>■</Text>
                <Text style={styles.modalFlag}>●</Text>
                <Text style={styles.modalFlag}>▲</Text>
              </View>
              <Text style={styles.modalBadge}>📊</Text>
              <Text style={styles.modalTitle}>
                Detalhes Rodada {details?.index}
              </Text>

              <View style={styles.modalStatsBox}>
                <View style={styles.modalLine}>
                  <Text style={styles.modalLineLabel}>Adição</Text>
                  <Text style={styles.modalLineValue}>
                    {details?.faPlus ?? 0}
                  </Text>
                </View>
                <View style={styles.modalLine}>
                  <Text style={styles.modalLineLabel}>Subtração</Text>
                  <Text style={styles.modalLineValue}>
                    {details?.faMinus ?? 0}
                  </Text>
                </View>
                <View style={styles.modalLine}>
                  <Text style={styles.modalLineLabel}>Multiplicação</Text>
                  <Text style={styles.modalLineValue}>
                    {details?.faTimes ?? 0}
                  </Text>
                </View>
                <View style={styles.modalLine}>
                  <Text style={styles.modalLineLabel}>Divisão</Text>
                  <Text style={styles.modalLineValue}>
                    {details?.faDivide ?? 0}
                  </Text>
                </View>
                <View style={styles.modalDivider} />
                <View style={styles.modalLine}>
                  <Text style={styles.modalLineLabel}>Acertos (%)</Text>
                  <Text style={[styles.modalLineValue, styles.modalGoodValue]}>
                    {details?.acertosPercent ?? 0}
                  </Text>
                </View>
                <View style={styles.modalLine}>
                  <Text style={styles.modalLineLabel}>Erros (%)</Text>
                  <Text style={[styles.modalLineValue, styles.modalBadValue]}>
                    {details?.errosPercent ?? 0}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailsVisible(false)}
              >
                <Text style={styles.closeBtnText}>Fechar</Text>
              </TouchableOpacity>
            </ChalkPanel>
          </Pressable>
        </Pressable>
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
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 34,
  },
  panel: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  panelBoard: {
    flex: 1,
    paddingBottom: 8,
  },
  boardContent: { flex: 1 },
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
  userDropdownWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  userDropdownButton: {
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
  userDropdownLabelWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  userDropdownCaption: {
    color: '#ffd54f',
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 16,
  },
  userDropdownText: {
    color: '#f8f8f8',
    fontFamily: FONTS.body,
    fontSize: 17,
    lineHeight: 22,
  },
  userDropdownArrow: {
    color: '#f8f8f8',
    fontFamily: FONTS.title,
    fontSize: 22,
    lineHeight: 24,
  },
  userDropdownList: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: '#174d3b',
    overflow: 'hidden',
  },
  userOptionsScroll: {
    maxHeight: 190,
  },
  userOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  userOptionActive: {
    backgroundColor: '#ffd54f',
  },
  userOptionText: {
    color: '#f8f8f8',
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  userOptionTextActive: { color: '#1f1f1f' },
  empty: {
    fontFamily: FONTS.body,
    color: '#f8f8f8',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsScrollContent: {
    paddingBottom: 4,
  },
  roundGrid: {
    paddingHorizontal: 14,
    paddingTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roundCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 8,
    marginBottom: 10,
  },
  roundCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  roundTitle: {
    fontFamily: FONTS.title,
    color: '#ffd54f',
    fontSize: 19,
  },
  detailsMiniBtn: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#46a3e5',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  detailsMiniText: {
    color: '#fff',
    fontFamily: FONTS.title,
    fontSize: 24,
    lineHeight: 25,
    transform: [{ translateY: -1 }],
  },
  roundStatsBox: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 7,
  },
  roundStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 21,
  },
  roundStatLabel: {
    fontFamily: FONTS.body,
    color: '#f8f8f8',
    fontSize: 14,
    lineHeight: 20,
    width: 58,
  },
  roundStatValue: {
    fontFamily: FONTS.body,
    color: '#f8f8f8',
    fontSize: 14,
    lineHeight: 20,
    width: 28,
    textAlign: 'right',
  },
  roundStatArrow: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    width: 22,
    textAlign: 'center',
  },
  roundPercentValue: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    width: 42,
    textAlign: 'right',
  },
  percentGood: { color: '#8ddf6f' },
  percentBad: { color: '#ff7a70' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalFrame: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: 'transparent',
  },
  modalBoard: {
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
    color: '#f8f8f8',
    fontSize: 11,
  },
  modalBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,213,79,0.9)',
    color: '#ffd54f',
    fontSize: 30,
    lineHeight: 54,
    textAlign: 'center',
    fontFamily: FONTS.title,
    marginTop: 6,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: FONTS.title,
    color: '#f8f8f8',
    fontSize: 27,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalStatsBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.13)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  modalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalLineLabel: {
    fontFamily: FONTS.body,
    color: '#f8f8f8',
    fontSize: 17,
  },
  modalLineValue: {
    fontFamily: FONTS.body,
    color: '#ffd54f',
    fontSize: 17,
  },
  modalGoodValue: {
    color: '#8ddf6f',
  },
  modalBadValue: {
    color: '#ff7a70',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginVertical: 6,
  },
  closeBtn: {
    marginTop: 14,
    alignSelf: 'center',
    minWidth: 140,
    backgroundColor: '#72c35f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: FONTS.body,
    color: '#fff',
    fontSize: 18,
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
