import { Alert } from 'react-native'
import { renderAsync, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import LoginScreen from '../../screens/LoginScreen'

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    defaults: { headers: { common: {} } },
  },
  setAuthToken: jest.fn(),
}))

const apiClient = require('../../config/apiClient').default

describe('LoginScreen', () => {
  const navigation = { navigate: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    AsyncStorage.setItem.mockResolvedValue()
  })

  it('faz login com sucesso e navega para Tabuada', async () => {
    apiClient.post.mockResolvedValue({
      data: {
        token: 'token123',
        user: { _id: 'u1', name: 'Rubens' },
        totalAcertos: 1,
        totalJogos: 2,
        totalErros: 1,
      },
    })

    const { getByPlaceholderText, getByText } = await renderAsync(
      <LoginScreen navigation={navigation} />
    )

    fireEvent.changeText(getByPlaceholderText('Email'), 'a@a.com')
    fireEvent.changeText(getByPlaceholderText('Senha'), '123')
    fireEvent.press(getByText('Entrar'))

    await waitFor(() =>
      expect(getByText('Login realizado com sucesso!')).toBeTruthy()
    )
    expect(Alert.alert).not.toHaveBeenCalledWith(
      'Sucesso',
      'Login realizado com sucesso!'
    )

    fireEvent.press(getByText('OK'))

    expect(navigation.navigate).toHaveBeenCalledWith('Tabuada')
  })

  it('faz login global admin e navega para Tabuada', async () => {
    apiClient.post.mockResolvedValue({
      data: {
        token: 'token123',
        user: { _id: 'u1', name: 'Admin', isGlobalAdmin: true },
        totalAcertos: 0,
        totalJogos: 0,
        totalErros: 0,
      },
    })

    const { getByPlaceholderText, getByText } = await renderAsync(
      <LoginScreen navigation={navigation} />
    )

    fireEvent.changeText(getByPlaceholderText('Email'), 'admin@a.com')
    fireEvent.changeText(getByPlaceholderText('Senha'), '123')
    fireEvent.press(getByText('Entrar'))

    await waitFor(() =>
      expect(getByText('Login realizado com sucesso!')).toBeTruthy()
    )

    fireEvent.press(getByText('OK'))

    expect(navigation.navigate).toHaveBeenCalledWith('Tabuada')
  })

  it('mostra erro quando login falha', async () => {
    apiClient.post.mockRejectedValue(new Error('fail'))

    const { getByText } = await renderAsync(
      <LoginScreen navigation={navigation} />
    )
    fireEvent.press(getByText('Entrar'))

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'fail')
    )
  })

  it('nao exibe mais atalho do painel admin na tela de login', async () => {
    const { queryByText } = await renderAsync(
      <LoginScreen navigation={navigation} />
    )

    expect(queryByText('Painel do Administrador')).toBeNull()
  })
})
