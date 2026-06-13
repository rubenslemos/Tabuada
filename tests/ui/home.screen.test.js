import { renderAsync, fireEvent } from '@testing-library/react-native'
import HomeScreen from '../../screens/HomeScreen'

jest.mock('../../components/Header', () => () => null)

describe('HomeScreen', () => {
  it('navega para Tabuada ao clicar no botao principal', async () => {
    const navigation = { navigate: jest.fn() }
    const { getByText } = await renderAsync(
      <HomeScreen navigation={navigation} />
    )

    fireEvent.press(getByText('Jogar Tabuada'))
    expect(navigation.navigate).toHaveBeenCalledWith('Tabuada')
  })
})
