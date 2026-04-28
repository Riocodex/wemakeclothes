const STORAGE_KEY = 'wmc_designs_v1'

const readAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

const writeAll = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const saveDesign = ({ title, design, previewImage, sceneTheme }) => {
  const now = new Date().toISOString()
  const record = {
    id: crypto.randomUUID(),
    title,
    design,
    previewImage,
    sceneTheme,
    createdAt: now,
    updatedAt: now,
  }

  const existing = readAll()
  existing.unshift(record)
  writeAll(existing)
  return record
}

export const listDesigns = () => readAll()

export const getDesignById = (id) => readAll().find((item) => item.id === id) || null

export const deleteDesignById = (id) => {
  const existing = readAll()
  const next = existing.filter((item) => item.id !== id)
  writeAll(next)
  return next.length !== existing.length
}
