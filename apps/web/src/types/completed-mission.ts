export type CompletedMission = {
  id: string
  missionId: string
  name: string
  completedAt: string
  /** Activity duration only; excludes commute. */
  durationMinutes: number
}
