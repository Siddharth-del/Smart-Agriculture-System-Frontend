export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MIN_DIMENSION = 50 // matches ImageValidationService
const MAX_EDGE = 2000
const COMPRESS_OVER_BYTES = 2.5 * 1024 * 1024

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')) }
  img.src = url
})

/**
 * Validates an image the same way the backend does, and downsizes very large
 * phone photos so uploads work on slow rural connections.
 * Returns { file, width, height } or throws an Error with a user-facing message.
 */
export async function prepareLeafImage(file, maxMb) {
  if (!file) throw new Error('Choose a photo to upload.')
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error('Use a JPG, PNG or WEBP photo. HEIC photos from iPhone need to be exported as JPG first.')
  if (file.size > maxMb * 1024 * 1024 * 3) throw new Error(`This photo is too large. Use one under ${maxMb} MB.`)

  let img
  try { img = await loadImage(file) } catch { throw new Error('This file could not be opened as an image. Try another photo.') }
  const { naturalWidth: w, naturalHeight: h } = img
  if (w < MIN_DIMENSION || h < MIN_DIMENSION) throw new Error('This photo is too small. Use one at least 50 × 50 pixels.')

  const needsResize = file.size > COMPRESS_OVER_BYTES || Math.max(w, h) > MAX_EDGE
  if (!needsResize) {
    if (file.size > maxMb * 1024 * 1024) throw new Error(`This photo is too large. Use one under ${maxMb} MB.`)
    return { file, width: w, height: h }
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9))
  if (!blob) return { file, width: w, height: h }
  if (blob.size > maxMb * 1024 * 1024) throw new Error(`This photo is too large. Use one under ${maxMb} MB.`)
  const name = file.name.replace(/\.\w+$/, '') + '.jpg'
  return { file: new File([blob], name, { type: 'image/jpeg' }), width: canvas.width, height: canvas.height, resized: true }
}

export const fmtBytes = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`)
