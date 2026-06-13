import { Alert } from 'react-native'
import { renderAsync, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import TabuadaScreen from '../../screens/TabuadaScreen'

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    defaults: { headers: { common: {} } },
  },
  setAuthToken: jest.fn(),
}))

jest.mock('../../utils/tabuada', () => ({
  generateQuestion: jest.fn(() => ({
    num1: 2,
    num2: 2,
    opSymbol: '+',
    result: 4,
  })),
}))

jest.mock('../../components/Header', () => () => null)

const apiClient = require('../../config/apiClient').default
const { generateQuestion } = require('../../utils/tabuada')

describe('TabuadaScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    AsyncStorage.getItem.mockImplementation(async (key) => {
      const map = {
        token: 'token123',
        userId: 'u1',
        totalAcertos: '0',
        totalJogos: '0',
        totalErros: '0',
        userName: 'Rubens',
      }
      return map[key] ?? null
    })
    AsyncStorage.setItem.mockResolvedValue()
  })

  it('abre modal de resultado correto ao verificar resposta', async () => {
    const navigation = { goBack: jest.fn() }
    const { getByText, getByDisplayValue, queryByText } = await renderAsync(
      <TabuadaScreen navigation={navigation} />
    )

    expect(getByText('Qual o valor?')).toBeTruthy()
    fireEvent.changeText(getByDisplayValue(''), '4')
    fireEvent.press(getByText('Verificar'))

    await waitFor(() => expect(queryByText('Correto!')).toBeTruthy())
  })

  it('gera pergunta com operacao recebida pela navegacao', async () => {
    const navigation = { goBack: jest.fn() }
    await renderAsync(
      <TabuadaScreen
        navigation={navigation}
        route={{
          params: { selectedOperation: 'vezes05', selectedOperationKey: 1 },
        }}
      />
    )

    await waitFor(() =>
      expect(generateQuestion).toHaveBeenCalledWith('vezes05')
    )
  })

  it('mantem a configuracao escolhida nas proximas perguntas da rodada', async () => {
    generateQuestion
      .mockReturnValueOnce({
        num1: 10,
        num2: 10,
        opSymbol: '+',
        result: 20,
      })
      .mockReturnValueOnce({
        num1: 10,
        num2: 10,
        opSymbol: '+',
        result: 20,
      })

    const navigation = { goBack: jest.fn() }
    const { getByText, getByDisplayValue, queryByText } = await renderAsync(
      <TabuadaScreen
        navigation={navigation}
        route={{
          params: { selectedOperation: 'soma10', selectedOperationKey: 1 },
        }}
      />
    )

    fireEvent.changeText(getByDisplayValue(''), '20')
    fireEvent.press(getByText('Verificar'))

    await waitFor(() => expect(queryByText('Correto!')).toBeTruthy())

    fireEvent.press(getByText('Próxima'))

    await waitFor(() =>
      expect(generateQuestion).toHaveBeenLastCalledWith('soma10')
    )
  })

  it('envia resultados com sucesso e mostra confirmacao', async () => {
    apiClient.post.mockResolvedValue({ data: {} })
    const navigation = { goBack: jest.fn() }
    const { getByText } = await renderAsync(
      <TabuadaScreen navigation={navigation} />
    )

    fireEvent.press(getByText('Finalizar'))

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1))
    expect(Alert.alert).toHaveBeenCalledWith('Resultados enviados!')
  })

  it('mostra erro quando envio de resultados falha', async () => {
    apiClient.post.mockRejectedValue(new Error('fail'))
    const navigation = { goBack: jest.fn() }
    const { getByText } = await renderAsync(
      <TabuadaScreen navigation={navigation} />
    )

    fireEvent.press(getByText('Finalizar'))

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'fail')
    )
  })
})
