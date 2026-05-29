import React from 'react'
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

  it('registra com sucesso e volta para login', async () => {
    apiClient.post.mockResolvedValue({ data: {} })

    const { getAllByText } = await renderAsync(
      <RegisterScreen navigation={navigation} />
    )
    fireEvent.press(getAllByText('Registrar')[1])

    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('Login')
    )
    expect(Alert.alert).toHaveBeenCalledWith(
      'Sucesso',
      'Registro realizado com sucesso!'
    )
  })

  it('mostra erro amigavel no registro', async () => {
    apiClient.post.mockRejectedValue({
      response: { data: { Msg: 'E-mail já existe' } },
    })

    const { getAllByText } = await renderAsync(
      <RegisterScreen navigation={navigation} />
    )
    fireEvent.press(getAllByText('Registrar')[1])

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'E-mail já existe')
    )
  })
})
