import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import apiClient, { setAuthToken } from '../config/apiClient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Header from '../components/Header'
import { COLORS, FONTS } from '../src/theme'
import { getErrorMessage } from '../utils/errorMessage'
import { generateQuestion } from '../utils/tabuada'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'

const TabuadaScreen = ({ navigation, route }) => {
  const [numerador, setNumerador] = useState(1)
  const [denominador, setDenominador] = useState(1)
  const [operacao, setOperacao] = useState('+')
  const [resposta, setResposta] = useState('')
  const [resultadoCorreto, setResultadoCorreto] = useState(0)
  const [acerto, setAcerto] = useState(0)
  const [errou, setErrou] = useState(0)
  const [jogou, setJogou] = useState(0)

  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)
  const [storedTotals, setStoredTotals] = useState({
    totalJogos: 0,
    totalAcertos: 0,
    totalErros: 0,
  })

  useEffect(() => {
    gerarPergunta()
    ;(async () => {
      try {
        const t = await AsyncStorage.getItem('token')
        const uid = await AsyncStorage.getItem('userId')
        const totalAcertos =
          parseInt(await AsyncStorage.getItem('totalAcertos')) || 0
        const totalJogos =
          parseInt(await AsyncStorage.getItem('totalJogos')) || 0
        const totalErros =
          parseInt(await AsyncStorage.getItem('totalErros')) || 0
        const userName = await AsyncStorage.getItem('userName')
        if (t) {
          setToken(t)
          setAuthToken(t)
        }
        if (uid) setUserId(uid)
        setStoredTotals({ totalJogos, totalAcertos, totalErros })
        if (userName) await AsyncStorage.setItem('userName', userName)
      } catch (err) {
        console.error('Error loading stored totals:', err)
      }
    })()
  }, [])

  useEffect(() => {
    const selectedOperation = route?.params?.selectedOperation
    if (!selectedOperation) return

    setOperacao(selectedOperation)
    gerarPergunta(selectedOperation)
  }, [route?.params?.selectedOperation, route?.params?.selectedOperationKey])

  const gerarPergunta = (forcedOp) => {
    const q = generateQuestion(forcedOp)
    setNumerador(q.num1)
    setDenominador(q.num2)
    setOperacao(q.opSymbol)
    setResultadoCorreto(q.result)
  }

  const [resultModalVisible, setResultModalVisible] = useState(false)
  const [lastResultCorrect, setLastResultCorrect] = useState(false)

  const verificarResposta = () => {
    const resp = parseInt(resposta)
    if (resp === resultadoCorreto) {
      setAcerto((prev) => prev + 1)
      setLastResultCorrect(true)
    } else {
      setErrou((prev) => prev + 1)
      setLastResultCorrect(false)
    }
    setJogou((prev) => prev + 1)
    setResposta('')
    setResultModalVisible(true)
  }

  const enviarResultados = async () => {
    try {
      const newTotalJogos = storedTotals.totalJogos + jogou
      const newTotalAcertos = storedTotals.totalAcertos + acerto
      const newTotalErros = storedTotals.totalErros + errou

      const payload = {
        acerto,
        errou,
        jogou,
        userId,
        totalJogos: newTotalJogos,
        totalAcertos: newTotalAcertos,
        totalErros: newTotalErros,
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await apiClient.post('/round', payload, { headers })

      // update stored totals
      await AsyncStorage.setItem('totalJogos', String(newTotalJogos))
      await AsyncStorage.setItem('totalAcertos', String(newTotalAcertos))
      await AsyncStorage.setItem('totalErros', String(newTotalErros))

      Alert.alert('Resultados enviados!')
      navigation.goBack()
    } catch (error) {
      console.error(
        'Enviar resultados error:',
        error?.response?.data || error.message
      )
      Alert.alert('Erro', getErrorMessage(error, 'Erro ao enviar resultados'))
    }
  }

  return (
    <ClassroomBackground stripeTop={120}>
      <Header
        onSelectOperation={(op) => {
          setOperacao(op)
          gerarPergunta(op)
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.h1}>Qual o valor?</Text>
          <ChalkPanel style={styles.tabuada} boardStyle={styles.tabuadaBoard}>
            <Image
              source={require('../assets/images/estrela.png')}
              style={[styles.sideSticker, styles.leftSticker]}
            />
            <Image
              source={require('../assets/images/calculadora.png')}
              style={[styles.sideSticker, styles.rightSticker]}
            />
            <View style={styles.flagsRow}>
              <Text style={styles.flag}>▲</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>■</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>▲</Text>
            </View>
            <Text style={[styles.cornerStar, styles.starTopLeft]}>✦</Text>
            <Text style={[styles.cornerStar, styles.starTopRight]}>✦</Text>
            <View style={styles.coreBlock}>
              <View style={styles.conta}>
                <View style={styles.numBox}>
                  <Text style={styles.numText}>{numerador}</Text>
                </View>
                <View style={styles.opBox}>
                  <Text style={styles.opText}>{operacao}</Text>
                </View>
                <View style={styles.numBox}>
                  <Text style={styles.numText}>{denominador}</Text>
                </View>
              </View>
              <Text style={styles.answerLabel}>Resposta</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={resposta}
                onChangeText={setResposta}
                onSubmitEditing={verificarResposta}
                returnKeyType="done"
              />
            </View>
          </ChalkPanel>
          <View style={styles.cardsRow}>
            <TouchableOpacity
              style={[styles.actionCard, styles.verifyCard]}
              onPress={verificarResposta}
            >
              <View style={[styles.cardPin, styles.pinGreen]} />
              <Text style={styles.cardIcon}>✓</Text>
              <Text style={styles.cardText}>Verificar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, styles.finalCard]}
              onPress={enviarResultados}
            >
              <View style={[styles.cardPin, styles.pinRed]} />
              <Text style={styles.cardIcon}>⚑</Text>
              <Text style={styles.cardText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scoreBoard}>
            <View style={styles.scoreBoardInner}>
              <View style={styles.scoreLine}>
                <Text style={[styles.scoreText, styles.scoreGreen]}>
                  Acertos: {acerto}
                </Text>
                <Text style={styles.scoreSeparator}>|</Text>
                <Text style={[styles.scoreText, styles.scoreRed]}>
                  Erros: {errou}
                </Text>
                <Text style={styles.scoreSeparator}>|</Text>
                <Text style={[styles.scoreText, styles.scoreBlue]}>
                  Jogadas: {jogou}
                </Text>
              </View>
            </View>
          </View>
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
            <Image
              source={require('../assets/images/enquete.png')}
              style={styles.footerIcon}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={resultModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ChalkPanel
            style={styles.resultModalFrame}
            boardStyle={styles.resultModalBoard}
          >
            <View style={styles.modalFlagsRow}>
              <Text style={styles.modalFlag}>▲</Text>
              <Text style={styles.modalFlag}>●</Text>
              <Text style={styles.modalFlag}>■</Text>
              <Text style={styles.modalFlag}>●</Text>
              <Text style={styles.modalFlag}>▲</Text>
            </View>
            <Text style={styles.resultSticker}>
              {lastResultCorrect ? '✓' : '✕'}
            </Text>
            <Text style={styles.resultTitle}>
              {lastResultCorrect ? 'Correto!' : 'Errado!'}
            </Text>
            <Text style={styles.resultSubtitle}>
              {lastResultCorrect
                ? 'Mandou bem, continue assim!'
                : 'Quase lá, vamos tentar outra.'}
            </Text>
            {!lastResultCorrect && (
              <Text style={styles.resultDetail}>
                Resposta correta: {resultadoCorreto}
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCardButton, styles.retryModalButton]}
                onPress={() => {
                  setResultModalVisible(false)
                  gerarPergunta(operacao)
                }}
              >
                <Text style={styles.modalButtonIcon}>↻</Text>
                <Text style={styles.modalButtonText}>Refazer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCardButton, styles.nextModalButton]}
                onPress={() => {
                  setResultModalVisible(false)
                  gerarPergunta(operacao)
                }}
              >
                <Text style={styles.modalButtonIcon}>→</Text>
                <Text style={styles.modalButtonText}>Próxima</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCardButton, styles.finishModalButton]}
                onPress={() => {
                  setResultModalVisible(false)
                  enviarResultados()
                }}
              >
                <Text style={styles.modalButtonIcon}>⚑</Text>
                <Text style={styles.modalButtonText}>Finalizar</Text>
              </TouchableOpacity>
            </View>
          </ChalkPanel>
        </View>
      </Modal>
    </ClassroomBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  h1: {
    fontSize: 48,
    fontFamily: FONTS.title,
    color: '#2f7a57',
    marginBottom: 8,
  },
  tabuada: {
    width: '96%',
    maxWidth: 720,
    padding: 0,
    borderRadius: 10,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  tabuadaBoard: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: 'center',
    minHeight: 288,
  },
  coreBlock: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 0,
  },
  flagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '88%',
    marginBottom: 6,
    opacity: 0.45,
  },
  flag: {
    color: COLORS.chalkText,
    fontSize: 12,
  },
  cornerStar: {
    position: 'absolute',
    color: COLORS.chalkText,
    fontSize: 22,
    opacity: 0.75,
  },
  starTopLeft: { top: 20, left: 12 },
  starTopRight: { top: 20, right: 12 },
  conta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  numBox: {
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  numText: { fontSize: 64, fontFamily: FONTS.title, color: COLORS.chalkText },
  opBox: { minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  opText: { fontSize: 58, fontFamily: FONTS.body, color: COLORS.chalkText },
  answerLabel: {
    alignSelf: 'center',
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    marginBottom: 8,
    fontSize: 19,
  },
  input: {
    height: 60,
    borderColor: COLORS.chalkBorder,
    borderWidth: 2,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontSize: 34,
    textAlign: 'center',
    width: '76%',
    color: COLORS.chalkText,
  },
  button: {
    backgroundColor: '#66bb6a',
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 10,
    minWidth: 240,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  finalizarButton: {
    backgroundColor: COLORS.accentYellow,
  },
  buttonText: {
    color: '#1f1f1f',
    fontSize: 24,
    fontFamily: FONTS.body,
  },
  totals: {
    marginTop: 6,
    marginBottom: 4,
    fontFamily: FONTS.body,
    color: COLORS.chalkText,
    fontSize: 22,
  },
  cardsRow: {
    marginTop: 12,
    width: '96%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionCard: {
    flex: 1,
    borderRadius: 8,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  verifyCard: { backgroundColor: '#72c35f' },
  nextCard: { backgroundColor: '#4aa7ea' },
  finalCard: { backgroundColor: '#e36262' },
  cardPin: {
    position: 'absolute',
    top: -7,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.28)',
  },
  pinGreen: { backgroundColor: '#3f8d39' },
  pinBlue: { backgroundColor: '#2f6e9e' },
  pinRed: { backgroundColor: '#9f3c3c' },
  cardIcon: {
    color: '#fff',
    fontSize: 22,
    fontFamily: FONTS.title,
    lineHeight: 24,
  },
  cardText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.body,
  },
  scoreBoard: {
    marginTop: 10,
    width: '96%',
    backgroundColor: '#183321',
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#d4deca',
    padding: 2,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  scoreBoardInner: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#1f3a2a',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  scoreLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreText: {
    fontSize: 17,
    textAlign: 'center',
    fontFamily: FONTS.title,
  },
  scoreGreen: { color: '#6fc247' },
  scoreRed: { color: '#e0514f' },
  scoreBlue: { color: '#43aee8' },
  scoreSeparator: { color: '#d3ddc8' },
  footerDecor: {
    marginTop: 10,
    width: '96%',
    paddingVertical: 6,
    borderTopWidth: 2,
    borderTopColor: 'rgba(120,72,32,0.5)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  chalkDoodlesRow: {
    marginTop: 10,
    width: '92%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 0.4,
  },
  chalkDoodle: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  sideSticker: {
    position: 'absolute',
    width: 28,
    height: 28,
    resizeMode: 'contain',
    opacity: 0.8,
  },
  leftSticker: {
    left: 8,
    top: 54,
  },
  rightSticker: {
    right: 8,
    top: 54,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
    padding: 18,
  },
  resultModalFrame: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: 'transparent',
  },
  resultModalBoard: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: 'center',
  },
  modalFlagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '86%',
    opacity: 0.45,
    marginBottom: 2,
  },
  modalFlag: {
    color: COLORS.chalkText,
    fontSize: 11,
  },
  resultSticker: {
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
  resultTitle: {
    fontSize: 30,
    fontFamily: FONTS.title,
    textAlign: 'center',
    color: COLORS.chalkText,
  },
  resultSubtitle: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    textAlign: 'center',
    fontSize: 17,
    marginTop: 4,
  },
  resultDetail: {
    fontSize: 19,
    textAlign: 'center',
    marginTop: 8,
    color: '#ffd54f',
    fontFamily: FONTS.body,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
    gap: 8,
  },
  modalCardButton: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  retryModalButton: {
    backgroundColor: '#72c35f',
  },
  nextModalButton: {
    backgroundColor: '#4aa7ea',
  },
  finishModalButton: {
    backgroundColor: '#e36262',
  },
  modalButtonIcon: {
    color: '#fff',
    fontFamily: FONTS.title,
    fontSize: 24,
    lineHeight: 26,
  },
  modalButtonText: {
    color: '#fff',
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  btn: { padding: 10, backgroundColor: COLORS.accentBlue, borderRadius: 8 },
  btnText: { fontSize: 16, color: '#fff' },
})

export default TabuadaScreen
