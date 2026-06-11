import { Alert } from 'react-native'
import { fireEvent, renderAsync, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DeleteAccountScreen from '../../screens/DeleteAccountScreen'

jest.mock('../../config/api', () => ({
  __esModule: true,
  default: 'https://tabuada-theta-nine.vercel.app',
}))

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    defaults: { headers: { common: {} } },
  },
  setAuthToken: jest.fn(),
}))

const apiClient = require('../../config/apiClient').default

describe('DeleteAccountScreen', () => {
  const navigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    AsyncStorage.multiRemove = jest.fn(async () => {})
  })

  it('envia pedido publico de exclusao quando nao ha token', async () => {
    AsyncStorage.getItem.mockImplementation(async () => null)
    apiClient.post.mockResolvedValue({
      data: {
        Msg: 'Pedido de exclusao recebido.',
      },
    })

    const screen = await renderAsync(
      <DeleteAccountScreen navigation={navigation} />
    )

    fireEvent.changeText(screen.getByPlaceholderText('Nome'), 'Rubens')
    fireEvent.changeText(
      screen.getByPlaceholderText('Email'),
      'rubens@email.com'
    )
    fireEvent.changeText(
      screen.getByPlaceholderText('Se quiser, explique o motivo'),
      'Nao quero mais usar o app'
    )
    fireEvent.press(screen.getByText('Enviar pedido de exclusão'))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/login/delete_account_request',
        {
          name: 'Rubens',
          email: 'rubens@email.com',
          reason: 'Nao quero mais usar o app',
        }
      )
    )
  })

  it('exclui a conta logada com senha e confirmacao', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'token') return 'token-1'
      if (key === 'userEmail') return 'rubens@email.com'
      if (key === 'userName') return 'Rubens'
      return null
    })
    apiClient.post.mockResolvedValue({
      data: { Msg: 'Conta excluida com sucesso' },
    })

    const screen = await renderAsync(
      <DeleteAccountScreen navigation={navigation} />
    )

    fireEvent.changeText(screen.getByPlaceholderText('Digite sua senha'), '123')
    fireEvent.changeText(
      screen.getByPlaceholderText('Digite EXCLUIR para confirmar'),
      'EXCLUIR'
    )
    fireEvent.press(screen.getByText('Excluir minha conta'))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/login/delete_account',
        { password: '123', confirmation: 'EXCLUIR' },
        expect.any(Object)
      )
    )
  })
})
