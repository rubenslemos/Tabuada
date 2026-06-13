import { Alert } from 'react-native'
import { renderAsync, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PermissoesScreen from '../../screens/PermissoesScreen'

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))
jest.mock('../../components/Header', () => () => null)

const apiClient = require('../../config/apiClient').default

describe('PermissoesScreen', () => {
  const navigation = { navigate: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'token') return 'token123'
      if (key === 'userId') return 'prof123'
      return null
    })
  })

  it('carrega alunos filtrados e salva permissoes', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/prof123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'prof123',
              name: 'Prof',
              tipo: 'Pais',
              turma: 'A1',
            },
          },
        })
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve({
          data: [
            {
              _id: 'aluno1',
              name: 'Dependente 1',
              tipo: 'Dependentes',
              turma: 'A1',
              permissoes: { soma: true },
            },
            {
              _id: 'aluno2',
              name: 'Dependente 2',
              tipo: 'Dependentes',
              turma: 'B1',
              permissoes: { soma: false },
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    apiClient.post.mockResolvedValue({ data: { message: 'ok' } })

    const { getByText, getByLabelText, queryByText } = await renderAsync(
      <PermissoesScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(getByText('Permissões dos Dependentes')).toBeTruthy()
    )
    expect(getByText('Dependente 1')).toBeTruthy()
    expect(queryByText('Dependente 2')).toBeNull()

    fireEvent.press(getByLabelText('Alternar Subtração'))
    fireEvent.press(getByText('Salvar Permissões'))

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1))
    expect(apiClient.post.mock.calls[0][0]).toContain('/acessos')
    expect(apiClient.post.mock.calls[0][1]).toHaveProperty('alunoId', 'aluno1')
  })

  it('volta para tabuada pelo botao fixo', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/prof123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'prof123',
              name: 'Prof',
              tipo: 'Pais',
              turma: 'A1',
            },
          },
        })
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve({
          data: [
            {
              _id: 'aluno1',
              name: 'Dependente 1',
              tipo: 'Dependentes',
              turma: 'A1',
              permissoes: {},
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    const { getByText } = await renderAsync(
      <PermissoesScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(getByText('Permissões dos Dependentes')).toBeTruthy()
    )

    fireEvent.press(getByText('Voltar para Tabuada'))

    expect(navigation.navigate).toHaveBeenCalledWith('Tabuada')
  })

  it('permite selecionar aluno pelo campo unico', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/prof123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'prof123',
              name: 'Coord',
              tipo: 'Pais',
              turma: 'A1',
            },
          },
        })
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve({
          data: [
            {
              _id: 'aluno1',
              name: 'Dependente 1',
              tipo: 'Dependentes',
              turma: 'A1',
              permissoes: { soma: true },
            },
            {
              _id: 'aluno2',
              name: 'Dependente 2',
              tipo: 'Dependentes',
              turma: 'A1',
              permissoes: { dividir: true },
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    const { getByLabelText, getByText } = await renderAsync(
      <PermissoesScreen navigation={navigation} />
    )

    await waitFor(() => expect(getByText('Dependente 1')).toBeTruthy())

    fireEvent.press(getByLabelText('Selecionar dependente'))
    fireEvent.press(getByText('Dependente 2'))

    expect(getByText('Dependente 2')).toBeTruthy()

    fireEvent.press(getByText('Salvar Permissões'))

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1))
    expect(apiClient.post.mock.calls[0][1]).toHaveProperty('alunoId', 'aluno2')
  })

  it('mostra erro quando salvar permissoes falha', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/prof123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'prof123',
              tipo: 'Pais',
              turma: 'A1',
              name: 'Prof',
            },
          },
        })
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve({
          data: [
            {
              _id: 'aluno1',
              name: 'Dependente 1',
              tipo: 'Dependentes',
              turma: 'A1',
              permissoes: {},
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })
    apiClient.post.mockRejectedValue(new Error('fail'))

    const { getByText } = await renderAsync(
      <PermissoesScreen navigation={navigation} />
    )
    await waitFor(() =>
      expect(getByText('Permissões dos Dependentes')).toBeTruthy()
    )

    fireEvent.press(getByText('Salvar Permissões'))
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'fail')
    )
  })

  it('marca todas as operacoes ao ativar Todas', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/prof123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'prof123',
              name: 'Prof',
              tipo: 'Pais',
              turma: 'A1',
            },
          },
        })
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve({
          data: [
            {
              _id: 'aluno1',
              name: 'Dependente 1',
              tipo: 'Dependentes',
              turma: 'A1',
              permissoes: {
                soma: false,
                menos: false,
                vezes: false,
                dividir: false,
                todas: false,
              },
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    apiClient.post.mockResolvedValue({ data: { message: 'ok' } })

    const { getByText, getByLabelText } = await renderAsync(
      <PermissoesScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(getByText('Permissões dos Dependentes')).toBeTruthy()
    )

    fireEvent.press(getByLabelText('Alternar Todas'))
    fireEvent.press(getByText('Salvar Permissões'))

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1))
    expect(apiClient.post.mock.calls[0][1].acessos).toEqual({
      soma: true,
      menos: true,
      vezes: true,
      dividir: true,
      todas: true,
    })
  })

  it('desmarca Todas ao desativar uma operacao individual', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/prof123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'prof123',
              name: 'Prof',
              tipo: 'Pais',
              turma: 'A1',
            },
          },
        })
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve({
          data: [
            {
              _id: 'aluno1',
              name: 'Dependente 1',
              tipo: 'Dependentes',
              turma: 'A1',
              permissoes: {
                soma: true,
                menos: true,
                vezes: true,
                dividir: true,
                todas: true,
              },
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    apiClient.post.mockResolvedValue({ data: { message: 'ok' } })

    const { getByText, getByLabelText } = await renderAsync(
      <PermissoesScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(getByText('Permissões dos Dependentes')).toBeTruthy()
    )

    fireEvent.press(getByLabelText('Alternar Subtração'))
    fireEvent.press(getByText('Salvar Permissões'))

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1))
    expect(apiClient.post.mock.calls[0][1].acessos).toEqual({
      soma: true,
      menos: false,
      vezes: true,
      dividir: true,
      todas: false,
    })
  })

  it('gera convite para aluno a partir da tela de permissoes', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/prof123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'prof123',
              name: 'Prof',
              tipo: 'Pais',
              turma: 'A1',
            },
          },
        })
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve({
          data: [
            {
              _id: 'aluno1',
              name: 'Dependente 1',
              tipo: 'Dependentes',
              turma: 'A1',
              permissoes: { soma: true },
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    apiClient.post.mockResolvedValueOnce({
      data: { message: 'Convite enviado para o email informado.' },
    })

    const { getByText, getByPlaceholderText } = await renderAsync(
      <PermissoesScreen navigation={navigation} />
    )

    await waitFor(() => expect(getByText('Gerar convite')).toBeTruthy())

    fireEvent.press(getByText('Gerar convite'))
    fireEvent.changeText(
      getByPlaceholderText('Email do usuário'),
      'novoaluno@escola.com'
    )
    fireEvent.press(getByText('Enviar convite'))

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1))
    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/register/request-invite',
      {
        email: 'novoaluno@escola.com',
        role: 'Dependentes',
      },
      expect.any(Object)
    )
    expect(Alert.alert).toHaveBeenCalledWith(
      'Convite enviado',
      'Convite enviado para o email informado.'
    )
  })

  it('permite coordenador escolher perfil do convite', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/prof123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'prof123',
              name: 'Coord',
              tipo: 'Pais',
              turma: 'A1',
            },
          },
        })
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve({
          data: [
            {
              _id: 'aluno1',
              name: 'Dependente 1',
              tipo: 'Dependentes',
              turma: 'A1',
              permissoes: { soma: true },
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    apiClient.post.mockResolvedValueOnce({
      data: { message: 'Convite enviado para o email informado.' },
    })

    const { getByText, getByPlaceholderText } = await renderAsync(
      <PermissoesScreen navigation={navigation} />
    )

    await waitFor(() => expect(getByText('Gerar convite')).toBeTruthy())

    fireEvent.press(getByText('Gerar convite'))
    fireEvent.press(getByText('Pais'))
    fireEvent.changeText(
      getByPlaceholderText('Email do usuário'),
      'novoprof@escola.com'
    )
    fireEvent.press(getByText('Enviar convite'))

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1))
    expect(apiClient.post.mock.calls[0][1]).toEqual({
      email: 'novoprof@escola.com',
      role: 'Pais',
    })
  })
})
