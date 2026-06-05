export function getErrorMessage(error, fallback = 'Ocorreu um erro') {
  const status = error?.response?.status
  const serverMessage =
    error?.response?.data?.Msg ||
    error?.response?.data?.error ||
    error?.response?.data?.message
  const axiosMessage = error?.message

  if (serverMessage) {
    return serverMessage
  }

  if (status === 404) {
    return fallback || 'Não encontramos as informações solicitadas.'
  }

  if (status === 401) {
    return 'Sua sessão expirou. Entre novamente para continuar.'
  }

  if (status === 403) {
    return 'Você não tem permissão para acessar esta informação.'
  }

  if (status >= 500) {
    return 'O servidor encontrou um problema. Tente novamente em instantes.'
  }

  if (axiosMessage === 'Network Error') {
    return 'Não foi possível se comunicar com o servidor. Verifique sua conexão.'
  }

  if (
    axiosMessage &&
    !axiosMessage.startsWith('Request failed with status code')
  ) {
    return axiosMessage
  }

  return fallback
}
