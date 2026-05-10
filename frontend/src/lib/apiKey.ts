const STORAGE_KEY = 'claude_api_key'

export const getStoredApiKey = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null

export const storeApiKey = (key: string): void =>
  localStorage.setItem(STORAGE_KEY, key)

export const removeApiKey = (): void =>
  localStorage.removeItem(STORAGE_KEY)

export const isValidApiKey = (key: string): boolean =>
  key.trim().startsWith('sk-ant-')
