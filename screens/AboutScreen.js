import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import QRCode from 'react-native-qrcode-svg'
import Header from '../components/Header'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'
import { FONTS } from '../src/theme'
import { buildPixPayload } from '../utils/pix'

const PIX_KEY = '1c135bc4-4cfb-4f6a-beac-90b6d7ee2d58'
const PIX_COPY_PASTE = buildPixPayload({
  key: PIX_KEY,
  merchantName: 'Tabuada',
  merchantCity: 'Sao Paulo',
  description: 'Apoio ao app Tabuada',
})

const features = [
  {
    icon: '🧮',
    title: 'Treino por operação e intervalo',
    description:
      'A criança pode praticar adição, subtração, multiplicação e divisão, escolhendo níveis por faixa numérica ou usando sorteio aleatório.',
  },
  {
    icon: '📊',
    title: 'Acompanhamento de desempenho',
    description:
      'O app mostra jogadas, acertos, erros e rodadas, ajudando a acompanhar a evolução de cada aluno com mais clareza.',
  },
  {
    icon: '🔐',
    title: 'Permissões por perfil',
    description:
      'Professores, coordenadores e administradores podem liberar ou restringir operações de acordo com a necessidade de cada estudante.',
  },
  {
    icon: '🏫',
    title: 'Organização por instituição',
    description:
      'Os dados podem ser separados por instituição, com convites e acessos próprios, mantendo cada grupo isolado e mais seguro.',
  },
  {
    icon: '💡',
    title: 'Dicas e apoio ao aprendizado',
    description:
      'Além dos exercícios, o app oferece dicas para reforçar a memorização e tornar o estudo da tabuada mais leve e divertido.',
  },
]

export default function AboutScreen({ navigation }) {
  async function copyPixPayload() {
    try {
      await Clipboard.setStringAsync(PIX_COPY_PASTE)
      Alert.alert(
        'Pix copiado',
        'O código Pix Copia e Cola foi copiado para a área de transferência.'
      )
    } catch {
      Alert.alert('Não foi possível copiar', 'Tente novamente em instantes.')
    }
  }

  async function sharePixKey() {
    try {
      await Share.share({
        message: `Apoie o desenvolvimento do app Tabuada.\n\nChave Pix: ${PIX_KEY}\n\nPix Copia e Cola:\n${PIX_COPY_PASTE}`,
        title: 'Doação via Pix',
      })
    } catch {
      Alert.alert(
        'Não foi possível compartilhar',
        'Tente novamente em alguns instantes.'
      )
    }
  }

  return (
    <ClassroomBackground stripeTop={120}>
      <Header activeMenuKey="about" />

      <View style={styles.fixedBackWrap}>
        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack?.()) {
              navigation.goBack()
              return
            }
            navigation?.navigate?.('Tabuada')
          }}
          style={styles.fixedBackButton}
        >
          <Text style={styles.fixedBackArrow}>‹</Text>
          <Text style={styles.fixedBackText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <ChalkPanel fill style={styles.panel} boardStyle={styles.panelBoard}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.panelHeader}>
              <Text style={styles.title}>Sobre o App</Text>
              <Text style={styles.subtitle}>
                Um apoio lúdico para aprender tabuada com acompanhamento e
                organização escolar.
              </Text>
            </View>

            <View style={styles.flagsRow}>
              <Text style={styles.flag}>▲</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>■</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>▲</Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                O que o aplicativo oferece
              </Text>
              {features.map((feature) => (
                <View key={feature.title} style={styles.featureCard}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Como esse app ajuda</Text>
              <Text style={styles.paragraph}>
                O Tabuada foi pensado para tornar o treino matemático mais
                visual, acolhedor e organizado. Ele atende tanto o uso
                individual quanto o acompanhamento por professores,
                coordenadores e instituições.
              </Text>
            </View>

            <View style={styles.donationCard}>
              <Text style={styles.sectionTitle}>Apoie o desenvolvedor</Text>
              <Text style={styles.paragraph}>
                Se o aplicativo te ajuda e você quiser apoiar a continuidade do
                projeto, é possível fazer uma doação via Pix.
              </Text>
              <Text style={styles.pixHint}>
                O QR Code funciona bem quando alguém estiver vendo esta tela em
                outro aparelho ou na tela do computador.
              </Text>
              <View style={styles.qrWrap}>
                <View style={styles.qrCard}>
                  <QRCode value={PIX_COPY_PASTE} size={174} />
                </View>
              </View>
              <Text style={styles.pixHint}>
                No mesmo celular, o caminho mais fácil costuma ser copiar o Pix
                Copia e Cola e colar no app do banco.
              </Text>
              <Text selectable style={styles.pixPayload}>
                {PIX_COPY_PASTE}
              </Text>

              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyPixPayload}
              >
                <Text style={styles.copyButtonText}>
                  Copiar Pix Copia e Cola
                </Text>
              </TouchableOpacity>

              <Text style={styles.pixHint}>
                Se preferir, a chave Pix também continua disponível abaixo.
              </Text>
              <Text selectable style={styles.pixKey}>
                {PIX_KEY}
              </Text>

              <TouchableOpacity
                style={styles.donateButton}
                onPress={sharePixKey}
              >
                <Text style={styles.donateButtonText}>
                  Compartilhar dados do Pix
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ChalkPanel>
      </View>
    </ClassroomBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  fixedBackWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fixedBackArrow: {
    color: '#f3f1d6',
    fontSize: 20,
    marginRight: 6,
    lineHeight: 22,
    fontFamily: FONTS.title,
  },
  fixedBackText: {
    color: '#f3f1d6',
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  panel: {
    flex: 1,
  },
  panelBoard: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 18,
  },
  panelHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#f2f4dc',
    fontSize: 28,
    fontFamily: FONTS.title,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#eef4e8',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: FONTS.body,
  },
  flagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  flag: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: FONTS.body,
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 14,
    marginBottom: 14,
  },
  donationCard: {
    backgroundColor: 'rgba(255,213,79,0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,213,79,0.45)',
    padding: 14,
  },
  sectionTitle: {
    color: '#fff6cf',
    fontSize: 18,
    fontFamily: FONTS.title,
    marginBottom: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    color: '#f3f5e5',
    fontSize: 16,
    fontFamily: FONTS.title,
    marginBottom: 4,
  },
  featureDescription: {
    color: '#f0f6ed',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.body,
  },
  paragraph: {
    color: '#f0f6ed',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONTS.body,
  },
  pixHint: {
    color: '#fff0be',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.body,
    marginBottom: 8,
  },
  qrWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  qrCard: {
    backgroundColor: '#fffdf7',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  pixPayload: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.body,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  pixKey: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 24,
    fontFamily: FONTS.body,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  copyButton: {
    alignSelf: 'stretch',
    backgroundColor: '#4aa0ec',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    marginBottom: 10,
  },
  copyButtonText: {
    color: '#f7fcff',
    fontSize: 15,
    fontFamily: FONTS.title,
  },
  donateButton: {
    alignSelf: 'stretch',
    backgroundColor: '#6dc35e',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
  },
  donateButtonText: {
    color: '#f6fff2',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
})
