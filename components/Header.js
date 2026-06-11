import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Alert,
  Platform,
  StatusBar,
} from 'react-native'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import apiClient, { setAuthToken } from '../config/apiClient'
import { COLORS, FONTS } from '../src/theme'
import ChalkPanel from './ChalkPanel'

const operations = [
  { key: 'todas', label: 'Todas' },
  { key: 'soma', label: 'Adição' },
  { key: 'menos', label: 'Subtração' },
  { key: 'vezes', label: 'Multiplicação' },
  { key: 'dividir', label: 'Divisão' },
]

const DEFAULT_PERMISSOES = {
  soma: false,
  menos: false,
  vezes: false,
  dividir: false,
  todas: false,
}

function normalizePermissoes(permissoes = {}) {
  const normalized = {
    ...DEFAULT_PERMISSOES,
    ...permissoes,
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

export default function Header({
  onSelectOperation,
  menuItems = null,
  menuTitle = 'Operações',
  activeMenuKey = null,
}) {
  const navigation = useNavigation()
  const isFocused = useIsFocused()
  const [userName, setUserName] = useState('')
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const [permissoes, setPermissoes] = useState(DEFAULT_PERMISSOES)
  const [menuVisible, setMenuVisible] = useState(false)
  const [estrelaCount, setEstrelaCount] = useState(0)
  const [downThumbCount, setDownThumbCount] = useState(0)
  const [nivelCount, setNivelCount] = useState(0)
  const [openOp, setOpenOp] = useState(null)
  const [openInterval, setOpenInterval] = useState(null)
  const [infoModal, setInfoModal] = useState({
    visible: false,
    icon: '💡',
    title: 'Dica',
    message: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        const name = await AsyncStorage.getItem('userName')
        const cachedPermissoes = await AsyncStorage.getItem('userPermissions')
        const cachedGlobalAdmin = await AsyncStorage.getItem('isGlobalAdmin')
        if (cachedPermissoes) {
          setPermissoes(normalizePermissoes(JSON.parse(cachedPermissoes)))
        }
        setIsGlobalAdmin(cachedGlobalAdmin === 'true')
        setUserName(name || 'Usuário')
      } catch {
        setUserName('Usuário')
        setIsGlobalAdmin(false)
      }
      await loadPermissoes()
      await loadPremios()
    })()
  }, [])

  useEffect(() => {
    if (!isFocused) return
    ;(async () => {
      await loadPermissoes()
    })()
  }, [isFocused])

  const loadPermissoes = async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      const userId = await AsyncStorage.getItem('userId')
      if (!token || !userId) return

      setAuthToken(token)
      const headers = { Authorization: `Bearer ${token}` }
      const resp = await apiClient.get(`/auth/login/${userId}`, { headers })
      const nextPermissoes = normalizePermissoes(
        resp?.data?.user?.permissoes || {}
      )
      const nextIsGlobalAdmin = Boolean(resp?.data?.user?.isGlobalAdmin)

      setPermissoes(nextPermissoes)
      setIsGlobalAdmin(nextIsGlobalAdmin)
      await AsyncStorage.setItem(
        'userPermissions',
        JSON.stringify(nextPermissoes)
      )
      await AsyncStorage.setItem(
        'isGlobalAdmin',
        nextIsGlobalAdmin ? 'true' : 'false'
      )
    } catch (error) {
      console.error(
        'Erro ao carregar permissões do menu:',
        error?.response?.data || error.message
      )
    }
  }

  const visibleOperations = operations.filter((op) => {
    if (permissoes.todas) return true
    return Boolean(permissoes[op.key])
  })

  const loadPremios = async () => {
    try {
      const totalAcertos =
        parseInt(await AsyncStorage.getItem('totalAcertos')) || 0
      const totalErros = parseInt(await AsyncStorage.getItem('totalErros')) || 0
      setEstrelaCount(Math.floor(totalAcertos / 10))
      setDownThumbCount(Math.floor(totalErros / 10))
      setNivelCount(Math.floor(Math.floor(totalAcertos / 10) / 10))
    } catch {
      setEstrelaCount(0)
      setDownThumbCount(0)
      setNivelCount(0)
    }
  }

  const toggleOp = (opKey) => {
    setOpenInterval(null)
    setOpenOp((prev) => (prev === opKey ? null : opKey))
  }

  const toggleMenu = () => {
    setMenuVisible((prev) => !prev)
  }

  const selectOperation = (code) => {
    setMenuVisible(false)
    setOpenOp(null)
    setOpenInterval(null)

    if (onSelectOperation) {
      onSelectOperation(code)
      return
    }

    navigation.navigate('Tabuada', {
      selectedOperation: code,
      selectedOperationKey: Date.now(),
    })
  }

  const selectRandomFromInterval = (opKey, inicio, fim) => {
    const n = Math.floor(Math.random() * (fim - inicio + 1)) + inicio
    selectOperation(`${opKey}${String(n).padStart(2, '0')}`)
  }

  const fetchTip = async () => {
    try {
      const resp = await apiClient.get('/tips/random')
      const data = resp?.data || {}
      showInfoModal('💡', 'Dica', data?.tip || 'Sem dicas disponíveis.')
    } catch {
      showInfoModal('💡', 'Dica', 'Erro ao obter dica')
    }
  }

  const showInfoModal = (icon, title, message) => {
    setInfoModal({ visible: true, icon, title, message })
  }

  const closeInfoModal = () => {
    setInfoModal((prev) => ({ ...prev, visible: false }))
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'token',
        'userId',
        'userName',
        'userEmail',
        'userPermissions',
        'userOrganizationName',
        'isGlobalAdmin',
        'totalAcertos',
        'totalJogos',
        'totalErros',
      ])
      setAuthToken(null)
      setMenuVisible(false)
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
    } catch {
      Alert.alert('Erro', 'Não foi possível sair da sessão.')
    }
  }

  const handleCustomMenuItemPress = async (item) => {
    setMenuVisible(false)
    setOpenOp(null)
    setOpenInterval(null)

    if (typeof item?.onPress === 'function') {
      await item.onPress()
    }
  }

  const openAbout = () => {
    setMenuVisible(false)
    setOpenOp(null)
    setOpenInterval(null)
    navigation.navigate('About')
  }

  const openPrivacyPolicy = () => {
    setMenuVisible(false)
    setOpenOp(null)
    setOpenInterval(null)
    navigation.navigate('PrivacyPolicy')
  }

  const openDeleteAccount = () => {
    setMenuVisible(false)
    setOpenOp(null)
    setOpenInterval(null)
    navigation.navigate('DeleteAccount')
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleMenu}
          accessibilityLabel="Abrir menu"
        >
          <View style={styles.hamburger}>
            <View
              style={[
                styles.hamburgerLine,
                menuVisible && styles.hamburgerLineTopOpen,
              ]}
            />
            <View
              style={[
                styles.hamburgerLine,
                menuVisible && styles.hamburgerLineMiddleOpen,
              ]}
            />
            <View
              style={[
                styles.hamburgerLine,
                menuVisible && styles.hamburgerLineBottomOpen,
              ]}
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.logo}>Tabuada</Text>

        <View style={styles.actionsRow}>
          {isGlobalAdmin ? (
            <TouchableOpacity
              style={[
                styles.iconChip,
                styles.iconChipOutline,
                styles.iconChipAdmin,
              ]}
              onPress={() => navigation.navigate('AdminPanel')}
              accessibilityLabel="Abrir painel administrador"
            >
              <Text style={[styles.iconText, styles.iconTextAdmin]}>🛡️</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.iconChip, styles.iconChipOutline]}
            onPress={() => navigation.navigate('Performance')}
          >
            <Text style={styles.iconText}>📈</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconChip, styles.iconChipOutline]}
            onPress={() => navigation.navigate('Permissoes')}
          >
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconChip, styles.iconChipOutline]}
            onPress={fetchTip}
            accessibilityLabel="Abrir dica"
          >
            <Text style={styles.iconText}>💡</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.userWrap}>
          <Text style={styles.userAvatar}>🧒</Text>
          <Text style={styles.userText} numberOfLines={1}>
            Olá, {userName}
          </Text>
        </View>

        <View style={styles.scoreWrap}>
          <TouchableOpacity
            style={styles.scoreItem}
            accessibilityLabel="Ver estrelas"
            onPress={() =>
              showInfoModal(
                '⭐',
                'Estrelas',
                'A cada 10 acertos você ganha 1 estrelinha.'
              )
            }
          >
            <Text style={styles.scoreEmoji}>⭐</Text>
            <Text style={styles.scoreText}>{estrelaCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scoreItem}
            accessibilityLabel="Ver falhas"
            onPress={() =>
              showInfoModal(
                '👎',
                'Falhas',
                'A cada 10 erros você ganha 1 "dedão para baixo".'
              )
            }
          >
            <Text style={styles.scoreEmoji}>👎</Text>
            <Text style={styles.scoreText}>{downThumbCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scoreItem}
            accessibilityLabel="Ver calculadora"
            onPress={() =>
              showInfoModal(
                '🧮',
                'Calculadora',
                'A cada 10 estrelas você ganha 1 calculadora; cada calculadora libera um novo nível.'
              )
            }
          >
            <Image
              source={require('../assets/images/calculadora.png')}
              style={styles.scoreCalcIcon}
            />
            <Text style={styles.scoreText}>{nivelCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal transparent visible={menuVisible} animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={toggleMenu} />
        <View style={styles.modalScroll}>
          <Text style={styles.modalTitle}>{menuTitle}</Text>
          {menuItems ? (
            <>
              <View style={styles.customMenuList}>
                {menuItems.map((item) => {
                  const active = activeMenuKey === item.key
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.customMenuItem,
                        active && styles.customMenuItemActive,
                        item.danger && styles.customMenuItemDanger,
                      ]}
                      onPress={() => handleCustomMenuItemPress(item)}
                    >
                      <Text
                        style={[
                          styles.customMenuItemText,
                          active && styles.customMenuItemTextActive,
                          item.danger && styles.customMenuItemTextDanger,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              {activeMenuKey !== 'about' ? (
                <>
                  <View style={styles.customMenuDivider} />
                  <TouchableOpacity
                    style={styles.customMenuItem}
                    onPress={openAbout}
                  >
                    <Text style={styles.customMenuItemText}>
                      Sobre o aplicativo
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
              <TouchableOpacity
                style={styles.customMenuItem}
                onPress={openPrivacyPolicy}
              >
                <Text style={styles.customMenuItemText}>
                  Política de privacidade
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customMenuItem, styles.customMenuItemDanger]}
                onPress={openDeleteAccount}
              >
                <Text
                  style={[
                    styles.customMenuItemText,
                    styles.customMenuItemTextDanger,
                  ]}
                >
                  Excluir minha conta
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {visibleOperations.map((op) => (
                <View key={op.key} style={styles.opBlock}>
                  <TouchableOpacity
                    style={styles.opHeader}
                    onPress={() => toggleOp(op.key)}
                  >
                    <Text style={styles.opHeaderText}>{op.label}</Text>
                  </TouchableOpacity>

                  {openOp === op.key && (
                    <View style={styles.intervalList}>
                      {Array.from({
                        length: Math.min(10, Math.max(1, nivelCount + 1)),
                      }).map((_, idx) => {
                        const inicio = idx * 10 + 1
                        const fim = Math.min((idx + 1) * 10, 100)
                        const intervalKey = `${op.key}-${inicio}-${fim}`
                        const intervalOpen = openInterval === intervalKey
                        return (
                          <View
                            key={`${op.key}-${fim}`}
                            style={styles.intervalBlock}
                          >
                            <TouchableOpacity
                              style={styles.intervalButton}
                              onPress={() =>
                                setOpenInterval((prev) =>
                                  prev === intervalKey ? null : intervalKey
                                )
                              }
                              accessibilityLabel={`Abrir intervalo ${op.label} ${inicio} - ${fim}`}
                            >
                              <Text
                                style={styles.intervalText}
                              >{`${inicio} - ${fim}`}</Text>
                              <Text style={styles.intervalArrow}>
                                {intervalOpen ? '⌃' : '⌄'}
                              </Text>
                            </TouchableOpacity>

                            {intervalOpen && (
                              <View style={styles.intervalNumbers}>
                                {Array.from({ length: fim - inicio + 1 }).map(
                                  (__, j) => {
                                    const num = inicio + j
                                    return (
                                      <TouchableOpacity
                                        key={`num-${op.key}-${num}`}
                                        style={styles.numberBtn}
                                        onPress={() =>
                                          selectOperation(
                                            `${op.key}${String(num).padStart(2, '0')}`
                                          )
                                        }
                                      >
                                        <Text style={styles.numberText}>
                                          {String(num).padStart(2, '0')}
                                        </Text>
                                      </TouchableOpacity>
                                    )
                                  }
                                )}
                                <TouchableOpacity
                                  style={[styles.numberBtn, styles.randomBtn]}
                                  onPress={() =>
                                    selectRandomFromInterval(
                                      op.key,
                                      inicio,
                                      fim
                                    )
                                  }
                                  accessibilityLabel={`Aleatório ${op.label} ${inicio} - ${fim}`}
                                >
                                  <Text style={styles.randomIcon}>↻</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )
                      })}
                    </View>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.customMenuItem}
                onPress={openAbout}
              >
                <Text style={styles.customMenuItemText}>
                  Sobre o aplicativo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.customMenuItem}
                onPress={openPrivacyPolicy}
              >
                <Text style={styles.customMenuItemText}>
                  Política de privacidade
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customMenuItem, styles.customMenuItemDanger]}
                onPress={openDeleteAccount}
              >
                <Text
                  style={[
                    styles.customMenuItemText,
                    styles.customMenuItemTextDanger,
                  ]}
                >
                  Excluir minha conta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Sair</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      <Modal transparent visible={infoModal.visible} animationType="fade">
        <View style={styles.tipOverlay}>
          <ChalkPanel style={styles.tipFrame} boardStyle={styles.tipBoard}>
            <View style={styles.tipFlagsRow}>
              <Text style={styles.tipFlag}>▲</Text>
              <Text style={styles.tipFlag}>●</Text>
              <Text style={styles.tipFlag}>■</Text>
              <Text style={styles.tipFlag}>●</Text>
              <Text style={styles.tipFlag}>▲</Text>
            </View>
            <Text style={styles.tipBadge}>{infoModal.icon}</Text>
            <Text style={styles.tipTitle}>{infoModal.title}</Text>
            <Text style={styles.tipMessage}>{infoModal.message}</Text>
            <TouchableOpacity
              style={styles.tipOkButton}
              onPress={closeInfoModal}
            >
              <Text style={styles.tipOkText}>OK</Text>
            </TouchableOpacity>
          </ChalkPanel>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f5a43',
    borderBottomWidth: 2,
    borderBottomColor: '#e7d3a8',
    paddingHorizontal: 10,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 4 : 12,
    paddingBottom: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburger: {
    width: 20,
    height: 15,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    height: 3,
    borderRadius: 3,
    backgroundColor: COLORS.chalkText,
  },
  hamburgerLineTopOpen: { transform: [{ translateY: 6 }, { rotate: '45deg' }] },
  hamburgerLineMiddleOpen: { opacity: 0 },
  hamburgerLineBottomOpen: {
    transform: [{ translateY: -6 }, { rotate: '-45deg' }],
  },
  logo: {
    color: '#f3f8de',
    fontSize: 36,
    fontFamily: FONTS.title,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconChipBlue: { backgroundColor: '#2f8fd7' },
  iconChipGreen: { backgroundColor: '#62a847' },
  iconChipOutline: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.65)',
  },
  iconChipAdmin: {
    backgroundColor: 'rgba(255,214,90,0.16)',
    borderColor: '#ffd54f',
    shadowColor: '#ffd54f',
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  iconChipYellow: { backgroundColor: '#d7b12e' },
  iconText: { fontSize: 22 },
  iconTextAdmin: { fontSize: 23 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  userWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '52%',
  },
  userAvatar: {
    fontSize: 20,
    marginRight: 4,
  },
  userText: {
    color: '#f2f2f2',
    fontSize: 18,
    fontFamily: FONTS.body,
  },
  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  scoreEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  scoreCalcIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
    resizeMode: 'contain',
  },
  scoreText: {
    fontSize: 19,
    color: '#ffe082',
    fontFamily: FONTS.body,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalScroll: {
    position: 'absolute',
    left: 8,
    top: 64,
    backgroundColor: COLORS.chalkboard,
    width: 320,
    maxHeight: '80%',
    borderRadius: 8,
    padding: 12,
    elevation: 6,
    borderTopLeftRadius: 2,
    borderWidth: 2,
    borderColor: COLORS.chalkBorder,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: COLORS.chalkText,
  },
  customMenuList: {
    gap: 8,
  },
  customMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginVertical: 10,
  },
  customMenuItem: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  customMenuItemActive: {
    backgroundColor: 'rgba(255,214,90,0.16)',
    borderColor: '#ffd54f',
  },
  customMenuItemDanger: {
    backgroundColor: 'rgba(210,88,88,0.14)',
    borderColor: 'rgba(233,124,124,0.55)',
  },
  customMenuItemText: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  customMenuItemTextActive: {
    color: '#fff7cf',
  },
  customMenuItemTextDanger: {
    color: '#ffd7d7',
  },
  opBlock: { marginBottom: 12 },
  opHeader: { paddingVertical: 6 },
  opHeaderText: {
    fontSize: 18,
    fontFamily: FONTS.title,
    color: COLORS.chalkText,
  },
  intervalList: { paddingLeft: 6 },
  intervalBlock: { marginBottom: 8 },
  intervalButton: {
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intervalText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.chalkText,
  },
  intervalArrow: {
    color: COLORS.chalkText,
    fontFamily: FONTS.title,
    fontSize: 16,
    marginLeft: 8,
  },
  intervalNumbers: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  numberBtn: {
    margin: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontSize: 12, color: COLORS.chalkText },
  randomBtn: {
    padding: 0,
  },
  randomIcon: {
    color: COLORS.chalkText,
    fontSize: 14,
    lineHeight: 16,
    fontFamily: FONTS.title,
  },
  logoutButton: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  logoutButtonText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: '#ff7f7f',
  },
  tipOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
    padding: 18,
  },
  tipFrame: {
    width: '90%',
    maxWidth: 430,
    backgroundColor: 'transparent',
  },
  tipBoard: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    alignItems: 'center',
  },
  tipFlagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '86%',
    opacity: 0.45,
    marginBottom: 4,
  },
  tipFlag: {
    color: COLORS.chalkText,
    fontSize: 11,
  },
  tipBadge: {
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
  tipTitle: {
    color: COLORS.chalkText,
    fontFamily: FONTS.title,
    fontSize: 30,
    textAlign: 'center',
  },
  tipMessage: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  tipOkButton: {
    minWidth: 140,
    borderRadius: 8,
    backgroundColor: '#72c35f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
  },
  tipOkText: {
    color: '#fff',
    fontFamily: FONTS.body,
    fontSize: 18,
  },
})
