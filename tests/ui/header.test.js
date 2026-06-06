import { Alert } from 'react-native'
import { renderAsync, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Header from '../../components/Header'

const mockNavigation = {
  navigate: jest.fn(),
  reset: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useIsFocused: () => true,
}))

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    defaults: { headers: { common: {} } },
  },
  setAuthToken: jest.fn(),
}))

const apiClient = require('../../config/apiClient').default

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'userName') return 'Rubens'
      if (key === 'totalAcertos') return '20'
      if (key === 'totalErros') return '10'
      if (key === 'token') return 'token123'
      if (key === 'userId') return 'u1'
      if (key === 'isGlobalAdmin') return 'false'
      if (key === 'userPermissions')
        return JSON.stringify({
          soma: true,
          menos: true,
          vezes: true,
          dividir: true,
          todas: true,
        })
      return null
    })
    apiClient.get.mockImplementation(async (url) => {
      if (url === '/tips/random') {
        return {
          data: {
            tip: 'Use desenhos para memorizar a tabuada.',
          },
        }
      }

      if (url === '/auth/login/u1') {
        return {
          data: {
            user: {
              isGlobalAdmin: false,
              permissoes: {
                soma: true,
                menos: true,
                vezes: true,
                dividir: true,
                todas: true,
              },
            },
          },
        }
      }

      return { data: {} }
    })
  })

  it('abre dica em modal proprio sem usar Alert nativo', async () => {
    const { getByLabelText, getByText, queryByText } = await renderAsync(
      <Header />
    )

    fireEvent.press(getByLabelText('Abrir dica'))

    await waitFor(() =>
      expect(getByText('Use desenhos para memorizar a tabuada.')).toBeTruthy()
    )
    expect(Alert.alert).not.toHaveBeenCalledWith(
      'Dica',
      'Use desenhos para memorizar a tabuada.'
    )

    fireEvent.press(getByText('OK'))

    await waitFor(() =>
      expect(queryByText('Use desenhos para memorizar a tabuada.')).toBeNull()
    )
  })

  it('mostra acesso ao painel admin no header quando a conta e global admin', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'userName') return 'Rubens'
      if (key === 'totalAcertos') return '20'
      if (key === 'totalErros') return '10'
      if (key === 'token') return 'token123'
      if (key === 'userId') return 'u1'
      if (key === 'isGlobalAdmin') return 'true'
      if (key === 'userPermissions')
        return JSON.stringify({
          soma: true,
          menos: true,
          vezes: true,
          dividir: true,
          todas: true,
        })
      return null
    })

    apiClient.get.mockImplementation(async (url) => {
      if (url === '/tips/random') {
        return {
          data: {
            tip: 'Use desenhos para memorizar a tabuada.',
          },
        }
      }

      if (url === '/auth/login/u1') {
        return {
          data: {
            user: {
              isGlobalAdmin: true,
              permissoes: {
                soma: true,
                menos: true,
                vezes: true,
                dividir: true,
                todas: true,
              },
            },
          },
        }
      }

      return { data: {} }
    })

    const { getByLabelText } = await renderAsync(<Header />)

    fireEvent.press(getByLabelText('Abrir painel administrador'))

    expect(mockNavigation.navigate).toHaveBeenCalledWith('AdminPanel')
  })

  it.each([
    ['Ver estrelas', 'Estrelas', 'A cada 10 acertos você ganha 1 estrelinha.'],
    [
      'Ver falhas',
      'Falhas',
      'A cada 10 erros você ganha 1 "dedão para baixo".',
    ],
    [
      'Ver calculadora',
      'Calculadora',
      'A cada 10 estrelas você ganha 1 calculadora; cada calculadora libera um novo nível.',
    ],
  ])('abre %s em modal proprio', async (label, title, message) => {
    const { getByLabelText, getByText, queryByText } = await renderAsync(
      <Header />
    )

    fireEvent.press(getByLabelText(label))

    await waitFor(() => expect(getByText(title)).toBeTruthy())
    expect(getByText(message)).toBeTruthy()
    expect(Alert.alert).not.toHaveBeenCalledWith(title, message)

    fireEvent.press(getByText('OK'))

    await waitFor(() => expect(queryByText(message)).toBeNull())
  })

  it('navega para Tabuada ao selecionar um numero do menu', async () => {
    const { getByLabelText, getByText } = await renderAsync(<Header />)

    fireEvent.press(getByLabelText('Abrir menu'))
    fireEvent.press(getByText('Adição'))
    fireEvent.press(getByLabelText('Abrir intervalo Adição 1 - 10'))
    fireEvent.press(getByText('01'))

    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'Tabuada',
      expect.objectContaining({ selectedOperation: 'soma01' })
    )
  })

  it('abre a tela de sobre pelo menu hamburger', async () => {
    const { getByLabelText, getByText } = await renderAsync(<Header />)

    fireEvent.press(getByLabelText('Abrir menu'))
    fireEvent.press(getByText('Sobre o aplicativo'))

    expect(mockNavigation.navigate).toHaveBeenCalledWith('About')
  })

  it('mostra apenas intervalos antes de abrir um intervalo', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'userName') return 'Rubens'
      if (key === 'totalAcertos') return '100'
      if (key === 'totalErros') return '0'
      if (key === 'token') return 'token123'
      if (key === 'userId') return 'u1'
      if (key === 'userPermissions')
        return JSON.stringify({
          soma: true,
          menos: true,
          vezes: true,
          dividir: true,
          todas: true,
        })
      return null
    })

    const { getByLabelText, getByText, queryByText } = await renderAsync(
      <Header />
    )

    fireEvent.press(getByLabelText('Abrir menu'))
    fireEvent.press(getByText('Todas'))

    expect(getByText('1 - 10')).toBeTruthy()
    expect(getByText('11 - 20')).toBeTruthy()
    expect(queryByText('01')).toBeNull()

    fireEvent.press(getByLabelText('Abrir intervalo Todas 1 - 10'))

    expect(getByText('01')).toBeTruthy()
  })

  it('limita intervalos pelo numero de calculadoras', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'userName') return 'Rubens'
      if (key === 'totalAcertos') return '0'
      if (key === 'totalErros') return '0'
      if (key === 'token') return 'token123'
      if (key === 'userId') return 'u1'
      if (key === 'userPermissions')
        return JSON.stringify({
          soma: true,
          menos: true,
          vezes: true,
          dividir: true,
          todas: true,
        })
      return null
    })

    const { getByLabelText, getByText, queryByText } = await renderAsync(
      <Header />
    )

    fireEvent.press(getByLabelText('Abrir menu'))
    fireEvent.press(getByText('Todas'))

    expect(getByText('1 - 10')).toBeTruthy()
    expect(queryByText('11 - 20')).toBeNull()
  })

  it('mostra opcao aleatoria no intervalo e navega com numero sorteado', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9)

    const { getByLabelText, getByText } = await renderAsync(<Header />)

    fireEvent.press(getByLabelText('Abrir menu'))
    fireEvent.press(getByText('Adição'))
    fireEvent.press(getByLabelText('Abrir intervalo Adição 1 - 10'))
    fireEvent.press(getByLabelText('Aleatório Adição 1 - 10'))

    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'Tabuada',
      expect.objectContaining({ selectedOperation: 'soma10' })
    )
  })

  it('esconde operacoes sem permissao no menu hamburger', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'userName') return 'Rubens'
      if (key === 'totalAcertos') return '20'
      if (key === 'totalErros') return '10'
      if (key === 'token') return 'token123'
      if (key === 'userId') return 'u1'
      if (key === 'userPermissions')
        return JSON.stringify({
          soma: true,
          menos: false,
          vezes: false,
          dividir: false,
          todas: false,
        })
      return null
    })

    apiClient.get.mockImplementation(async (url) => {
      if (url === '/tips/random') {
        return { data: { tip: 'Use desenhos para memorizar a tabuada.' } }
      }

      if (url === '/auth/login/u1') {
        return {
          data: {
            user: {
              permissoes: {
                soma: true,
                menos: false,
                vezes: false,
                dividir: false,
                todas: false,
              },
            },
          },
        }
      }

      return { data: {} }
    })

    const { getByLabelText, getByText, queryByText } = await renderAsync(
      <Header />
    )

    fireEvent.press(getByLabelText('Abrir menu'))

    expect(getByText('Adição')).toBeTruthy()
    expect(queryByText('Todas')).toBeNull()
    expect(queryByText('Subtração')).toBeNull()
    expect(queryByText('Multiplicação')).toBeNull()
    expect(queryByText('Divisão')).toBeNull()
  })
})
