import { Alert, Share } from 'react-native'
import { fireEvent, renderAsync, waitFor } from '@testing-library/react-native'
import AboutScreen from '../../screens/AboutScreen'

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
  reset: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useIsFocused: () => true,
}))

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async () => ({ data: {} })),
    defaults: { headers: { common: {} } },
  },
  setAuthToken: jest.fn(),
}))

describe('AboutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    jest.spyOn(Share, 'share').mockResolvedValue({})
  })

  it('renderiza explicacao do app e compartilha a chave pix', async () => {
    const screen = await renderAsync(
      <AboutScreen navigation={mockNavigation} />
    )

    await waitFor(() => expect(screen.getByText('Sobre o App')).toBeTruthy())

    expect(screen.getByText('Apoie o desenvolvedor')).toBeTruthy()

    fireEvent.press(screen.getByText('Compartilhar chave Pix'))

    await waitFor(() =>
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            '1c135bc4-4cfb-4f6a-beac-90b6d7ee2d58'
          ),
        })
      )
    )
  })
})
