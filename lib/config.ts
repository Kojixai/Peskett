// Server-side: read a config value, falling back env var → Supabase app_config
export async function getConfig(key: string): Promise<string | null> {
  const envVal = process.env[key]
  if (envVal) return envVal

  try {
    const { createClient } = await import('./supabase/server')
    const supabase = await createClient()
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', key)
      .single()
    return data?.value || null
  } catch {
    return null
  }
}
