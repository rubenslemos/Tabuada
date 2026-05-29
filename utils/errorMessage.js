export function getErrorMessage(error, fallback = 'Ocorreu um erro') {
  return (
    error?.response?.data?.Msg ||
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}
