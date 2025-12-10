import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { calculateLavs, getTodaysWorkout, supabase } from '../lib/supabase'

interface Workout {
  id: number
  title: string
  description: string
  workout_type: string
  target_km: number | null
  target_duration_minutes: number | null
  intensity: string
  lavs_number: number
  is_key_workout: boolean
}

interface WeekSummary {
  target_km: number
  actual_km: number
  completion_percentage: number
}

export default function DashboardScreen() {
  const [lavs, setLavs] = useState(0)
  const [todaysWorkout, setTodaysWorkout] = useState<Workout | null>(null)
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLavs(calculateLavs())

    // Hent dagens økt
    const { data: workout } = await getTodaysWorkout()
    setTodaysWorkout(workout)

    // Hent denne ukens status
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)

    const { data: week } = await supabase
      .from('weeks')
      .select('id, target_km')
      .lte('start_date', today.toISOString().split('T')[0])
      .gte('end_date', today.toISOString().split('T')[0])
      .single()

    if (week) {
      const { data: summary } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('week_id', week.id)
        .single()

      if (summary) {
        setWeekSummary({
          target_km: week.target_km,
          actual_km: summary.actual_km || 0,
          completion_percentage: summary.completion_percentage || 0,
        })
      } else {
        setWeekSummary({
          target_km: week.target_km,
          actual_km: 0,
          completion_percentage: 0,
        })
      }
    }

    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case 'run': return '🏃'
      case 'walk': return '🚶'
      case 'strength': return '💪'
      case 'rest': return '😴'
      case 'long_run': return '🏃‍♂️'
      default: return '📋'
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Laster...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Nedtelling */}
      <View style={styles.lavsContainer}>
        <Text style={styles.lavsLabel}>DAGER TIL GOTLAND</Text>
        <Text style={styles.lavsNumber}>{lavs}</Text>
        <Text style={styles.lavsSubtitle}>4. juli 2026</Text>
      </View>

      {/* Dagens økt */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>I DAG</Text>
        {todaysWorkout ? (
          <View>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutIcon}>
                {getWorkoutIcon(todaysWorkout.workout_type)}
              </Text>
              <Text style={styles.workoutTitle}>{todaysWorkout.title}</Text>
            </View>
            <Text style={styles.workoutDescription}>
              {todaysWorkout.description}
            </Text>
            {todaysWorkout.target_km && (
              <Text style={styles.workoutTarget}>
                Mål: {todaysWorkout.target_km} km
              </Text>
            )}
            {todaysWorkout.target_duration_minutes && (
              <Text style={styles.workoutTarget}>
                Tid: {todaysWorkout.target_duration_minutes} min
              </Text>
            )}
            {todaysWorkout.is_key_workout && (
              <View style={styles.keyWorkoutBadge}>
                <Text style={styles.keyWorkoutText}>Nøkkeløkt</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noWorkout}>Ingen planlagt økt i dag</Text>
        )}
      </View>

      {/* Ukestatus */}
      {weekSummary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DENNE UKEN</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(weekSummary.completion_percentage, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {weekSummary.actual_km.toFixed(1)} / {weekSummary.target_km} km
            </Text>
            <Text style={styles.progressPercent}>
              {weekSummary.completion_percentage.toFixed(0)}%
            </Text>
          </View>
        </View>
      )}

      {/* Motivasjon */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>HUSK</Text>
        <Text style={styles.reminderText}>✅ Ingen brus</Text>
        <Text style={styles.reminderText}>✅ 7-8 timer søvn</Text>
        <Text style={styles.reminderText}>✅ 2-3 liter vann</Text>
        <Text style={styles.reminderText}>✅ Protein til hvert måltid</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  lavsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#16213e',
  },
  lavsLabel: {
    color: '#888',
    fontSize: 14,
    letterSpacing: 2,
  },
  lavsNumber: {
    color: '#e94560',
    fontSize: 80,
    fontWeight: 'bold',
  },
  lavsSubtitle: {
    color: '#888',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#16213e',
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    color: '#888',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  workoutTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  workoutDescription: {
    color: '#aaa',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  workoutTarget: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '500',
  },
  keyWorkoutBadge: {
    backgroundColor: '#e94560',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  keyWorkoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noWorkout: {
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#0f3460',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 6,
  },
  progressText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  progressPercent: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  reminderText: {
    color: '#aaa',
    fontSize: 16,
    marginVertical: 4,
  },
})
