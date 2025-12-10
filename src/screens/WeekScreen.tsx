import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { getAllWeeks, getWorkoutsForWeek } from '../lib/supabase'

interface Week {
  id: number
  week_number: number
  start_date: string
  end_date: string
  target_km: number
  target_elevation: number
  notes: string
  phases: { name: string }
}

interface Workout {
  id: number
  date: string
  title: string
  description: string
  workout_type: string
  target_km: number | null
  target_duration_minutes: number | null
  intensity: string
  lavs_number: number
  is_key_workout: boolean
}

export default function WeekScreen() {
  const [weeks, setWeeks] = useState<Week[]>([])
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadWeeks = async () => {
    const { data } = await getAllWeeks()
    if (data) {
      setWeeks(data)
      // Finn nåværende uke basert på dato
      const today = new Date().toISOString().split('T')[0]
      const currentIdx = data.findIndex(
        (w: Week) => w.start_date <= today && w.end_date >= today
      )
      setCurrentWeekIndex(currentIdx >= 0 ? currentIdx : 0)
    }
  }

  const loadWorkouts = async (weekId: number) => {
    const { data } = await getWorkoutsForWeek(weekId)
    setWorkouts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadWeeks()
  }, [])

  useEffect(() => {
    if (weeks.length > 0 && weeks[currentWeekIndex]) {
      setLoading(true)
      loadWorkouts(weeks[currentWeekIndex].id)
    }
  }, [currentWeekIndex, weeks])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadWeeks()
    setRefreshing(false)
  }

  const goToPreviousWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1)
    }
  }

  const goToNextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1)
    }
  }

  const goToCurrentWeek = () => {
    const today = new Date().toISOString().split('T')[0]
    const currentIdx = weeks.findIndex(
      (w: Week) => w.start_date <= today && w.end_date >= today
    )
    if (currentIdx >= 0) {
      setCurrentWeekIndex(currentIdx)
    }
  }

  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case 'run': return '🏃'
      case 'walk': return '🚶'
      case 'strength': return '💪'
      case 'rest': return '😴'
      case 'long_run': return '🏃‍♂️'
      case 'back_to_back': return '🔥'
      default: return '📋'
    }
  }

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']
    return days[date.getDay()]
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getDate()}.${date.getMonth() + 1}`
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.getDate()}.${startDate.getMonth() + 1} - ${endDate.getDate()}.${endDate.getMonth() + 1}`
  }

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  const isPast = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr < today
  }

  const isCurrentWeek = () => {
    if (!weeks[currentWeekIndex]) return false
    const today = new Date().toISOString().split('T')[0]
    const week = weeks[currentWeekIndex]
    return week.start_date <= today && week.end_date >= today
  }

  if (loading && weeks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Laster uker...</Text>
      </View>
    )
  }

  const currentWeek = weeks[currentWeekIndex]

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Uke-navigator */}
      <View style={styles.navigator}>
        <TouchableOpacity
          onPress={goToPreviousWeek}
          disabled={currentWeekIndex === 0}
          style={[styles.navButton, currentWeekIndex === 0 && styles.navButtonDisabled]}
        >
          <Text style={[styles.navButtonText, currentWeekIndex === 0 && styles.navButtonTextDisabled]}>
            ◀
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToCurrentWeek} style={styles.weekInfo}>
          <Text style={styles.weekNumber}>Uke {currentWeek?.week_number}</Text>
          <Text style={styles.weekDates}>
            {currentWeek && formatDateRange(currentWeek.start_date, currentWeek.end_date)}
          </Text>
          {currentWeek?.phases && (
            <Text style={styles.phaseName}>{currentWeek.phases.name}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNextWeek}
          disabled={currentWeekIndex === weeks.length - 1}
          style={[styles.navButton, currentWeekIndex === weeks.length - 1 && styles.navButtonDisabled]}
        >
          <Text style={[styles.navButtonText, currentWeekIndex === weeks.length - 1 && styles.navButtonTextDisabled]}>
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      {/* Uke-mål */}
      {currentWeek && (
        <View style={styles.weekTargets}>
          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>{currentWeek.target_km}</Text>
            <Text style={styles.targetLabel}>km</Text>
          </View>
          <View style={styles.targetItem}>
            <Text style={styles.targetValue}>{currentWeek.target_elevation}</Text>
            <Text style={styles.targetLabel}>hm</Text>
          </View>
          {currentWeek.notes && (
            <Text style={styles.weekNotes}>{currentWeek.notes}</Text>
          )}
        </View>
      )}

      {/* Gå til nåværende uke-knapp */}
      {!isCurrentWeek() && (
        <TouchableOpacity style={styles.goToCurrentButton} onPress={goToCurrentWeek}>
          <Text style={styles.goToCurrentText}>↩ Gå til denne uken</Text>
        </TouchableOpacity>
      )}

      {/* Økter */}
      {loading ? (
        <View style={styles.loadingWorkouts}>
          <Text style={styles.loadingText}>Laster økter...</Text>
        </View>
      ) : (
        workouts.map((workout) => (
          <View
            key={workout.id}
            style={[
              styles.workoutCard,
              isToday(workout.date) && styles.todayCard,
              isPast(workout.date) && styles.pastCard,
            ]}
          >
            <View style={styles.dateColumn}>
              <Text style={[styles.dayName, isToday(workout.date) && styles.todayText]}>
                {getDayName(workout.date)}
              </Text>
              <Text style={[styles.dateText, isToday(workout.date) && styles.todayText]}>
                {formatDate(workout.date)}
              </Text>
            </View>

            <View style={styles.workoutContent}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutIcon}>
                  {getWorkoutIcon(workout.workout_type)}
                </Text>
                <Text style={[
                  styles.workoutTitle,
                  isPast(workout.date) && styles.pastText
                ]}>
                  {workout.title}
                </Text>
                {workout.is_key_workout && (
                  <View style={styles.keyBadge}>
                    <Text style={styles.keyBadgeText}>KEY</Text>
                  </View>
                )}
              </View>

              <Text style={[
                styles.workoutDescription,
                isPast(workout.date) && styles.pastText
              ]}>
                {workout.description}
              </Text>

              <View style={styles.targets}>
                {workout.target_km && (
                  <Text style={styles.targetText}>{workout.target_km} km</Text>
                )}
                {workout.target_duration_minutes && (
                  <Text style={styles.targetText}>{workout.target_duration_minutes} min</Text>
                )}
                {workout.intensity && workout.intensity !== 'null' && (
                  <Text style={[
                    styles.intensityBadge,
                    workout.intensity === 'hard' && styles.intensityHard,
                    workout.intensity === 'moderate' && styles.intensityModerate,
                  ]}>
                    {workout.intensity}
                  </Text>
                )}
              </View>
            </View>

            {isToday(workout.date) && (
              <View style={styles.todayIndicator} />
            )}
          </View>
        ))
      )}

      {workouts.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Ingen økter planlagt denne uken</Text>
        </View>
      )}

      {/* Padding på bunnen */}
      <View style={{ height: 40 }} />
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
    color: '#888',
    fontSize: 16,
  },
  loadingWorkouts: {
    padding: 40,
    alignItems: 'center',
  },
  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#16213e',
    marginBottom: 8,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#1a1a2e',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  navButtonTextDisabled: {
    color: '#444',
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  weekNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  weekDates: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  phaseName: {
    color: '#e94560',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  weekTargets: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 24,
    flexWrap: 'wrap',
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  targetValue: {
    color: '#e94560',
    fontSize: 28,
    fontWeight: 'bold',
  },
  targetLabel: {
    color: '#888',
    fontSize: 14,
  },
  weekNotes: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
    marginTop: 8,
    fontStyle: 'italic',
  },
  goToCurrentButton: {
    alignSelf: 'center',
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  goToCurrentText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
  },
  workoutCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  todayCard: {
    borderColor: '#e94560',
    borderWidth: 2,
  },
  pastCard: {
    opacity: 0.6,
  },
  dateColumn: {
    width: 50,
    marginRight: 16,
  },
  dayName: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  todayText: {
    color: '#e94560',
  },
  pastText: {
    color: '#666',
  },
  workoutContent: {
    flex: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  workoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  workoutTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  keyBadge: {
    backgroundColor: '#e94560',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  keyBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  workoutDescription: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  targets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
  },
  intensityBadge: {
    color: '#4ade80',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  intensityModerate: {
    color: '#fbbf24',
  },
  intensityHard: {
    color: '#ef4444',
  },
  todayIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#e94560',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
})
