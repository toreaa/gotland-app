import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

// Beregn dager til Gotland
function calculateLavs(): number {
  const raceDate = new Date('2026-07-04')
  const today = new Date()
  const diffTime = raceDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export default function DashboardScreen() {
  const todaysWorkout = useQuery(api.workouts.getToday)
  const currentWeek = useQuery(api.weeks.getCurrent)
  const [refreshing, setRefreshing] = React.useState(false)

  const lavs = calculateLavs()

  const onRefresh = () => {
    // Convex auto-updates, men vi kan simulere refresh
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

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

  // Loading state
  if (todaysWorkout === undefined || currentWeek === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Laster...</Text>
      </View>
    )
  }

  // Calculate week summary from current week data
  const weekSummary = currentWeek ? {
    target_km: currentWeek.week?.target_km || 0,
    actual_km: currentWeek.summary?.actual_km || 0,
    completion_percentage: currentWeek.summary?.completion_percentage || 0,
  } : null

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
