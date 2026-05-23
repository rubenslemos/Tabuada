import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, ImageBackground, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';
import Header from '../components/Header';
import { COLORS, FONTS } from '../src/theme';

const TabuadaScreen = ({ navigation }) => {
  const [numerador, setNumerador] = useState(1);
  const [denominador, setDenominador] = useState(1);
  const [operacao, setOperacao] = useState('+');
  const [resposta, setResposta] = useState('');
  const [resultadoCorreto, setResultadoCorreto] = useState(0);
  const [acerto, setAcerto] = useState(0);
  const [errou, setErrou] = useState(0);
  const [jogou, setJogou] = useState(0);

  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [storedTotals, setStoredTotals] = useState({ totalJogos: 0, totalAcertos: 0, totalErros: 0 });

  useEffect(() => {
    gerarPergunta();
    (async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        const uid = await AsyncStorage.getItem('userId');
        const totalAcertos = parseInt(await AsyncStorage.getItem('totalAcertos')) || 0;
        const totalJogos = parseInt(await AsyncStorage.getItem('totalJogos')) || 0;
        const totalErros = parseInt(await AsyncStorage.getItem('totalErros')) || 0;
        const userName = await AsyncStorage.getItem('userName');
        if (t) {
          setToken(t);
          axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        }
        if (uid) setUserId(uid);
        setStoredTotals({ totalJogos, totalAcertos, totalErros });
        if (userName) await AsyncStorage.setItem('userName', userName);
      } catch (err) {
        console.error('Error loading stored totals:', err);
      }
    })();
  }, []);

  const gerarPergunta = (forcedOp) => {
    // parse forcedOp forms: e.g. 'soma', 'soma05', 'soma10' (interval), 'todas'
    const opsMap = {
      soma: '+',
      menos: '-',
      vezes: 'X',
      dividir: '/',
      todas: null,
    };

    // defaults
    const allowed = ['+', '-', 'X', '/'];
    let opSymbol = null;

    // random defaults
    let num1 = Math.floor(Math.random() * 10) + 1;
    let num2 = Math.floor(Math.random() * 10) + 1;

    if (forcedOp) {
      const m = forcedOp.match(/^(soma|menos|vezes|dividir|todas)(\d+)?$/);
      if (m) {
        const tipo = m[1];
        const suffix = m[2];
        opSymbol = opsMap[tipo] || allowed[Math.floor(Math.random() * allowed.length)];

        if (suffix) {
          const maxDen = parseInt(suffix, 10);
          // choose a denominator within 1..maxDen
          num2 = Math.floor(Math.random() * Math.max(1, maxDen)) + 1;
          // make numerator adjusted for division if needed
          if (opSymbol === '/') {
            num1 = num2 * (Math.floor(Math.random() * 10) + 1);
          } else if (opSymbol === '-') {
            // ensure positive results for subtraction
            num1 = Math.max(num2, Math.floor(Math.random() * Math.max(1, maxDen)) + 1);
          } else {
            num1 = Math.floor(Math.random() * Math.max(1, maxDen)) + 1;
          }
        } else if (tipo === 'todas') {
          // choose a random operation
          opSymbol = allowed[Math.floor(Math.random() * allowed.length)];
          num1 = Math.floor(Math.random() * 10) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
        } else {
          // specific op without suffix => random small numbers
          num1 = Math.floor(Math.random() * 10) + 1;
          num2 = Math.floor(Math.random() * 10) + 1;
        }
      } else {
        // unknown format, fallback to random
        opSymbol = allowed[Math.floor(Math.random() * allowed.length)];
      }
    } else {
      opSymbol = allowed[Math.floor(Math.random() * allowed.length)];
    }

    setNumerador(num1);
    setDenominador(num2);
    setOperacao(opSymbol);

    switch (opSymbol) {
      case '+': setResultadoCorreto(num1 + num2); break;
      case '-': setResultadoCorreto(num1 - num2); break;
      case 'X': setResultadoCorreto(num1 * num2); break;
      case '/': setResultadoCorreto(Math.floor(num1 / num2)); break;
      default: setResultadoCorreto(num1 + num2); break;
    }
  };

  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [lastResultCorrect, setLastResultCorrect] = useState(false);

  const verificarResposta = () => {
    const resp = parseInt(resposta);
    if (resp === resultadoCorreto) {
      setAcerto(prev => prev + 1);
      setLastResultCorrect(true);
    } else {
      setErrou(prev => prev + 1);
      setLastResultCorrect(false);
    }
    setJogou(prev => prev + 1);
    setResposta('');
    setResultModalVisible(true);
  };

  const enviarResultados = async () => {
    try {
      const newTotalJogos = storedTotals.totalJogos + jogou;
      const newTotalAcertos = storedTotals.totalAcertos + acerto;
      const newTotalErros = storedTotals.totalErros + errou;

      const payload = {
        acerto,
        errou,
        jogou,
        userId,
        totalJogos: newTotalJogos,
        totalAcertos: newTotalAcertos,
        totalErros: newTotalErros,
      };

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_BASE_URL}/round`, payload, { headers });

      // update stored totals
      await AsyncStorage.setItem('totalJogos', String(newTotalJogos));
      await AsyncStorage.setItem('totalAcertos', String(newTotalAcertos));
      await AsyncStorage.setItem('totalErros', String(newTotalErros));

      Alert.alert('Resultados enviados!');
      navigation.goBack();
    } catch (error) {
      console.error('Enviar resultados error:', error?.response?.data || error.message);
      Alert.alert('Erro ao enviar resultados');
    }
  };

  return (
    <ImageBackground source={require('../assets/images/math2.jpg')} style={styles.bg} resizeMode="cover">
      <Header onSelectOperation={(op)=>{ setOperacao(op); gerarPergunta(op); }} />
      <View style={styles.content}>
        <Text style={styles.h1}>Qual o valor?</Text>
        <View style={styles.tabuada}>
        <View style={styles.conta}>
          <View style={styles.numBox}><Text style={styles.numText}>{numerador}</Text></View>
          <View style={styles.opBox}><Text style={styles.opText}>{operacao}</Text></View>
          <View style={styles.numBox}><Text style={styles.numText}>{denominador}</Text></View>
        </View>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={resposta}
          onChangeText={setResposta}
          onSubmitEditing={verificarResposta}
        />
        <TouchableOpacity style={styles.button} onPress={verificarResposta}>
          <Text style={styles.buttonText}>Verificar</Text>
        </TouchableOpacity>
        <Text style={styles.totals}>Acertos: {acerto} | Erros: {errou} | Jogadas: {jogou}</Text>
        <TouchableOpacity style={styles.button} onPress={enviarResultados}>
          <Text style={styles.buttonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>

    <Modal visible={resultModalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.resultModal}>
          <Text style={styles.resultTitle}>{lastResultCorrect ? 'Correto!' : 'Errado!'}</Text>
          {!lastResultCorrect && <Text style={styles.resultDetail}>Resposta correta: {resultadoCorreto}</Text>}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.btn} onPress={() => { setResultModalVisible(false); gerarPergunta(operacao); }}>
              <Text style={styles.btnText}>Refazer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => { setResultModalVisible(false); gerarPergunta(operacao); }}>
              <Text style={styles.btnText}>Próxima</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => { setResultModalVisible(false); enviarResultados(); }}>
              <Text style={styles.btnText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex:1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    paddingTop: 20,
  },
  h1: {
    fontSize: 28,
    fontFamily: FONTS.title,
    color: COLORS.primaryDarker,
    marginBottom: 12,
  },
  tabuada: {
    width: '92%',
    maxWidth: 700,
    padding: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
  },
  conta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  numBox: { minWidth: 70, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  numText: { fontSize: 48, fontFamily: FONTS.title, color: COLORS.primary },
  opBox: { minWidth: 40, alignItems: 'center', justifyContent: 'center' },
  opText: { fontSize: 40, fontFamily: FONTS.body, color: COLORS.primaryDarker },
  input: {
    height: 46,
    borderColor: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    fontSize: 24,
    textAlign: 'center',
    width: '60%'
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  totals: { marginTop: 10, fontFamily: FONTS.body, color: COLORS.primaryDarker },
  modalOverlay: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.4)' },
  resultModal: { width: '90%', maxWidth: 420, backgroundColor: 'white', padding: 16, borderRadius: 10 },
  resultTitle: { fontSize: 22, fontFamily: FONTS.title, textAlign:'center' },
  resultDetail: { fontSize: 18, textAlign:'center', marginTop: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  btn: { padding: 10, backgroundColor: '#eee', borderRadius: 8 },
  btnText: { fontSize: 16 },
});

export default TabuadaScreen;