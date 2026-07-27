import { ExamShell } from '@components/exam/ExamShell'
import { ROUTES } from '@constants/routes'

export function ExamEasy() {
  return (
    <ExamShell
      round="easy"
      roundLabel="Easy"
      nextRound="intermediate"
      nextRoute={ROUTES.STUDENT.EXAM_INTERMEDIATE}
      timerMinutes={45}
    />
  )
}

export default ExamEasy
