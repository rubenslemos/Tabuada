import { Alert } from 'react-native'
import { renderAsync, fireEvent, waitFor } from '@testing-library/react-native'
import RegisterScreen from '../../screens/RegisterScreen'

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}))

const apiClient = require('../../config/apiClient').default

describe('RegisterScreen', () => {
  const navigation = { navigate: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('valida convite e registra com sucesso', async () => {
    apiClient.post
      .mockResolvedValueOnce({
        data: {
          invite: {
            role: 'Aluno',
            email: 'aluno@escola.com',
            organizationName: 'Escola Legal',
            inviteToken: 'ABC-123',
          },
        },
      })
      .mockResolvedValueOnce({ data: {} })

    const { getByText, getByPlaceholderText } = await renderAsync(
      <RegisterScreen navigation={navigation} />
    )

    fireEvent.press(getByText('Entrar em uma instituição'))
    fireEvent.changeText(getByPlaceholderText('Código do convite'), 'ABC-123')
    fireEvent.press(getByText('Validar convite'))

    await waitFor(() => expect(getByText('Convite liberado')).toBeTruthy())

    fireEvent.changeText(getByPlaceholderText('Nome'), 'Rubens')
    fireEvent.changeText(getByPlaceholderText('Senha'), 'P@ssw0rd1')
    fireEvent.changeText(getByPlaceholderText('Confirme a senha'), 'P@ssw0rd1')
    fireEvent.changeText(getByPlaceholderText('Turma'), 'A1')
    fireEvent.press(getByText('Registrar como Aluno'))

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('Login')
    )
    expect(Alert.alert).toHaveBeenCalledWith(
      'Sucesso',
      'Registro realizado com sucesso!'
    )
  })

  it('solicita criação de instituição e mostra fluxo de convite', async () => {
    apiClient.post.mockResolvedValue({
      data: {
        message: 'Convite enviado para o email informado.',
        inviteToken: 'INVITE-001',
      },
    })

    const { getByText, getByPlaceholderText } = await renderAsync(
      <RegisterScreen navigation={navigation} />
    )

    fireEvent.press(getByText('Criar nova instituição'))
    fireEvent.changeText(
      getByPlaceholderText('Nome da instituição'),
      'Escola Teste'
    )
    fireEvent.changeText(getByPlaceholderText('CPF ou CNPJ'), '11222333000181')
    fireEvent.changeText(
      getByPlaceholderText('Email responsável'),
      'coord@escola.com'
    )
    fireEvent.press(getByText('Criar e enviar convite'))

    await waitFor(() => expect(getByText('Entrar com convite')).toBeTruthy())
    expect(getByPlaceholderText('Código do convite').props.value).toBe(
      'INVITE-001'
    )
  })

  it('mostra erro amigavel no registro', async () => {
    apiClient.post.mockRejectedValue({
      response: { data: { Msg: 'E-mail já existe' } },
    })

    const { getByText, getByPlaceholderText } = await renderAsync(
      <RegisterScreen navigation={navigation} />
    )

    fireEvent.press(getByText('Entrar em uma instituição'))
    fireEvent.changeText(getByPlaceholderText('Código do convite'), 'ABC-123')
    fireEvent.press(getByText('Validar convite'))

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'E-mail já existe')
    )
  })
})
