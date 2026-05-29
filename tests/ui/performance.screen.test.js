import { renderAsync, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PerformanceScreen from '../../screens/PerformanceScreen'

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}))
jest.mock('../../components/Header', () => () => null)

const apiClient = require('../../config/apiClient').default

describe('PerformanceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'token') return 'token123'
      if (key === 'userId') return 'user123'
      return null
    })
  })

  it('renderiza resultados do usuario logado e abre modal de detalhes', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/user123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'user123',
              id: 'user123',
              name: 'Aluno 1',
              tipo: 'Aluno',
              rounds: [{ _id: 'round1', jogou: 4, acerto: 3, errou: 1 }],
            },
          },
        })
      }
      if (url.includes('/round/round1')) {
        return Promise.resolve({
          data: {
            round: {
              contagemOperacoes: {
                contagemOperacoes: {
                  faPlus: 2,
                  faMinus: 1,
                  faTimes: 0,
                  faDivide: 0,
                },
              },
            },
          },
        })
      }
      return Promise.resolve({ data: {} })
    })

    const { getByLabelText, getByText, queryByText } = await renderAsync(
      <PerformanceScreen />
    )

    await waitFor(() => expect(getByText('Resultados')).toBeTruthy())
    expect(getByText('#1')).toBeTruthy()

    fireEvent.press(getByLabelText('Detalhes da rodada 1'))

    await waitFor(() => expect(getByText('Detalhes Rodada 1')).toBeTruthy())
    expect(getByText('Adição')).toBeTruthy()
    expect(getByText('Subtração')).toBeTruthy()
    expect(getByText('Divisão')).toBeTruthy()
    expect(queryByText('Fechar')).toBeTruthy()
  })

  it('permite selecionar outro usuario pelo campo unico', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/auth/login/user123')) {
        return Promise.resolve({
          data: {
            user: {
              _id: 'user123',
              id: 'user123',
              name: 'Prof Rubens',
              tipo: 'Professor',
              turma: 'A',
              rounds: [{ _id: 'round-prof', jogou: 2, acerto: 1, errou: 1 }],
            },
          },
        })
      }
      if (url.includes('/auth/register')) {
        return Promise.resolve({
          data: [
            {
              _id: 'aluno1',
              id: 'aluno1',
              name: 'Aluno Selecionado',
              tipo: 'Aluno',
              turma: 'A',
              rounds: [{ _id: 'round-aluno', jogou: 10, acerto: 8, errou: 2 }],
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    const { getByLabelText, getByText, queryByText } = await renderAsync(
      <PerformanceScreen />
    )

    await waitFor(() => expect(getByText('Logado: Prof Rubens')).toBeTruthy())

    fireEvent.press(getByLabelText('Selecionar usuário'))
    fireEvent.press(getByText('Aluno Selecionado'))

    await waitFor(() => expect(getByText('Jogadas')).toBeTruthy())
    expect(getByText('Acertos')).toBeTruthy()
    expect(getByText('80%')).toBeTruthy()
    expect(queryByText('50%')).toBeNull()
  })

  it('sai do loading mesmo com erro de API', async () => {
    apiClient.get.mockRejectedValue(new Error('fail'))

    const { getByText } = await renderAsync(<PerformanceScreen />)
    await waitFor(() => expect(getByText('Resultados')).toBeTruthy())
  })
})
