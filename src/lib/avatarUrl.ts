import { supabase } from './supabase';

export async function getAvatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data, error } = await supabase.storage
    .from('profile-images')
    .createSignedUrl(path, 3600);
  if (error) {
    console.error('Failed to create avatar signed URL:', error);
    return null;
  }
  return data.signedUrl;
}
