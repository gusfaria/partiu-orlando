const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

export function scaledDimensions(width: number, height: number, maxDim: number) {
  if (width <= maxDim && height <= maxDim) return { width, height }
  const scale = maxDim / Math.max(width, height)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export async function resizeImage(file: File, maxDim: number): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size > MAX_UPLOAD_BYTES) {
    throw new Error('invalid-file')
  }
  const bitmap = await createImageBitmap(file)
  const { width, height } = scaledDimensions(bitmap.width, bitmap.height, maxDim)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('invalid-file'))), 'image/jpeg', 0.85)
  )
}
