import { createClient } from '@supabase/supabase-js'

// Fallback values to ensure the client is always initialized correctly,
// even when Vercel preview deployments don't have env vars configured.
// These are public NEXT_PUBLIC_* values (anon key) — safe to expose since
// they ship in the client bundle anyway. Data access is protected by RLS.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hakinbhfivthqxvkssok.supabase.co'

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhha2luYmhmaXZ0aHF4dmtzc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTkwODksImV4cCI6MjA4MzQ3NTA4OX0.wS1nf7ymNbYZ1AlamiJiAPvcMAdcgIPBXrdpl4RxPzg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Lake = {
  id: string
  slug: string | null
  name: string
  description: string | null
  location_text: string | null
  city: string | null
  lat: number | null
  lng: number | null
  area_ha: number | null
  max_depth_m: number | null
  image_url: string | null
  lake_images?: LakeImage[] | null
  extra: Record<string, unknown> | null
  is_active: boolean
  fish_species: string[] | null
  location_google_url: string | null
  location_waze_url: string | null
  contacts_enabled: boolean
  contacts: { email?: string; phone?: string[]; website?: string; telegram?: string; instagram?: string; viber?: string } | null
  price_details_enabled: boolean
  price_details_text: string | null
  catch_quota_enabled: boolean
  catch_quota_text: string | null
  additional_services_enabled: boolean
  additional_services_text: string | null
  lake_rules_enabled: boolean
  lake_rules_text: string | null
  stocking_enabled: boolean
  stocking_text: string | null
  faq_enabled: boolean
  faq_items: { question: string; answer: string }[] | null
  amenities_enabled: boolean
  amenities: { key: string; name: string }[] | null
  scheme_enabled: boolean
  scheme_image_url: string | null
  show_work_schedule: boolean
  base_open_time: string | null
  base_close_time: string | null
  work_schedule_summary: string | null
  price_uah: number | null
  created_at: string
  updated_at: string
}

export type LakeImage = {
  id: string
  lake_id: string
  url: string
  medium_url?: string | null
  thumb_url?: string | null
  is_primary?: boolean | null
  sort_order?: number | null
  created_at?: string | null
}

export type LakeUpdate = {
  id: string
  lake_id: string
  type: string
  title: string
  body: string | null
  created_at: string
}
