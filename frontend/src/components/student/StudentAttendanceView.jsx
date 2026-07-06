import React from 'react'
import AttendancePage from '../../pages/Student/AttendancePage'

export default function StudentAttendanceView({ tokens, user }) {
  return <AttendancePage tokens={tokens} user={user} />
}
