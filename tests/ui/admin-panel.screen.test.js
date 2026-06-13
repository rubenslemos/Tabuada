import { renderAsync, fireEvent, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AdminPanelScreen from '../../screens/AdminPanelScreen'

const mockHeaderNavigation = {
  navigate: jest.fn(),
  reset: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockHeaderNavigation,
  useIsFocused: () => true,
}))

jest.mock('../../config/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
  setAuthToken: jest.fn(),
}))

const apiClient = require('../../config/apiClient').default

describe('AdminPanelScreen', () => {
  const navigation = {
    navigate: jest.fn(),
    reset: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    AsyncStorage.multiRemove = jest.fn(async () => {})
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'token') return 'admin-token'
      return null
    })
  })

  async function openMenuItem(screen, label) {
    fireEvent.press(screen.getByLabelText('Abrir menu'))
    await waitFor(() => expect(screen.getByText(label)).toBeTruthy())
    fireEvent.press(screen.getByText(label))
  }

  function mockBaseRequests() {
    apiClient.get.mockImplementation((url) => {
      if (
        url === '/admin/organizations' ||
        url.startsWith('/admin/organizations?')
      ) {
        return Promise.resolve({
          data: {
            items: [
              {
                _id: 'org1',
                name: 'Casa Alpha',
                status: 'active',
                userCount: 2,
                pendingInvites: 1,
                document: '11222333000181',
                contactEmail: 'coord@alpha.com',
              },
            ],
            pagination: {
              page: 1,
              pageSize: 6,
              totalItems: 1,
              totalPages: 1,
            },
          },
        })
      }
      if (url === '/admin/organizations/org1/users') {
        return Promise.resolve({
          data: [
            {
              _id: 'user1',
              name: 'Responsavel 1',
              tipo: 'Pais',
              turma: 'A1',
              email: 'prof@alpha.com',
            },
          ],
        })
      }
      if (url === '/admin/organizations/org1/users?tipo=Pais') {
        return Promise.resolve({
          data: [
            {
              _id: 'user1',
              name: 'Responsavel 1',
              tipo: 'Pais',
              turma: 'A1',
              email: 'prof@alpha.com',
            },
          ],
        })
      }
      if (url === '/admin/organizations/org1/summary') {
        return Promise.resolve({
          data: {
            metrics: {
              totalUsers: 2,
              totalDependentes: 1,
              totalPais: 1,
              totalInvites: 3,
              pendingInvites: 1,
              totalRounds: 4,
              totalJogos: 18,
              totalAcertos: 12,
              totalErros: 6,
            },
            recentRounds: [
              {
                _id: 'round1',
                jogou: 6,
                acerto: 4,
                errou: 2,
                user: {
                  _id: 'user1',
                  name: 'Responsavel 1',
                  tipo: 'Pais',
                },
              },
            ],
          },
        })
      }
      if (url.startsWith('/admin/organizations/org1/invites?')) {
        const isFilteredRequest =
          url.includes('status=used') ||
          url.includes('role=Pais') ||
          url.includes('search=filtrado')
        return Promise.resolve({
          data: {
            items: [
              isFilteredRequest
                ? {
                    _id: 'invite-filtered',
                    email: 'filtrado@alpha.com',
                    role: 'Pais',
                    createdAt: '2030-01-01T00:00:00.000Z',
                    expiresAt: '2030-02-01T00:00:00.000Z',
                  }
                : {
                    _id: 'invite1',
                    email: 'novo@alpha.com',
                    role: 'Dependentes',
                    createdAt: '2030-01-01T00:00:00.000Z',
                    expiresAt: '2030-02-01T00:00:00.000Z',
                  },
            ],
            pagination: {
              page: 1,
              pageSize: 6,
              totalItems: 1,
              totalPages: 1,
            },
          },
        })
      }
      return Promise.resolve({ data: [] })
    })
  }

  it('mantem o header e remove o bloco antigo de acesso rapido', async () => {
    mockBaseRequests()

    const screen = await renderAsync(
      <AdminPanelScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(screen.getByText('Painel do Administrador')).toBeTruthy()
    )

    expect(screen.getByLabelText('Abrir menu')).toBeTruthy()
    expect(screen.queryByText('Acesso rápido')).toBeNull()
    expect(screen.queryByText('Painel Admin ativo')).toBeNull()
    expect(screen.queryByText('Sair do painel')).toBeNull()
  })

  it('cria instituicao manualmente pela subpagina do menu', async () => {
    mockBaseRequests()
    apiClient.post.mockImplementation((url) => {
      if (url === '/admin/organizations') {
        return Promise.resolve({
          data: {
            organization: {
              _id: 'org2',
              name: 'Casa Beta',
            },
          },
        })
      }
      return Promise.resolve({ data: {} })
    })

    const screen = await renderAsync(
      <AdminPanelScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(screen.getByText('Painel do Administrador')).toBeTruthy()
    )
    await openMenuItem(screen, 'Criar casa manualmente')

    fireEvent.changeText(
      screen.getByPlaceholderText('Nome da casa'),
      'Casa Beta'
    )
    fireEvent.changeText(
      screen.getByPlaceholderText('CPF do responsável'),
      '11222333000181'
    )
    fireEvent.changeText(
      screen.getByPlaceholderText('Email do responsável'),
      'coord@beta.com'
    )
    fireEvent.press(screen.getByText('Criar casa'))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/admin/organizations',
        {
          name: 'Casa Beta',
          document: '11222333000181',
          contactEmail: 'coord@beta.com',
        },
        expect.any(Object)
      )
    )
  })

  it('usa o menu para voltar a tabuada e sair do painel', async () => {
    mockBaseRequests()

    const screen = await renderAsync(
      <AdminPanelScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(screen.getByText('Painel do Administrador')).toBeTruthy()
    )

    await openMenuItem(screen, 'Voltar para Tabuada')
    expect(navigation.navigate).toHaveBeenCalledWith('Tabuada')

    await openMenuItem(screen, 'Sair do painel')

    await waitFor(() =>
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'token',
        'userId',
        'userName',
        'userPermissions',
        'totalAcertos',
        'totalJogos',
        'totalErros',
        'userOrganizationName',
        'isGlobalAdmin',
      ])
    )
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Login' }],
    })
  })

  it('reenvia convite pendente na subpagina de convites', async () => {
    mockBaseRequests()
    apiClient.post.mockImplementation((url) => {
      if (url === '/admin/invites/invite1/resend') {
        return Promise.resolve({
          data: { message: 'Convite reenviado com sucesso.' },
        })
      }
      return Promise.resolve({ data: {} })
    })

    const screen = await renderAsync(
      <AdminPanelScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(screen.getByText('Painel do Administrador')).toBeTruthy()
    )
    await openMenuItem(screen, 'Convites enviados')

    fireEvent.press(screen.getByText('Reenviar convite'))

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/admin/invites/invite1/resend',
        {},
        expect.any(Object)
      )
    )
  })

  it('edita instituicao selecionada na subpagina de instituicoes', async () => {
    mockBaseRequests()
    apiClient.patch.mockResolvedValue({
      data: {
        organization: {
          _id: 'org1',
          name: 'Casa Alpha Editada',
        },
      },
    })

    const screen = await renderAsync(
      <AdminPanelScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(screen.getByText('Editar casa selecionada')).toBeTruthy()
    )

    fireEvent.changeText(
      screen.getByDisplayValue('Casa Alpha'),
      'Casa Alpha Editada'
    )
    fireEvent.press(screen.getByText('Salvar casa'))

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/admin/organizations/org1',
        expect.objectContaining({ name: 'Casa Alpha Editada' }),
        expect.any(Object)
      )
    )
  })

  it('filtra convites por status e perfil usando lista selecionavel', async () => {
    mockBaseRequests()

    const screen = await renderAsync(
      <AdminPanelScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(screen.getByText('Painel do Administrador')).toBeTruthy()
    )
    await openMenuItem(screen, 'Convites enviados')

    fireEvent.press(screen.getAllByText('Todos')[0])
    fireEvent.press(screen.getByText('Usados'))
    fireEvent.press(screen.getByText('Todos'))
    fireEvent.press(screen.getByText('Pais'))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith(
        '/admin/organizations/org1/invites?status=used&page=1&pageSize=6&sortBy=createdAt&sortOrder=desc&role=Pais',
        expect.any(Object)
      )
    )
  })

  it('busca instituicoes e convites com paginacao nas subpaginas', async () => {
    mockBaseRequests()

    const screen = await renderAsync(
      <AdminPanelScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(screen.getByText('Casa selecionada')).toBeTruthy()
    )

    await openMenuItem(screen, 'Convites enviados')
    fireEvent.changeText(
      screen.getByPlaceholderText('Buscar convite por email'),
      'filtrado'
    )

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith(
        '/admin/organizations/org1/invites?status=all&page=1&pageSize=6&sortBy=createdAt&sortOrder=desc&search=filtrado',
        expect.any(Object)
      )
    )
  })

  it('mostra resumo e permite ordenar listas com os novos seletores', async () => {
    mockBaseRequests()

    const screen = await renderAsync(
      <AdminPanelScreen navigation={navigation} />
    )

    await waitFor(() => expect(screen.getByText('Resumo da casa')).toBeTruthy())

    expect(screen.getByText('Usuários')).toBeTruthy()
    expect(screen.getByText('Convites')).toBeTruthy()
    expect(screen.getByText('Últimas rodadas da casa')).toBeTruthy()
    expect(screen.getAllByText('Responsavel 1').length).toBeGreaterThan(0)

    await openMenuItem(screen, 'Convites enviados')
    fireEvent.press(screen.getByText('Mais recentes'))
    fireEvent.press(screen.getByText('Email A-Z'))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith(
        '/admin/organizations/org1/invites?status=all&page=1&pageSize=6&sortBy=email&sortOrder=asc',
        expect.any(Object)
      )
    )
  })

  it('filtra instituicoes por status e usuarios por tipo', async () => {
    mockBaseRequests()

    const screen = await renderAsync(
      <AdminPanelScreen navigation={navigation} />
    )

    await waitFor(() =>
      expect(screen.getByText('Casa selecionada')).toBeTruthy()
    )

    await openMenuItem(screen, 'Usuários da casa')
    fireEvent.press(screen.getByText('Todos'))
    fireEvent.press(screen.getByText('Pais'))

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith(
        '/admin/organizations/org1/users?tipo=Pais',
        expect.any(Object)
      )
    )
  })
})
