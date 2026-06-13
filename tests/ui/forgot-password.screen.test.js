import { Alert } from 'react-native'
import { renderAsync, fireEvent, waitFor } from '@testing-library/react-native'
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen'

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}))

const apiClient = require('../../config/apiClient').default

describe('ForgotPasswordScreen', () => {
  const navigation = { navigate: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('envia recuperacao e retorna para login', async () => {
    apiClient.post.mockResolvedValue({ data: { token: 'TOKEN123' } })

    const { getByText, getByPlaceholderText } = await renderAsync(
      <ForgotPasswordScreen navigation={navigation} />
    )
    fireEvent.changeText(
      getByPlaceholderText('Seu email'),
      'rubenslemos@gmail.com'
    )
    fireEvent.press(getByText('Enviar instruções'))

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('ResetPassword', {
        email: 'rubenslemos@gmail.com',
        token: 'TOKEN123',
      })
    )
  })

  it('mostra erro quando falha envio', async () => {
    apiClient.post.mockRejectedValue(new Error('fail'))

    const { getByText } = await renderAsync(
      <ForgotPasswordScreen navigation={navigation} />
    )
    fireEvent.press(getByText('Enviar instruções'))

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'fail')
    )
  })
})
