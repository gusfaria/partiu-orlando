import { supabase } from './supabase'
import { resizeImage } from './image-resize'
import type { SitePhoto } from '@/types/database'

export function publicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const blob = await resizeImage(file, 400)
  const path = `${userId}/avatar.jpg`
  const { error } = await supabase.storage.from('avatars')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
  if (error) throw error
  // cache-bust because the path is reused on every re-upload
  const url = `${publicUrl('avatars', path)}?v=${Date.now()}`
  const { error: dbError } = await supabase.from('profiles')
    .update({ avatar_url: url }).eq('id', userId)
  if (dbError) throw dbError
  return url
}

export async function uploadSitePhoto(section: SitePhoto['section'], file: File): Promise<void> {
  const blob = await resizeImage(file, 1600)
  const path = `${section}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('photos')
    .upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  const { data: maxRow } = await supabase.from('site_photos')
    .select('display_order').eq('section', section)
    .order('display_order', { ascending: false }).limit(1).maybeSingle()
  const nextOrder = (maxRow?.display_order ?? -1) + 1
  const { error: dbError } = await supabase.from('site_photos')
    .insert({ section, storage_path: path, display_order: nextOrder })
  if (dbError) throw dbError
}

export async function listSitePhotos(section: SitePhoto['section']): Promise<SitePhoto[]> {
  const { data } = await supabase.from('site_photos')
    .select('*').eq('section', section).order('display_order').order('created_at')
  return data ?? []
}

export async function deleteSitePhoto(photo: SitePhoto): Promise<void> {
  await supabase.storage.from('photos').remove([photo.storage_path])
  await supabase.from('site_photos').delete().eq('id', photo.id)
}
