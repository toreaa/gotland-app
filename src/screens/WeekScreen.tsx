import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

export default function WeekScreen() {
  const weeks = useQuery(api.weeks.list)
  const baseTests = useQuery(api.activities.getBaseTests)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'compare' | 'strava' | 'basetests'>('compare')
  const [refreshing, setRefreshing] = useState(false)

  // Find current week on initial load
  useEffect(() => {
    if (weeks && weeks.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const currentIdx = weeks.findIndex(
        (w) => w.start_date <= today && w.end_date >= today
      )
      if (currentIdx >= 0) {
        setCurrentWeekIndex(currentIdx)
      }
    }
  }, [weeks])

  const currentWeek = weeks?.[currentWeekIndex]

  // Get detailed week data for the selected week
  const weekDetails = useQuery(
    api.weeks.getById,
    currentWeek ? { weekId: currentWeek._id as Id<"weeks"> } : "skip"
  )

  const workouts = weekDetails?.workouts || []
  const activities = weekDetails?.activities || []

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  const goToPreviousWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1)
    }
  }

  const goToNextWeek = () => {
    if (weeks && currentWeekIndex < weeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1)
    }
  }

  const goToCurrentWeek = () => {
    if (!weeks) return
    const today = new Date().toISOString().split('T')[0]
    const currentIdx = weeks.findIndex(
      (w) => w.start_date <= today && w.end_date >= today
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

  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'run': return '🏃'
      case 'walk': return '🚶'
      case 'hike': return '🥾'
      case 'ride': return '🚴'
      case 'swim': return '🏊'
      case 'workout': return '💪'
      default: return '🏃'
    }
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}t ${m}m`
    return `${m} min`
  }

  const totalKm = useMemo(() =>
    activities.reduce((sum, a) => sum + (a.distance_km || 0), 0),
    [activities]
  )

  const totalTime = useMemo(() =>
    activities.reduce((sum, a) => sum + (a.moving_time_seconds || 0), 0),
    [activities]
  )

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
    if (!currentWeek) return false
    const today = new Date().toISOString().split('T')[0]
    return currentWeek.start_date <= today && currentWeek.end_date >= today
  }

  // Loading state
  if (!weeks || weeks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Laster uker...</Text>
      </View>
    )
  }

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
          {currentWeek?.phase && (
            <Text style={styles.phaseName}>{currentWeek.phase.name}</Text>
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

      {/* Toggle mellom visninger */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, activeTab === 'compare' && styles.toggleButtonActive]}
          onPress={() => setActiveTab('compare')}
        >
          <Text style={[styles.toggleText, activeTab === 'compare' && styles.toggleTextActive]}>
            Sammenlign
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, activeTab === 'strava' && styles.toggleButtonActive]}
          onPress={() => setActiveTab('strava')}
        >
          <Text style={[styles.toggleText, activeTab === 'strava' && styles.toggleTextActive]}>
            Strava ({activities.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, activeTab === 'basetests' && styles.toggleButtonActive]}
          onPress={() => setActiveTab('basetests')}
        >
          <Text style={[styles.toggleText, activeTab === 'basetests' && styles.toggleTextActive]}>
            Base ({baseTests?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Strava aktiviteter */}
      {activeTab === 'strava' && (
        <>
          {/* Ukens totaler */}
          {activities.length > 0 && (
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>Ukens totaler</Text>
              <View style={styles.totalsRow}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{totalKm.toFixed(1)}</Text>
                  <Text style={styles.totalLabel}>km</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{formatDuration(totalTime)}</Text>
                  <Text style={styles.totalLabel}>tid</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{activities.length}</Text>
                  <Text style={styles.totalLabel}>økter</Text>
                </View>
                {currentWeek && currentWeek.target_km && (
                  <View style={styles.totalItem}>
                    <Text style={[
                      styles.totalValue,
                      totalKm >= currentWeek.target_km ? styles.goalReached : styles.goalNotReached
                    ]}>
                      {Math.round((totalKm / currentWeek.target_km) * 100)}%
                    </Text>
                    <Text style={styles.totalLabel}>av mål</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Ingen aktiviteter denne uken</Text>
              <Text style={styles.emptySubtext}>Aktiviteter fra Strava vises her</Text>
            </View>
          ) : (
            activities.map((activity) => (
              <View key={activity._id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityIcon}>
                    {getActivityIcon(activity.activity_type || '')}
                  </Text>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <Text style={styles.activityDate}>
                      {getDayName(activity.date)} {formatDate(activity.date)}
                    </Text>
                  </View>
                  <View style={styles.activityStats}>
                    <Text style={styles.activityDistance}>
                      {activity.distance_km?.toFixed(1)} km
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatDuration(activity.moving_time_seconds || 0)}
                    </Text>
                  </View>
                </View>
                <View style={styles.activityDetails}>
                  {(activity.elevation_gain || 0) > 0 && (
                    <Text style={styles.detailText}>↑ {Math.round(activity.elevation_gain || 0)} m</Text>
                  )}
                  {activity.average_heartrate && (
                    <Text style={styles.detailText}>❤️ {Math.round(activity.average_heartrate)} bpm</Text>
                  )}
                  {activity.moving_time_seconds && (activity.distance_km || 0) > 0 && (
                    <Text style={styles.detailText}>
                      Pace: {Math.floor(activity.moving_time_seconds / 60 / (activity.distance_km || 1))}:
                      {String(Math.round((activity.moving_time_seconds / 60 / (activity.distance_km || 1) % 1) * 60)).padStart(2, '0')} /km
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </>
      )}

      {/* Sammenlign planlagt vs faktisk */}
      {activeTab === 'compare' && (weekDetails === undefined ? (
        <View style={styles.loadingWorkouts}>
          <Text style={styles.loadingText}>Laster økter...</Text>
        </View>
      ) : (
        workouts.map((workout) => {
          // Finn aktiviteter for denne dagen
          const dayActivities = activities.filter(a =>
            a.date.split('T')[0] === workout.date
          )
          const dayTotalKm = dayActivities.reduce((sum, a) => sum + (a.distance_km || 0), 0)
          const hasCompleted = dayActivities.length > 0
          const targetMet = workout.target_km ? dayTotalKm >= workout.target_km : hasCompleted

          return (
            <View
              key={workout._id}
              style={[
                styles.workoutCard,
                isToday(workout.date) && styles.todayCard,
                isPast(workout.date) && !hasCompleted && styles.missedCard,
                hasCompleted && targetMet && styles.completedCard,
                hasCompleted && !targetMet && styles.partialCard,
              ]}
            >
              <View style={styles.dateColumn}>
                <Text style={[styles.dayName, isToday(workout.date) && styles.todayText]}>
                  {getDayName(workout.date)}
                </Text>
                <Text style={[styles.dateText, isToday(workout.date) && styles.todayText]}>
                  {formatDate(workout.date)}
                </Text>
                {hasCompleted && (
                  <Text style={targetMet ? styles.checkMark : styles.partialMark}>
                    {targetMet ? '✓' : '~'}
                  </Text>
                )}
              </View>

              <View style={styles.workoutContent}>
                {/* Planlagt */}
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutIcon}>
                    {getWorkoutIcon(workout.workout_type)}
                  </Text>
                  <Text style={[
                    styles.workoutTitle,
                    isPast(workout.date) && !hasCompleted && styles.pastText
                  ]}>
                    {workout.title}
                  </Text>
                  {workout.is_key_workout && (
                    <View style={styles.keyBadge}>
                      <Text style={styles.keyBadgeText}>KEY</Text>
                    </View>
                  )}
                </View>

                <View style={styles.comparisonRow}>
                  <View style={styles.plannedSection}>
                    <Text style={styles.sectionLabel}>Planlagt</Text>
                    {workout.target_km && (
                      <Text style={styles.plannedValue}>{workout.target_km} km</Text>
                    )}
                    {workout.target_duration_minutes && (
                      <Text style={styles.plannedValue}>{workout.target_duration_minutes} min</Text>
                    )}
                    {!workout.target_km && !workout.target_duration_minutes && (
                      <Text style={styles.plannedValue}>{workout.workout_type}</Text>
                    )}
                  </View>

                  <View style={styles.actualSection}>
                    <Text style={styles.sectionLabel}>Faktisk</Text>
                    {hasCompleted ? (
                      <>
                        <Text style={[
                          styles.actualValue,
                          targetMet ? styles.actualValueGood : styles.actualValuePartial
                        ]}>
                          {dayTotalKm.toFixed(1)} km
                        </Text>
                        <Text style={styles.activityCount}>
                          {dayActivities.length} {dayActivities.length === 1 ? 'økt' : 'økter'}
                        </Text>
                      </>
                    ) : isPast(workout.date) ? (
                      <Text style={styles.notDone}>Ikke gjort</Text>
                    ) : (
                      <Text style={styles.pending}>-</Text>
                    )}
                  </View>
                </View>

                {/* Vis aktivitetsnavn hvis fullført */}
                {hasCompleted && (
                  <View style={styles.activityNames}>
                    {dayActivities.map(a => (
                      <Text key={a._id} style={styles.activityNameText}>
                        {getActivityIcon(a.activity_type || '')} {a.name}
                      </Text>
                    ))}
                  </View>
                )}
              </View>

              {isToday(workout.date) && (
                <View style={styles.todayIndicator} />
              )}
            </View>
          )
        })
      ))}

      {activeTab === 'compare' && workouts.length === 0 && weekDetails !== undefined && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Ingen økter planlagt denne uken</Text>
        </View>
      )}

      {/* Basetester */}
      {activeTab === 'basetests' && (
        <>
          <View style={styles.baseTestHeader}>
            <Text style={styles.baseTestTitle}>Formutvikling</Text>
            <Text style={styles.baseTestSubtitle}>
              Aktiviteter med "base" i navnet - sporer puls over tid
            </Text>
          </View>

          {!baseTests || baseTests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Ingen basetester funnet</Text>
              <Text style={styles.emptySubtext}>
                Navngi en aktivitet med "base" i Strava
              </Text>
            </View>
          ) : (
            <>
              {/* Oppsummering */}
              {baseTests.length >= 2 && (
                <View style={styles.baseTestSummary}>
                  <Text style={styles.summaryTitle}>Utvikling</Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Første</Text>
                      <Text style={styles.summaryValue}>
                        {baseTests[0].average_heartrate || '-'} bpm
                      </Text>
                      <Text style={styles.summaryDate}>
                        {new Date(baseTests[0].date).toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Siste</Text>
                      <Text style={styles.summaryValue}>
                        {baseTests[baseTests.length - 1].average_heartrate || '-'} bpm
                      </Text>
                      <Text style={styles.summaryDate}>
                        {new Date(baseTests[baseTests.length - 1].date).toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Endring</Text>
                      {(() => {
                        const firstHR = baseTests[0]?.average_heartrate
                        const lastHR = baseTests[baseTests.length - 1]?.average_heartrate
                        if (firstHR && lastHR) {
                          const diff = lastHR - firstHR
                          return (
                            <>
                              <Text style={[
                                styles.summaryValue,
                                diff < 0 ? styles.positiveChange : styles.negativeChange
                              ]}>
                                {diff} bpm
                              </Text>
                              <Text style={styles.summaryDate}>
                                {diff < 0 ? 'Bedre!' : 'Høyere'}
                              </Text>
                            </>
                          )
                        }
                        return <Text style={styles.summaryValue}>-</Text>
                      })()}
                    </View>
                  </View>
                </View>
              )}

              {/* Liste over tester */}
              {baseTests.map((test, index) => {
                const prevTest = index > 0 ? baseTests[index - 1] : null
                const hrDiff = prevTest && test.average_heartrate && prevTest.average_heartrate
                  ? test.average_heartrate - prevTest.average_heartrate
                  : null

                return (
                  <View key={test._id} style={styles.baseTestCard}>
                    <View style={styles.baseTestRow}>
                      <View style={styles.baseTestDateCol}>
                        <Text style={styles.baseTestDateDay}>
                          {new Date(test.date).toLocaleDateString('nb-NO', { day: 'numeric' })}
                        </Text>
                        <Text style={styles.baseTestDateMonth}>
                          {new Date(test.date).toLocaleDateString('nb-NO', { month: 'short' })}
                        </Text>
                      </View>
                      <View style={styles.baseTestInfo}>
                        <Text style={styles.baseTestName}>{test.name}</Text>
                        <View style={styles.baseTestStats}>
                          <Text style={styles.baseTestStat}>
                            {test.distance_km?.toFixed(2)} km
                          </Text>
                          <Text style={styles.baseTestStat}>
                            {formatDuration(test.moving_time_seconds || 0)}
                          </Text>
                          {test.moving_time_seconds && (test.distance_km || 0) > 0 && (
                            <Text style={styles.baseTestStat}>
                              {Math.floor(test.moving_time_seconds / 60 / (test.distance_km || 1))}:
                              {String(Math.round((test.moving_time_seconds / 60 / (test.distance_km || 1) % 1) * 60)).padStart(2, '0')} /km
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.baseTestHR}>
                        <View style={styles.hrValues}>
                          <Text style={styles.hrAvg}>
                            {test.average_heartrate || '-'}
                          </Text>
                          <Text style={styles.hrMax}>
                            / {test.max_heartrate || '-'}
                          </Text>
                        </View>
                        <Text style={styles.hrLabel}>snitt/maks</Text>
                        {hrDiff !== null && (
                          <Text style={[
                            styles.hrTrend,
                            hrDiff < 0 ? styles.positiveChange : hrDiff > 0 ? styles.negativeChange : styles.neutralChange
                          ]}>
                            {hrDiff < 0 ? '↓' : hrDiff > 0 ? '↑' : '→'} {Math.abs(hrDiff)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )
              })}
            </>
          )}
        </>
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
  missedCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ade80',
  },
  partialCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  checkMark: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  partialMark: {
    color: '#fbbf24',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  comparisonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  plannedSection: {
    flex: 1,
  },
  actualSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionLabel: {
    color: '#666',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  plannedValue: {
    color: '#888',
    fontSize: 16,
  },
  actualValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actualValueGood: {
    color: '#4ade80',
  },
  actualValuePartial: {
    color: '#fbbf24',
  },
  activityCount: {
    color: '#666',
    fontSize: 12,
  },
  notDone: {
    color: '#ef4444',
    fontSize: 14,
  },
  pending: {
    color: '#666',
    fontSize: 16,
  },
  activityNames: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  activityNameText: {
    color: '#aaa',
    fontSize: 13,
    marginVertical: 2,
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
  emptySubtext: {
    color: '#555',
    fontSize: 14,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#e94560',
  },
  toggleText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  totalsCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e94560',
  },
  totalsTitle: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  goalReached: {
    color: '#4ade80',
  },
  goalNotReached: {
    color: '#fbbf24',
  },
  activityCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activityDate: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  activityDistance: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activityTime: {
    color: '#888',
    fontSize: 14,
  },
  activityDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  detailText: {
    color: '#888',
    fontSize: 14,
  },
  // Base test styles
  baseTestHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  baseTestTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  baseTestSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  baseTestSummary: {
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4ade80',
  },
  summaryTitle: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDate: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  positiveChange: {
    color: '#4ade80',
  },
  negativeChange: {
    color: '#ef4444',
  },
  neutralChange: {
    color: '#888',
  },
  baseTestCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
  },
  baseTestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  baseTestDateCol: {
    width: 45,
    marginRight: 12,
  },
  baseTestDateDay: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  baseTestDateMonth: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  baseTestInfo: {
    flex: 1,
  },
  baseTestName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  baseTestStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  baseTestStat: {
    color: '#888',
    fontSize: 13,
  },
  baseTestHR: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  hrValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hrAvg: {
    color: '#e94560',
    fontSize: 22,
    fontWeight: 'bold',
  },
  hrMax: {
    color: '#888',
    fontSize: 14,
  },
  hrLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  hrTrend: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
})
