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
            role: 'Dependentes',
            email: 'dependente@casa.com',
            organizationName: 'Casa Legal',
            inviteToken: 'ABC-123',
          },
        },
      })
      .mockResolvedValueOnce({ data: {} })

    const { getByText, getByPlaceholderText } = await renderAsync(
      <RegisterScreen navigation={navigation} />
    )

    fireEvent.press(getByText('Entrar em uma casa'))
    fireEvent.changeText(getByPlaceholderText('Código do convite'), 'ABC-123')
    fireEvent.press(getByText('Validar convite'))

    await waitFor(() => expect(getByText('Convite liberado')).toBeTruthy())

    fireEvent.changeText(getByPlaceholderText('Nome'), 'Rubens')
    fireEvent.changeText(getByPlaceholderText('Senha'), 'P@ssw0rd1')
    fireEvent.changeText(getByPlaceholderText('Confirme a senha'), 'P@ssw0rd1')
    fireEvent.press(getByText('Registrar como Dependente'))

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('Login')
    )
    expect(Alert.alert).toHaveBeenCalledWith(
      'Sucesso',
      'Registro realizado com sucesso!'
    )
  })

  it('normaliza convite legado de coordenador para responsaveis na interface', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        invite: {
          role: 'Coordenador',
          email: 'rubens.lemos@localiza.com',
          organizationName: 'localiza',
          inviteToken: '08061',
        },
      },
    })

    const { getByText, getByPlaceholderText, queryByText } = await renderAsync(
      <RegisterScreen navigation={navigation} />
    )

    fireEvent.press(getByText('Entrar em uma casa'))
    fireEvent.changeText(getByPlaceholderText('Código do convite'), '08061')
    fireEvent.press(getByText('Validar convite'))

    await waitFor(() => expect(getByText('Convite liberado')).toBeTruthy())
    expect(getByText('localiza • Responsáveis')).toBeTruthy()
    expect(getByText('Você entra como')).toBeTruthy()
    expect(getByText('Pai')).toBeTruthy()
    expect(getByText('Mae')).toBeTruthy()
    expect(getByText('Responsavel')).toBeTruthy()
    expect(getByText('Registrar como Responsavel')).toBeTruthy()
    expect(queryByText('Registrar como Coordenador')).toBeNull()
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

    fireEvent.press(getByText('Criar nova casa'))
    fireEvent.changeText(getByPlaceholderText('Nome da casa'), 'Escola Teste')
    fireEvent.changeText(
      getByPlaceholderText('CPF do responsável'),
      '11222333000181'
    )
    fireEvent.changeText(
      getByPlaceholderText('Email do responsável'),
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

    fireEvent.press(getByText('Entrar em uma casa'))
    fireEvent.changeText(getByPlaceholderText('Código do convite'), 'ABC-123')
    fireEvent.press(getByText('Validar convite'))

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'E-mail já existe')
    )
  })
})
