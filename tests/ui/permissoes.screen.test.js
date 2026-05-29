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
              tipo: 'Professor',
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
              name: 'Aluno 1',
              tipo: 'Aluno',
              turma: 'A1',
              permissoes: { soma: true },
            },
            {
              _id: 'aluno2',
              name: 'Aluno 2',
              tipo: 'Aluno',
              turma: 'B1',
              permissoes: { soma: false },
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    apiClient.post.mockResolvedValue({ data: { message: 'ok' } })

    const { getByText, queryByText } = await renderAsync(
      <PermissoesScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(getByText('Permissões às Tabuadas')).toBeTruthy()
    )
    expect(getByText('Aluno 1')).toBeTruthy()
    expect(queryByText('Aluno 2')).toBeNull()

    fireEvent.press(getByText('Subtração'))
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
              tipo: 'Professor',
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
              name: 'Aluno 1',
              tipo: 'Aluno',
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
      expect(getByText('Permissões às Tabuadas')).toBeTruthy()
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
              tipo: 'Coordenador',
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
              name: 'Aluno 1',
              tipo: 'Aluno',
              turma: 'A1',
              permissoes: { soma: true },
            },
            {
              _id: 'aluno2',
              name: 'Aluno 2',
              tipo: 'Aluno',
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

    await waitFor(() => expect(getByText('Aluno 1')).toBeTruthy())

    fireEvent.press(getByLabelText('Selecionar aluno'))
    fireEvent.press(getByText('Aluno 2'))

    expect(getByText('Aluno 2')).toBeTruthy()

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
              tipo: 'Professor',
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
              name: 'Aluno 1',
              tipo: 'Aluno',
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
      expect(getByText('Permissões às Tabuadas')).toBeTruthy()
    )

    fireEvent.press(getByText('Salvar Permissões'))
    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'fail')
    )
  })
})
