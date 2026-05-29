process.env.DOTENV_CONFIG_QUIET = 'true'

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})
