import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import apiClient, { setAuthToken } from '../config/apiClient'
import ClassroomBackground from '../components/ClassroomBackground'
import ChalkPanel from '../components/ChalkPanel'
import Header from '../components/Header'
import { COLORS, FONTS } from '../src/theme'
import { getErrorMessage } from '../utils/errorMessage'

const ROLES = ['Dependentes', 'Pais']
const INVITE_STATUSES = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'used', label: 'Usados' },
  { key: 'expired', label: 'Expirados' },
]
const INVITE_ROLE_FILTERS = ['Todos', ...ROLES]
const USER_TYPE_FILTERS = ['Todos', ...ROLES]
const INITIAL_ORG_FORM = {
  name: '',
  document: '',
  contactEmail: '',
}
const DEFAULT_PAGE_SIZE = 6
const INITIAL_PAGINATION = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
}
const INVITE_SORT_OPTIONS = [
  { key: 'createdAt:desc', label: 'Mais recentes' },
  { key: 'email:asc', label: 'Email A-Z' },
  { key: 'role:asc', label: 'Tipo' },
  { key: 'expiresAt:asc', label: 'Expira antes' },
]
const INITIAL_SUMMARY = {
  metrics: {
    totalUsers: 0,
    totalDependentes: 0,
    totalPais: 0,
    totalInvites: 0,
    pendingInvites: 0,
    totalRounds: 0,
    totalJogos: 0,
    totalAcertos: 0,
    totalErros: 0,
  },
  recentRounds: [],
}
const ADMIN_SECTIONS = [
  { key: 'createOrg', label: 'Criar casa manualmente' },
  { key: 'organizations', label: 'Casas' },
  { key: 'invite', label: 'Gerar convite' },
  { key: 'invites', label: 'Convites enviados' },
  { key: 'users', label: 'Usuários da casa' },
]
const INPUT_PLACEHOLDER_COLOR = 'rgba(255, 248, 209, 0.72)'

function dedupeById(items = [], getId) {
  const seen = new Set()
  return items.filter((item, index) => {
    const rawId = getId(item, index)
    const id = rawId == null ? `idx-${index}` : String(rawId)
    if (seen.has(id)) {
      return false
    }
    seen.add(id)
    return true
  })
}

function getInviteStatusLabel(invite) {
  if (invite?.usedAt) return 'Usado'
  if (invite?.expiresAt && new Date(invite.expiresAt) <= new Date()) {
    return 'Expirado'
  }
  return 'Pendente'
}

