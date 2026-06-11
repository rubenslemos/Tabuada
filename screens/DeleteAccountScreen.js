import { useEffect, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import apiClient, { setAuthToken } from '../config/apiClient'
import API_BASE_URL from '../config/api'
import ChalkPanel from '../components/ChalkPanel'
import ClassroomBackground from '../components/ClassroomBackground'
import { FONTS } from '../src/theme'
import { getErrorMessage } from '../utils/errorMessage'

const DELETE_URL = `${API_BASE_URL}/account-deletion`

export default function DeleteAccountScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [storedToken, storedEmail, storedName] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('userEmail'),
        AsyncStorage.getItem('userName'),
      ])

      setToken(storedToken || '')
      setEmail(storedEmail || '')
      setName(storedName || '')
      setLoading(false)
    })()
  }, [])

  async function submitPublicRequest() {
    try {
      setSubmitting(true)
      const response = await apiClient.post(
        '/auth/login/delete_account_request',
        {
          name,
          email,
          reason,
        }
      )

      Alert.alert(
        'Pedido enviado',
        response?.data?.Msg ||
          'Seu pedido de exclusão foi recebido com sucesso.'
      )
      navigation?.navigate?.('Login')
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível enviar seu pedido agora.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteLoggedAccount() {
    try {
      setSubmitting(true)
      const response = await apiClient.post(
        '/auth/login/delete_account',
        { password, confirmation },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      )

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

      Alert.alert(
        'Conta excluída',
        response?.data?.Msg || 'Sua conta foi excluída com sucesso.'
      )

      navigation?.reset?.({ index: 0, routes: [{ name: 'Login' }] })
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(error, 'Não foi possível excluir sua conta agora.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  const loggedMode = Boolean(token)

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

            <Text style={styles.title}>Excluir Conta</Text>
            <Text style={styles.subtitle}>
              {loggedMode
                ? 'Se você realmente deseja excluir sua conta e os dados associados, confirme abaixo.'
                : 'Você também pode pedir a exclusão fora do login. Envie seus dados para registrar o pedido.'}
            </Text>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {loggedMode ? 'Exclusão dentro do app' : 'Pedido de exclusão'}
              </Text>
              <Text style={styles.sectionText}>
                {loggedMode
                  ? 'Essa ação remove a conta, as rodadas, contagens e dados diretamente ligados ao seu usuário.'
                  : 'Se você estiver sem acesso ao app, use este formulário. O pedido também pode ser feito pela página pública abaixo.'}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loggedMode}
            />

            {loggedMode ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <TextInput
                  style={styles.input}
                  placeholder="Digite EXCLUIR para confirmar"
                  value={confirmation}
                  onChangeText={setConfirmation}
                  autoCapitalize="characters"
                />
              </>
            ) : (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Se quiser, explique o motivo"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={5}
              />
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                submitting && styles.actionButtonDisabled,
              ]}
              onPress={loggedMode ? deleteLoggedAccount : submitPublicRequest}
              disabled={submitting}
            >
              <Text style={styles.actionButtonText}>
                {loggedMode
                  ? 'Excluir minha conta'
                  : 'Enviar pedido de exclusão'}
              </Text>
            </TouchableOpacity>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Página pública</Text>
              <Text selectable style={styles.linkText}>
                {DELETE_URL}
              </Text>
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
  input: {
    height: 46,
    borderColor: 'rgba(255,255,255,0.82)',
    borderWidth: 2,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#f8f8f2',
    width: '100%',
    fontFamily: FONTS.body,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  actionButton: {
    alignSelf: 'stretch',
    backgroundColor: '#d95c5c',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    marginBottom: 14,
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  actionButtonText: {
    color: '#fff8f8',
    fontSize: 16,
    fontFamily: FONTS.title,
  },
  linkText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.body,
  },
})
