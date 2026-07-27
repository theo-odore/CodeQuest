import { ExamShell } from '@components/exam/ExamShell'
import { ROUTES } from '@constants/routes'

export function ExamIntermediate() {
  return (
    <ExamShell
      round="intermediate"
      roundLabel="Intermediate"
      nextRound="hard"
      nextRoute={ROUTES.STUDENT.EXAM_HARD}
      timerMinutes={45}
    />
  )
}

export default ExamIntermediate
