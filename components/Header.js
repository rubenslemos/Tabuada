import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';
import { COLORS, FONTS } from '../src/theme';

const operations = [
  { key: 'todas', label: 'Todas' },
  { key: 'soma', label: 'Adição' },
  { key: 'menos', label: 'Subtração' },
  { key: 'vezes', label: 'Multiplicação' },
  { key: 'dividir', label: 'Divisão' },
];

export default function Header({ onSelectOperation }) {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [estrelaCount, setEstrelaCount] = useState(0);
  const [downThumbCount, setDownThumbCount] = useState(0);
  const [nivelCount, setNivelCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        if (name) setUserName(name);
        else setUserName('Usuário');
      } catch (err) {
        // ignore
      }
      await loadPremios();
    })();
  }, []);

  const loadPremios = async () => {
    try {
      const totalAcertos = parseInt(await AsyncStorage.getItem('totalAcertos')) || 0;
      const totalErros = parseInt(await AsyncStorage.getItem('totalErros')) || 0;
      // stars: 1 estrela a cada 10 acertos
      const estrela = isNaN(totalAcertos) ? 0 : Math.floor(totalAcertos / 10);
      // down thumbs: 1 a cada 10 erros
      const downThumb = isNaN(totalErros) ? 0 : Math.floor(totalErros / 10);
      // calculators: 1 calculadora a cada 10 estrelas
      const calculadoras = Math.floor(estrela / 10);
      setEstrelaCount(estrela);
      setDownThumbCount(downThumb);
      setNivelCount(calculadoras);
    } catch (err) {
      // ignore
    }
  };

  const fetchTip = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/tips/random`);
      const data = await resp.json();
      const tip = data?.tip || 'Sem dicas disponíveis.';
      Alert.alert('Dica', tip);
    } catch (err) {
      Alert.alert('Dica', 'Erro ao obter dica');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
        <Text style={styles.menuText}>☰</Text>
      </TouchableOpacity>

      <Text style={styles.logo}>Tabuada</Text>

      <View style={styles.rightGroup}>
        <TouchableOpacity style={styles.navButton} onPress={() => { navigation.navigate('Performance'); }} accessibilityLabel="Desempenho">
          <Text style={styles.navText}>📊</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => { navigation.navigate('Permissoes'); }} accessibilityLabel="Permissões">
          <Text style={styles.navText}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tipButton} onPress={fetchTip} accessibilityLabel="Dicas">
          <Text style={styles.tipText}>💡</Text>
        </TouchableOpacity>

        <View style={styles.premios}>
          <TouchableOpacity style={styles.premioItem} onPress={() => Alert.alert('Estrelas', 'A cada 10 acertos você ganha 1 estrelinha.') }>
            <Image source={require('../assets/images/estrela.png')} style={styles.premioIcon} />
            <Text style={styles.premioCount}>{estrelaCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.premioItem} onPress={() => Alert.alert('Falhas', 'A cada 10 erros você ganha 1 "dedão para baixo".') }>
            <Image source={require('../assets/images/downthumb.png')} style={styles.premioIcon} />
            <Text style={styles.premioCount}>{downThumbCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.premioItem} onPress={() => Alert.alert('Calculadora', 'A cada 10 estrelas você ganha 1 calculadora; cada calculadora libera um novo nível (intervalo).') }>
            <Image source={require('../assets/images/calculadora.png')} style={styles.premioIcon} />
            <Text style={styles.premioCount}>{nivelCount}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.user}>Olá, {userName}</Text>
      </View>

      <Modal transparent visible={menuVisible} animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setMenuVisible(false)} />
        <View style={styles.modalScroll}>
          <Text style={styles.modalTitle}>Operações</Text>
          {/* Lista de operações com intervalos como no web */}
          {operations.map((op) => (
            <View key={op.key} style={styles.opBlock}>
              <TouchableOpacity style={styles.opHeader} onPress={() => { /* expand/collapse handled below */ }}>
                <Text style={styles.opHeaderText}>{op.label}</Text>
              </TouchableOpacity>

              <View style={styles.intervalList}>
                {/* gerar intervalos de 10 até 100 (1-10,11-20,..) */}
                {(() => {
                  const totalIntervals = 10;
                  const unlockedIntervals = Math.min(1 + (nivelCount || 0), totalIntervals); // 1..10
                  return Array.from({ length: unlockedIntervals }).map((_, idx) => {
                    const inicio = idx * 10 + 1;
                    const fim = Math.min((idx + 1) * 10, 100);
                    return (
                      <View key={`${op.key}-${fim}`} style={styles.intervalBlock}>
                        <TouchableOpacity
                          style={styles.intervalButton}
                          onPress={() => {
                            // escolher um número aleatório dentro do intervalo
                            const n = Math.floor(Math.random() * (fim - inicio + 1)) + inicio;
                            setMenuVisible(false);
                            onSelectOperation && onSelectOperation(`${op.key}${String(n).padStart(2,'0')}`);
                          }}
                        >
                          <Text style={styles.intervalText}>{`${inicio} - ${fim}`}</Text>
                        </TouchableOpacity>
                        {/* Também permitir navegar para cada número do intervalo */}
                        <View style={styles.intervalNumbers}>
                          {Array.from({ length: fim - inicio + 1 }).map((__, j) => {
                            const num = inicio + j;
                            return (
                              <TouchableOpacity key={`num-${op.key}-${num}`} style={styles.numberBtn} onPress={() => { setMenuVisible(false); onSelectOperation && onSelectOperation(`${op.key}${String(num).padStart(2,'0')}`); }}>
                                <Text style={styles.numberText}>{String(num).padStart(2,'0')}</Text>
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      </View>
                    )
                  })
                })()}
              </View>
            </View>
          ))}

          {/* botão para todas as operações */}
          <TouchableOpacity style={styles.opFooter} onPress={() => { setMenuVisible(false); onSelectOperation && onSelectOperation('todas'); }}>
            <Text style={styles.opFooterText}>Todas as operações</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: COLORS.whiteTransparent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  premioItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 },
  menuButton: {
    padding: 8,
  },
  menuText: {
    color: COLORS.primaryDarker,
    fontSize: 24,
    fontFamily: FONTS.title,
  },
  logo: {
    color: COLORS.primaryDarker,
    fontSize: 20,
    fontFamily: FONTS.title,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipButton: {
    padding: 6,
    marginRight: 6,
  },
  tipText: { fontSize: 20 },
  navButton: { padding: 6, marginRight: 6 },
  navText: { fontSize: 18 },
  premios: { flexDirection: 'row', alignItems: 'center' },
  premioItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 },
  premioIcon: { width: 20, height: 20, marginRight: 6, resizeMode: 'contain' },
  premioCount: { fontSize: 14, color: COLORS.primaryDarker, fontFamily: FONTS.body },
  user: {
    color: COLORS.primaryDarker,
    fontSize: 14,
    fontFamily: FONTS.body,
    marginLeft: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  modalScroll: {
    position: 'absolute',
    right: 10,
    top: 70,
    backgroundColor: 'white',
    width: 320,
    maxHeight: '80%',
    borderRadius: 8,
    padding: 12,
    elevation: 6,
  },
  modalTitle: { fontWeight: '700', marginBottom: 8 },
  opBlock: { marginBottom: 12 },
  opHeader: { paddingVertical: 6 },
  opHeaderText: { fontSize: 18, fontFamily: FONTS.title, color: COLORS.primaryDarker },
  intervalList: { paddingLeft: 6 },
  intervalBlock: { marginBottom: 8 },
  intervalButton: { paddingVertical: 6 },
  intervalText: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.primaryDarker },
  intervalNumbers: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  numberBtn: { padding: 6, margin: 3, backgroundColor: '#f6f6f6', borderRadius: 6 },
  numberText: { fontSize: 12 },
  opFooter: { paddingVertical: 10, alignItems: 'center' },
  opFooterText: { fontSize: 16, fontFamily: FONTS.body, color: COLORS.primary },
  disabledInterval: { opacity: 0.45 },
  disabledText: { color: '#999' },
  numberBtnDisabled: { padding: 6, margin: 3, borderRadius: 6, backgroundColor: '#fafafa', opacity: 0.5 },
  numberTextDisabled: { fontSize: 12, color: '#999' },
});
