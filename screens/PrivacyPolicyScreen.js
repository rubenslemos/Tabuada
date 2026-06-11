import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'
import { FONTS } from '../src/theme'
import API_BASE_URL from '../config/api'

const sections = [
  {
    title: 'Dados coletados',
    text: 'O app pode tratar nome, email, tipo de usuário, turma, instituição, desempenho em rodadas, permissões e dados técnicos necessários para autenticação e segurança.',
  },
  {
    title: 'Uso dos dados',
    text: 'Esses dados são usados para permitir login, organizar instituições, mostrar desempenho, controlar permissões, enviar convites e recuperar senha.',
  },
  {
    title: 'Compartilhamento',
    text: 'Os dados não são vendidos. Eles podem ser usados apenas com serviços de apoio ao funcionamento do app, como hospedagem, banco de dados e envio de email.',
  },
  {
    title: 'Retenção e exclusão',
    text: 'Os dados permanecem enquanto a conta estiver ativa ou enquanto forem necessários para o serviço. O usuário pode pedir exclusão da conta e dos dados associados.',
  },
]

const PRIVACY_URL = `${API_BASE_URL}/privacy-policy`
const DELETE_URL = `${API_BASE_URL}/account-deletion`

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <ClassroomBackground stripeTop={120}>
      <View style={styles.fixedBackWrap}>
        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack?.()) {
              navigation.goBack()
              return
            }
            navigation?.navigate?.('Login')
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
            <View style={styles.flagsRow}>
              <Text style={styles.flag}>▲</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>■</Text>
              <Text style={styles.flag}>●</Text>
              <Text style={styles.flag}>▲</Text>
            </View>

            <Text style={styles.title}>Política de Privacidade</Text>
            <Text style={styles.subtitle}>
              Transparência simples sobre como o Tabuada trata os dados dos
              usuários.
            </Text>

            {sections.map((section) => (
              <View key={section.title} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionText}>{section.text}</Text>
              </View>
            ))}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Links públicos</Text>
              <Text selectable style={styles.linkText}>
                {PRIVACY_URL}
              </Text>
              <Text selectable style={styles.linkText}>
                {DELETE_URL}
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(PRIVACY_URL)}
              >
                <Text style={styles.actionButtonText}>
                  Abrir política no navegador
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
  container: { flex: 1, paddingHorizontal: 16, paddingBottom: 18 },
  fixedBackWrap: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 8 },
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
  fixedBackText: {
    color: '#f3f1d6',
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  panel: { flex: 1 },
  panelBoard: { paddingHorizontal: 14, paddingVertical: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 18 },
  flagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  flag: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontFamily: FONTS.body,
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
    marginBottom: 14,
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#fff6cf',
    fontSize: 18,
    fontFamily: FONTS.title,
    marginBottom: 8,
  },
  sectionText: {
    color: '#f0f6ed',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: FONTS.body,
  },
  linkText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.body,
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 6,
    backgroundColor: '#4aa0ec',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#f7fcff',
    fontSize: 15,
    fontFamily: FONTS.title,
  },
})