function SelectField({ label, value, options, isOpen, onToggle, onSelect }) {
  return (
    <View style={styles.selectFieldWrap}>
      <Text style={styles.selectFieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.selectFieldButton} onPress={onToggle}>
        <View style={styles.selectFieldValueWrap}>
          <View style={styles.selectFieldBadge} />
          <Text style={styles.selectFieldValue}>{value}</Text>
        </View>
        <Text style={styles.selectFieldArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen ? (
        <View style={styles.selectFieldList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.selectFieldOption,
                option.label === value && styles.selectFieldOptionActive,
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[
                  styles.selectFieldOptionText,
                  option.label === value && styles.selectFieldOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {option.label === value ? (
                <Text style={styles.selectFieldOptionMark}>✓</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  )
}

export default function AdminPanelScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [hasBootstrapped, setHasBootstrapped] = useState(false)
  const [activeSection, setActiveSection] = useState('organizations')
  const [openSelect, setOpenSelect] = useState(null)
  const [organizations, setOrganizations] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState(null)
  const [summary, setSummary] = useState(INITIAL_SUMMARY)
  const [users, setUsers] = useState([])
  const [userTypeFilter, setUserTypeFilter] = useState('Todos')
  const [invites, setInvites] = useState([])
  const [inviteSearch, setInviteSearch] = useState('')
  const [inviteSortKey, setInviteSortKey] = useState('createdAt:desc')
  const [invitePage, setInvitePage] = useState(1)
  const [invitePagination, setInvitePagination] = useState(INITIAL_PAGINATION)
  const [inviteStatus, setInviteStatus] = useState('all')
  const [inviteRoleFilter, setInviteRoleFilter] = useState('Todos')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Dependentes')
  const [orgForm, setOrgForm] = useState(INITIAL_ORG_FORM)
  const [editOrgForm, setEditOrgForm] = useState(INITIAL_ORG_FORM)
  const [feedback, setFeedback] = useState('')
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [editingOrg, setEditingOrg] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [resendingInviteId, setResendingInviteId] = useState(null)
  const requestIdsRef = useRef({
    organizations: 0,
    summary: 0,
    users: 0,
    invites: 0,
    syncDetails: 0,
  })

  const selectedOrg = useMemo(
    () =>
      organizations.find((org) => String(org._id) === String(selectedOrgId)) ||
      null,
    [organizations, selectedOrgId]
  )

  function handlePanelError(error, fallbackMessage) {
    setFeedback(getErrorMessage(error, fallbackMessage))
  }

  function nextRequestId(scope) {
    requestIdsRef.current[scope] += 1
    return requestIdsRef.current[scope]
  }

  function isLatestRequest(scope, requestId) {
    return requestIdsRef.current[scope] === requestId
  }

  async function syncOrganizationDetails(organizationId, tokenOverride) {
    const syncRequestId = nextRequestId('syncDetails')
    const [summaryResult, usersResult, invitesResult] =
      await Promise.allSettled([
        loadSummary(organizationId, tokenOverride),
        loadUsers(organizationId, tokenOverride),
        loadInvites(organizationId, tokenOverride),
      ])

    if (!isLatestRequest('syncDetails', syncRequestId)) {
      return
    }

    if (summaryResult.status === 'rejected') {
      setSummary(INITIAL_SUMMARY)
      handlePanelError(
        summaryResult.reason,
        'Nao foi possivel carregar o resumo da casa.'
      )
    }

    if (usersResult.status === 'rejected') {
      setUsers([])
      handlePanelError(
        usersResult.reason,
        'Nao foi possivel carregar os usuarios da casa.'
      )
    }

    if (invitesResult.status === 'rejected') {
      setInvites([])
      setInvitePagination(INITIAL_PAGINATION)
      handlePanelError(
        invitesResult.reason,
        'Nao foi possivel carregar os convites da casa.'
      )
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
          return
        }
        setAuthToken(token)
        await loadOrganizations(token)
      } catch (error) {
        setFeedback(
          getErrorMessage(error, 'Nao foi possivel carregar o painel.')
        )
      } finally {
        setHasBootstrapped(true)
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selectedOrg) {
      setEditOrgForm(INITIAL_ORG_FORM)
      return
    }

    setEditOrgForm({
      name: selectedOrg.name || '',
      document: selectedOrg.document || '',
      contactEmail: selectedOrg.contactEmail || '',
    })
  }, [selectedOrg])

  useEffect(() => {
    if (!hasBootstrapped) return
    ;(async () => {
      try {
        await loadOrganizations()
      } catch (error) {
        handlePanelError(error, 'Nao foi possivel atualizar as casas.')
      }
    })()
  }, [hasBootstrapped])

  useEffect(() => {
    if (!hasBootstrapped || !selectedOrgId) return
    ;(async () => {
      try {
        await loadUsers(selectedOrgId)
      } catch (error) {
        setUsers([])
        handlePanelError(error, 'Nao foi possivel carregar os usuarios.')
      }
    })()
  }, [hasBootstrapped, selectedOrgId, userTypeFilter])

  useEffect(() => {
    if (!hasBootstrapped || !selectedOrgId) return
    ;(async () => {
      try {
        await loadInvites(selectedOrgId)
      } catch (error) {
        setInvites([])
        setInvitePagination(INITIAL_PAGINATION)
        handlePanelError(error, 'Nao foi possivel carregar os convites.')
      }
    })()
  }, [
    hasBootstrapped,
    selectedOrgId,
    inviteStatus,
    inviteRoleFilter,
    inviteSearch,
    inviteSortKey,
    invitePage,
  ])

  async function loadOrganizations(tokenOverride) {
    const requestId = nextRequestId('organizations')
    const token = tokenOverride || (await AsyncStorage.getItem('token'))
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined
    const resp = await apiClient.get('/admin/organizations', { headers })
    const payload = resp.data
    const nextOrgs = dedupeById(
      Array.isArray(payload) ? payload : payload?.items || [],
      (org, index) => org?._id || org?.id || `org-${index}`
    )
    if (!isLatestRequest('organizations', requestId)) {
      return
    }

    setOrganizations(nextOrgs)

    if (nextOrgs.length === 0) {
      setSelectedOrgId(null)
      setSummary(INITIAL_SUMMARY)
      setUsers([])
      setInvites([])
      setInvitePagination(INITIAL_PAGINATION)
      return
    }

    const nextSelectedOrg = nextOrgs.find(
      (org) => String(org._id) === String(selectedOrgId)
    )
    const targetOrgId = nextSelectedOrg?._id || nextOrgs[0]._id
    setSelectedOrgId(targetOrgId)
    await syncOrganizationDetails(targetOrgId, token)
  }

  async function loadSummary(organizationId, tokenOverride) {
    const requestId = nextRequestId('summary')
    const token = tokenOverride || (await AsyncStorage.getItem('token'))
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined
    const resp = await apiClient.get(
      `/admin/organizations/${organizationId}/summary`,
      { headers }
    )
    const nextSummary = resp?.data || INITIAL_SUMMARY

    if (!isLatestRequest('summary', requestId)) {
      return
    }

    setSummary({
      ...nextSummary,
      recentRounds: dedupeById(
        nextSummary?.recentRounds || [],
        (round, index) => round?._id || round?.id || `round-${index}`
      ),
    })
  }

  async function loadUsers(organizationId, tokenOverride, tipoOverride) {
    const requestId = nextRequestId('users')
    const token = tokenOverride || (await AsyncStorage.getItem('token'))
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined
    const params = new URLSearchParams()
    const effectiveTipo = tipoOverride || userTypeFilter
    if (effectiveTipo !== 'Todos') params.set('tipo', effectiveTipo)
    const suffix = params.toString() ? `?${params.toString()}` : ''
    const resp = await apiClient.get(
      `/admin/organizations/${organizationId}/users${suffix}`,
      { headers }
    )

    if (!isLatestRequest('users', requestId)) {
      return
    }

    setUsers(
      dedupeById(Array.isArray(resp.data) ? resp.data : [], (user, index) => {
        return user?._id || user?.id || `${user?.email || 'user'}-${index}`
      })
    )
  }

  async function loadInvites(organizationId, tokenOverride) {
    const requestId = nextRequestId('invites')
    const token = tokenOverride || (await AsyncStorage.getItem('token'))
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined
    const params = new URLSearchParams()
    const [inviteSortBy, inviteSortOrder] = inviteSortKey.split(':')
    params.set('status', inviteStatus)
    params.set('page', String(invitePage))
    params.set('pageSize', String(DEFAULT_PAGE_SIZE))
    params.set('sortBy', inviteSortBy)
    params.set('sortOrder', inviteSortOrder || 'desc')
    if (inviteRoleFilter !== 'Todos') params.set('role', inviteRoleFilter)
    if (inviteSearch.trim()) params.set('search', inviteSearch.trim())

    const resp = await apiClient.get(
      `/admin/organizations/${organizationId}/invites?${params.toString()}`,
      { headers }
    )
    const payload = resp.data

    if (!isLatestRequest('invites', requestId)) {
      return
    }

    setInvites(
      dedupeById(
        Array.isArray(payload) ? payload : payload?.items || [],
        (invite, index) =>
          invite?._id || invite?.id || `${invite?.email || 'invite'}-${index}`
      )
    )
    setInvitePagination(
      Array.isArray(payload)
        ? {
            page: invitePage,
            pageSize: DEFAULT_PAGE_SIZE,
            totalItems: payload.length,
            totalPages: 1,
          }
        : payload?.pagination || INITIAL_PAGINATION
    )
  }

  async function handleSelectOrg(organizationId) {
    try {
      setSelectedOrgId(organizationId)
      setInvitePage(1)
      setInviteSearch('')
      setUserTypeFilter('Todos')
      setOpenSelect(null)
      setFeedback('')
      await syncOrganizationDetails(organizationId)
    } catch (error) {
      handlePanelError(error, 'Nao foi possivel trocar a casa selecionada.')
    }
  }

  async function handleToggleStatus(organization = selectedOrg) {
    if (!organization) return
    try {
      const token = await AsyncStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const nextStatus =
        organization.status === 'active' ? 'disabled' : 'active'
      await apiClient.patch(
        `/admin/organizations/${organization._id}/status`,
        { status: nextStatus },
        { headers }
      )
      setFeedback(
        `Casa ${nextStatus === 'active' ? 'ativada' : 'desativada'} com sucesso.`
      )
      await loadOrganizations(token)
    } catch (error) {
      setFeedback(getErrorMessage(error, 'Nao foi possivel atualizar a casa.'))
    }
  }

  async function handleCreateOrganization() {
    try {
      setCreatingOrg(true)
      const token = await AsyncStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const resp = await apiClient.post('/admin/organizations', orgForm, {
        headers,
      })
      const createdOrg = resp?.data?.organization
      setFeedback('Casa criada com sucesso.')
      setOrgForm(INITIAL_ORG_FORM)
      await loadOrganizations(token)
      if (createdOrg?._id) {
        setActiveSection('organizations')
        await handleSelectOrg(createdOrg._id)
      }
    } catch (error) {
      setFeedback(getErrorMessage(error, 'Nao foi possivel criar a casa.'))
    } finally {
      setCreatingOrg(false)
    }
  }

  async function handleEditOrganization() {
    if (!selectedOrg) return
    try {
      setEditingOrg(true)
      const token = await AsyncStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      await apiClient.patch(
        `/admin/organizations/${selectedOrg._id}`,
        editOrgForm,
        { headers }
      )
      setFeedback('Casa atualizada com sucesso.')
      await loadOrganizations(token)
    } catch (error) {
      setFeedback(getErrorMessage(error, 'Nao foi possivel editar a casa.'))
    } finally {
      setEditingOrg(false)
    }
  }

  async function handleInvite() {
    if (!selectedOrg) return
    try {
      setSendingInvite(true)
      const token = await AsyncStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const resp = await apiClient.post(
        `/admin/organizations/${selectedOrg._id}/invites`,
        { email: inviteEmail, role: inviteRole },
        { headers }
      )
      setInviteEmail('')
      setFeedback(resp.data?.message || 'Convite gerado com sucesso.')
      await loadOrganizations(token)
      await loadInvites(selectedOrg._id, token)
      setActiveSection('invites')
    } catch (error) {
      setFeedback(getErrorMessage(error, 'Nao foi possivel gerar o convite.'))
    } finally {
      setSendingInvite(false)
    }
  }

  async function handleResendInvite(inviteId) {
    try {
      setResendingInviteId(inviteId)
      const token = await AsyncStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const resp = await apiClient.post(
        `/admin/invites/${inviteId}/resend`,
        {},
        { headers }
      )
      setFeedback(resp.data?.message || 'Convite reenviado com sucesso.')
      if (selectedOrg?._id) {
        await loadInvites(selectedOrg._id, token)
      }
    } catch (error) {
      setFeedback(
        getErrorMessage(error, 'Nao foi possivel reenviar o convite.')
      )
    } finally {
      setResendingInviteId(null)
    }
  }

  async function handleLogout() {
    await AsyncStorage.multiRemove([
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
    setAuthToken(null)
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    )
  }

  const activeSectionLabel =
    ADMIN_SECTIONS.find((section) => section.key === activeSection)?.label ||
    'Casas'

  const adminMenuItems = [
    ...ADMIN_SECTIONS.map((section) => ({
      key: section.key,
      label: section.label,
      onPress: () => {
        setOpenSelect(null)
        setActiveSection(section.key)
      },
    })),
    {
      key: 'backTabuada',
      label: 'Voltar para Tabuada',
      onPress: () => navigation.navigate('Tabuada'),
    },
    {
      key: 'logout',
      label: 'Sair do painel',
      danger: true,
      onPress: handleLogout,
    },
  ]

  const inviteSortOptions = INVITE_SORT_OPTIONS.map((item) => ({
    key: item.key,
    label: item.label,
  }))
  const inviteStatusOptions = INVITE_STATUSES.map((item) => ({
    key: item.key,
    label: item.label,
  }))
  const inviteRoleOptions = INVITE_ROLE_FILTERS.map((item) => ({
    key: item,
    label: item,
  }))
  const userTypeOptions = USER_TYPE_FILTERS.map((item) => ({
    key: item,
    label: item,
  }))
  const organizationOptions = organizations.map((org) => ({
    key: String(org._id),
    label: org.name,
  }))

  const renderSelectedOrgHint = (message) => {
    const hintMessage =
      organizations.length === 0 ? 'Ainda não há casas cadastradas.' : message

    return (
      <View style={styles.section}>
        <Text style={styles.empty}>{hintMessage}</Text>
      </View>
    )
  }

  const renderOrganizationsSection = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Casas</Text>
        <SelectField
          label="Casa selecionada"
          value={selectedOrg?.name || 'Selecione uma casa'}
          options={organizationOptions}
          isOpen={openSelect === 'organization'}
          onToggle={() =>
            setOpenSelect((prev) =>
              prev === 'organization' ? null : 'organization'
            )
          }
          onSelect={async (option) => {
            setOpenSelect(null)
            await handleSelectOrg(option.key)
          }}
        />
        {selectedOrg ? (
          <View style={[styles.orgCard, styles.orgCardExpanded]}>
            <View style={styles.orgCardHeader}>
              <TouchableOpacity
                style={styles.orgCardMain}
                onPress={() => handleSelectOrg(selectedOrg._id)}
              >
                <Text style={[styles.orgName, styles.orgNameActive]}>
                  {selectedOrg.name}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.orgStatusBubble,
                  selectedOrg.status === 'active'
                    ? styles.orgStatusBubbleDanger
                    : styles.orgStatusBubbleActivate,
                ]}
                onPress={() => handleToggleStatus(selectedOrg)}
              >
                <Text style={styles.orgStatusBubbleText}>
                  {selectedOrg.status === 'active' ? '✕' : '✓'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.orgCardMain}>
              <Text style={styles.orgMeta}>Status: {selectedOrg.status}</Text>
              <Text style={styles.orgMeta}>
                Usuários: {selectedOrg.userCount || 0}
              </Text>
              <Text style={styles.orgMeta}>
                Convites: {selectedOrg.pendingInvites || 0}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.empty}>Selecione uma casa.</Text>
        )}
      </View>

      {selectedOrg ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo da casa</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Usuários</Text>
              <Text style={styles.summaryValue}>
                {summary.metrics.totalUsers}
              </Text>
              <Text style={styles.summaryMeta}>
                Dependentes {summary.metrics.totalDependentes} • Pais{' '}
                {summary.metrics.totalPais}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Convites</Text>
              <Text style={styles.summaryValue}>
                {summary.metrics.totalInvites}
              </Text>
              <Text style={styles.summaryMeta}>
                Pendentes {summary.metrics.pendingInvites}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Rodadas</Text>
              <Text style={styles.summaryValue}>
                {summary.metrics.totalRounds}
              </Text>
              <Text style={styles.summaryMeta}>
                Jogos {summary.metrics.totalJogos}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Acertos x Erros</Text>
              <Text style={styles.summaryValue}>
                {summary.metrics.totalAcertos} / {summary.metrics.totalErros}
              </Text>
              <Text style={styles.summaryMeta}>Totais da casa</Text>
            </View>
          </View>
          <View style={styles.recentWrap}>
            <Text style={styles.recentTitle}>Últimas rodadas da casa</Text>
            {summary.recentRounds.length === 0 ? (
              <Text style={styles.empty}>
                Ainda não há rodadas registradas nesta casa.
              </Text>
            ) : (
              summary.recentRounds.map((round) => (
                <View key={String(round._id)} style={styles.recentCard}>
                  <Text style={styles.userName}>{round.user?.name}</Text>
                  <Text style={styles.userMeta}>
                    {round.user?.tipo} • {round.jogou} jogadas
                  </Text>
                  <Text style={styles.userMeta}>
                    Acertos {round.acerto} • Erros {round.errou}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      ) : null}

      {selectedOrg ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Editar casa selecionada</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome da casa"
            placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
            value={editOrgForm.name}
            onChangeText={(value) =>
              setEditOrgForm((prev) => ({ ...prev, name: value }))
            }
          />
          <TextInput
            style={styles.input}
            placeholder="CPF do responsável"
            placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
            value={editOrgForm.document}
            onChangeText={(value) =>
              setEditOrgForm((prev) => ({ ...prev, document: value }))
            }
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email do responsável"
            placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
            value={editOrgForm.contactEmail}
            onChangeText={(value) =>
              setEditOrgForm((prev) => ({ ...prev, contactEmail: value }))
            }
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleEditOrganization}
          >
            <Text style={styles.primaryButtonText}>
              {editingOrg ? 'Salvando...' : 'Salvar casa'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  )

  const renderCreateOrgSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Criar casa manualmente</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome da casa"
        placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
        value={orgForm.name}
        onChangeText={(value) =>
          setOrgForm((prev) => ({ ...prev, name: value }))
        }
      />
      <TextInput
        style={styles.input}
        placeholder="CPF do responsável"
        placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
        value={orgForm.document}
        onChangeText={(value) =>
          setOrgForm((prev) => ({ ...prev, document: value }))
        }
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email do responsável"
        placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
        value={orgForm.contactEmail}
        onChangeText={(value) =>
          setOrgForm((prev) => ({ ...prev, contactEmail: value }))
        }
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleCreateOrganization}
      >
        <Text style={styles.primaryButtonText}>
          {creatingOrg ? 'Criando...' : 'Criar casa'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderInviteSection = () => {
    if (!selectedOrg) {
      return renderSelectedOrgHint('Selecione uma casa para gerar convites.')
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gerar convite</Text>
        <Text style={styles.sectionHelper}>{selectedOrg.name}</Text>
        <TextInput
          style={styles.input}
          placeholder="Email do usuário"
          placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
          value={inviteEmail}
          onChangeText={setInviteEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <SelectField
          label="Perfil do convite"
          value={inviteRole}
          options={ROLES.map((role) => ({ key: role, label: role }))}
          isOpen={openSelect === 'inviteRoleCreate'}
          onToggle={() =>
            setOpenSelect((prev) =>
              prev === 'inviteRoleCreate' ? null : 'inviteRoleCreate'
            )
          }
          onSelect={(option) => {
            setInviteRole(option.key)
            setOpenSelect(null)
          }}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleInvite}>
          <Text style={styles.primaryButtonText}>
            {sendingInvite ? 'Enviando...' : 'Enviar convite'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderInvitesSection = () => {
    if (!selectedOrg) {
      return renderSelectedOrgHint('Selecione uma casa para ver os convites.')
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Convites enviados</Text>
        <Text style={styles.sectionHelper}>{selectedOrg.name}</Text>
        <TextInput
          style={styles.input}
          placeholder="Buscar convite por email"
          placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
          value={inviteSearch}
          onChangeText={(value) => {
            setInvitePage(1)
            setInviteSearch(value)
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <SelectField
          label="Ordenar por"
          value={
            inviteSortOptions.find((item) => item.key === inviteSortKey)
              ?.label || 'Mais recentes'
          }
          options={inviteSortOptions}
          isOpen={openSelect === 'inviteSort'}
          onToggle={() =>
            setOpenSelect((prev) =>
              prev === 'inviteSort' ? null : 'inviteSort'
            )
          }
          onSelect={(option) => {
            setInvitePage(1)
            setInviteSortKey(option.key)
            setOpenSelect(null)
          }}
        />
        <SelectField
          label="Status"
          value={
            inviteStatusOptions.find((item) => item.key === inviteStatus)
              ?.label || 'Todos'
          }
          options={inviteStatusOptions}
          isOpen={openSelect === 'inviteStatus'}
          onToggle={() =>
            setOpenSelect((prev) =>
              prev === 'inviteStatus' ? null : 'inviteStatus'
            )
          }
          onSelect={(option) => {
            setInvitePage(1)
            setInviteStatus(option.key)
            setOpenSelect(null)
          }}
        />
        <SelectField
          label="Perfil"
          value={inviteRoleFilter}
          options={inviteRoleOptions}
          isOpen={openSelect === 'inviteRole'}
          onToggle={() =>
            setOpenSelect((prev) =>
              prev === 'inviteRole' ? null : 'inviteRole'
            )
          }
          onSelect={(option) => {
            setInvitePage(1)
            setInviteRoleFilter(option.key)
            setOpenSelect(null)
          }}
        />
        {invites.length === 0 ? (
          <Text style={styles.empty}>
            Nenhum convite encontrado para os filtros selecionados.
          </Text>
        ) : (
          invites.map((invite) => (
            <View key={String(invite._id)} style={styles.userCard}>
              <Text style={styles.userName}>{invite.email}</Text>
              <Text style={styles.userMeta}>{invite.role}</Text>
              <Text style={styles.userMeta}>
                Status: {getInviteStatusLabel(invite)}
              </Text>
              <Text style={styles.userMeta}>
                Criado em{' '}
                {new Date(
                  invite.createdAt || invite.expiresAt
                ).toLocaleDateString('pt-BR')}
              </Text>
              <Text style={styles.userMeta}>
                Expira em{' '}
                {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
              </Text>
              {!invite.usedAt ? (
                <TouchableOpacity
                  style={styles.smallActionButton}
                  onPress={() => handleResendInvite(invite._id)}
                >
                  <Text style={styles.smallActionButtonText}>
                    {resendingInviteId === invite._id
                      ? 'Reenviando...'
                      : 'Reenviar convite'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              invitePage <= 1 && styles.paginationButtonDisabled,
            ]}
            disabled={invitePage <= 1}
            onPress={() => setInvitePage((prev) => Math.max(1, prev - 1))}
          >
            <Text style={styles.paginationButtonText}>Anterior</Text>
          </TouchableOpacity>
          <Text style={styles.paginationLabel}>
            Página {invitePagination.page} de {invitePagination.totalPages}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              invitePage >= invitePagination.totalPages &&
                styles.paginationButtonDisabled,
            ]}
            disabled={invitePage >= invitePagination.totalPages}
            onPress={() =>
              setInvitePage((prev) =>
                Math.min(invitePagination.totalPages || 1, prev + 1)
              )
            }
          >
            <Text style={styles.paginationButtonText}>Próxima</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderUsersSection = () => {
    if (!selectedOrg) {
      return renderSelectedOrgHint(
        'Selecione uma casa para visualizar os usuários.'
      )
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usuários da casa</Text>
        <Text style={styles.sectionHelper}>{selectedOrg.name}</Text>
        <SelectField
          label="Tipo de usuário"
          value={userTypeFilter}
          options={userTypeOptions}
          isOpen={openSelect === 'userType'}
          onToggle={() =>
            setOpenSelect((prev) => (prev === 'userType' ? null : 'userType'))
          }
          onSelect={(option) => {
            setUserTypeFilter(option.key)
            setOpenSelect(null)
          }}
        />
        {users.length === 0 ? (
          <Text style={styles.empty}>
            Nenhum usuário encontrado para esse filtro.
          </Text>
        ) : (
          users.map((user) => (
            <View key={String(user._id || user.id)} style={styles.userCard}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userMeta}>{user.tipo}</Text>
              <Text style={styles.userMeta}>{user.email}</Text>
            </View>
          ))
        )}
      </View>
    )
  }

  let sectionContent = null
  if (activeSection === 'createOrg') sectionContent = renderCreateOrgSection()
  if (activeSection === 'organizations')
    sectionContent = renderOrganizationsSection()
  if (activeSection === 'invite') sectionContent = renderInviteSection()
  if (activeSection === 'invites') sectionContent = renderInvitesSection()
  if (activeSection === 'users') sectionContent = renderUsersSection()

  return (
    <ClassroomBackground stripeTop={120}>
      <Header
        menuTitle="Painel Admin"
        menuItems={adminMenuItems}
        activeMenuKey={activeSection}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <ChalkPanel style={styles.panel} boardStyle={styles.board}>
          <Text style={styles.title}>Painel do Administrador</Text>
          <Text style={styles.subtitle}>{activeSectionLabel}</Text>
          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
          {sectionContent}
        </ChalkPanel>
      </ScrollView>
    </ClassroomBackground>
  )
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 18, paddingBottom: 28, paddingHorizontal: 10 },
  panel: { width: '100%' },
  board: { padding: 16, gap: 14 },
  title: {
    color: COLORS.chalkText,
    fontFamily: FONTS.title,
    fontSize: 26,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.chalkText,
    opacity: 0.82,
    textAlign: 'center',
    fontFamily: FONTS.body,
  },
  feedback: {
    color: '#ffe082',
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
  section: { gap: 10 },
  sectionTitle: {
    color: COLORS.chalkText,
    fontFamily: FONTS.title,
    fontSize: 20,
  },
  sectionHelper: {
    color: '#fff8d1',
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,241,189,0.24)',
    backgroundColor: 'rgba(247,231,173,0.1)',
    padding: 12,
    gap: 4,
    shadowColor: '#1b1003',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  summaryLabel: {
    color: '#ffe082',
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  summaryValue: {
    color: COLORS.chalkText,
    fontFamily: FONTS.title,
    fontSize: 24,
  },
  summaryMeta: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    fontSize: 12,
    opacity: 0.84,
  },
  recentWrap: {
    marginTop: 2,
    gap: 8,
  },
  recentTitle: {
    color: COLORS.chalkText,
    fontFamily: FONTS.title,
    fontSize: 18,
  },
  recentCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,241,189,0.2)',
    backgroundColor: 'rgba(247,231,173,0.08)',
    padding: 10,
    gap: 3,
    shadowColor: '#1b1003',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  orgCard: {
    width: 180,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,241,189,0.24)',
    padding: 12,
    backgroundColor: 'rgba(247,231,173,0.1)',
    gap: 4,
    shadowColor: '#1b1003',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  orgCardExpanded: {
    width: '100%',
    minHeight: 112,
  },
  orgCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  orgCardMain: {
    flex: 1,
    gap: 4,
  },
  orgCardActive: {
    borderColor: '#ffe082',
    backgroundColor: 'rgba(255,214,90,0.2)',
    shadowOpacity: 0.26,
  },
  orgStatusBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#1b1003',
    shadowOpacity: 0.22,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orgStatusBubbleDanger: {
    backgroundColor: '#dc5f5f',
    borderColor: '#f6b0b0',
  },
  orgStatusBubbleActivate: {
    backgroundColor: '#5c9bf4',
    borderColor: '#d4e4ff',
  },
  orgStatusBubbleText: {
    color: '#fffdf1',
    fontFamily: FONTS.title,
    fontSize: 19,
    lineHeight: 19,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  orgName: { color: COLORS.chalkText, fontFamily: FONTS.title, fontSize: 18 },
  orgNameActive: { color: '#fff8d1' },
  orgMeta: { color: COLORS.chalkText, fontFamily: FONTS.body, fontSize: 13 },
  input: {
    minHeight: 50,
    borderColor: 'rgba(255,244,199,0.34)',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(247,231,173,0.14)',
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    fontSize: 15,
    shadowColor: '#1b1003',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  selectFieldWrap: {
    gap: 6,
  },
  selectFieldLabel: {
    color: '#ffd75a',
    fontFamily: FONTS.body,
    fontSize: 13,
    marginLeft: 4,
  },
  selectFieldButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,244,199,0.34)',
    backgroundColor: 'rgba(247,231,173,0.14)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1b1003',
    shadowOpacity: 0.24,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  selectFieldValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  selectFieldBadge: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#ffd75a',
    borderWidth: 1,
    borderColor: '#fff6d1',
  },
  selectFieldValue: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  selectFieldArrow: {
    color: '#ffe89a',
    fontSize: 12,
  },
  selectFieldList: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,241,189,0.28)',
    backgroundColor: 'rgba(12,51,40,0.96)',
    overflow: 'hidden',
    marginTop: 2,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  selectFieldOption: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectFieldOptionActive: {
    backgroundColor: 'rgba(255,215,90,0.16)',
  },
  selectFieldOptionText: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    fontSize: 15,
  },
  selectFieldOptionTextActive: {
    color: '#fff8d1',
  },
  selectFieldOptionMark: {
    color: '#ffd75a',
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#68bd62',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.42)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontFamily: FONTS.body, fontSize: 16 },
  secondaryButton: {
    backgroundColor: '#c59a3d',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#fff', fontFamily: FONTS.body, fontSize: 15 },
  smallActionButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#5a93d8',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallActionButtonText: {
    color: '#fff',
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  userCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,241,189,0.22)',
    backgroundColor: 'rgba(247,231,173,0.08)',
    padding: 12,
    gap: 4,
    shadowColor: '#1b1003',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  userName: { color: COLORS.chalkText, fontFamily: FONTS.title, fontSize: 18 },
  userMeta: { color: COLORS.chalkText, fontFamily: FONTS.body, fontSize: 13 },
  empty: { color: COLORS.chalkText, fontFamily: FONTS.body, opacity: 0.82 },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  paginationButton: {
    backgroundColor: 'rgba(247,231,173,0.14)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,241,189,0.24)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  paginationButtonDisabled: { opacity: 0.45 },
  paginationButtonText: {
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  paginationLabel: {
    flex: 1,
    color: COLORS.chalkText,
    fontFamily: FONTS.body,
    textAlign: 'center',
    fontSize: 14,
  },
})
