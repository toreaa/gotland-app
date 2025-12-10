import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// Secure storage adapter for tokens
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Hjelpefunksjoner

// Beregn dager til løpet
export function calculateLavs(): number {
  const raceDate = new Date('2026-07-04')
  const today = new Date()
  const diffTime = raceDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Hent dagens planlagte økt
export async function getTodaysWorkout() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('planned_workouts')
    .select('*')
    .eq('date', today)
    .single()

  return { data, error }
}

// Hent denne ukens plan
export async function getThisWeeksWorkouts() {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const { data, error } = await supabase
    .from('planned_workouts')
    .select('*')
    .gte('date', monday.toISOString().split('T')[0])
    .lte('date', sunday.toISOString().split('T')[0])
    .order('date')

  return { data, error }
}

// Hent ukessammendrag
export async function getWeeklySummary(weekId: number) {
  const { data, error } = await supabase
    .from('weekly_summaries')
    .select('*, weeks(*)')
    .eq('week_id', weekId)
    .single()

  return { data, error }
}

// Hent aktiviteter for periode
export async function getActivities(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  return { data, error }
}

// Hent alle uker
export async function getAllWeeks() {
  const { data, error } = await supabase
    .from('weeks')
    .select('*, phases(name)')
    .order('week_number')

  return { data, error }
}

// Hent økter for en spesifikk uke
export async function getWorkoutsForWeek(weekId: number) {
  const { data, error } = await supabase
    .from('planned_workouts')
    .select('*')
    .eq('week_id', weekId)
    .order('date')

  return { data, error }
}

// Logg livsstil
export async function logLifestyle(entry: {
  date: string
  sleep_hours?: number
  sleep_quality?: number
  weight_kg?: number
  energy_level?: number
  soreness_level?: number
  stress_level?: number
  notes?: string
  no_sugar?: boolean
}) {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Ikke logget inn')

  const { data, error } = await supabase
    .from('lifestyle_log')
    .upsert({
      user_id: user.user.id,
      ...entry
    }, { onConflict: 'user_id,date' })

  return { data, error }
}
