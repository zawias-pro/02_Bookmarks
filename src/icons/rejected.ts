import type { ClientResponseError } from 'pocketbase'

// PocketBase validates an uploaded icon by sniffing its bytes, not by its name or header.
const faviconRejected = (error: unknown) => {
  const response = error as ClientResponseError
  return response?.status === 400 && response.data?.data?.favicon?.code === 'validation_invalid_mime_type'
}

export { faviconRejected }
