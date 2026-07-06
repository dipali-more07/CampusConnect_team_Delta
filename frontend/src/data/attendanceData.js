/**
 * attendanceData.js
 * Static mock data for the Attendance page.
 * Attendance records are imported from attendance.json.
 * Events list is used for the "Select Event" dropdown in the QR generator.
 */

export const ATTENDANCE_EVENTS = [
  { id: 'EVT081', name: 'TechFest 2025',          date: '2025-08-15', venue: 'Main Auditorium',    capacity: 500  },
  { id: 'EVT082', name: 'Annual Cultural Fest',    date: '2025-07-22', venue: 'Open Air Theatre',   capacity: 1000 },
  { id: 'EVT083', name: 'Sports Meet 2025',        date: '2025-09-05', venue: 'University Grounds', capacity: 800  },
  { id: 'EVT084', name: 'National Hackathon',      date: '2025-10-10', venue: 'Innovation Hub',     capacity: 200  },
  { id: 'EVT085', name: 'Research Symposium',      date: '2025-11-20', venue: 'Seminar Hall A',     capacity: 300  },
  { id: 'EVT086', name: 'Entrepreneurship Bootcamp', date: '2025-12-01', venue: 'Incubation Center', capacity: 150  },
]

export const ATTENDANCE_SESSIONS = [
  { id: 'morning',   label: 'Morning (9AM–1PM)',   startHour: 9,  endHour: 13 },
  { id: 'afternoon', label: 'Afternoon (2PM–6PM)', startHour: 14, endHour: 18 },
  { id: 'fullday',   label: 'Full Day',            startHour: 9,  endHour: 18 },
  { id: 'custom',    label: 'Custom',              startHour: null, endHour: null },
]

/**
 * RECENT_SCANS — mock data for the Scan QR "Recent Scans" panel.
 * Each entry represents a student whose QR was scanned in the current session.
 */
export const RECENT_SCANS = [
  { id: 'SC001', studentName: 'Arjun Patel',      rollNo: '21CS001',   status: 'Present', time: '09:12 AM', avatarColor: '#615FFF' },
  { id: 'SC002', studentName: 'Sneha Krishnan',   rollNo: '21ECE042',  status: 'Present', time: '09:05 AM', avatarColor: '#00BC7D' },
  { id: 'SC003', studentName: 'Rahul Gupta',      rollNo: '22ME015',   status: 'Late',    time: '10:22 AM', avatarColor: '#FE9A00' },
  { id: 'SC004', studentName: 'Priya Nair',       rollNo: '21MBA008',  status: 'Present', time: '09:00 AM', avatarColor: '#0284c7' },
  { id: 'SC005', studentName: 'Aishwarya Menon',  rollNo: '21CSE089',  status: 'Late',    time: '11:15 AM', avatarColor: '#e11d48' },
  { id: 'SC006', studentName: 'Deepak Verma',     rollNo: '21ECE010',  status: 'Present', time: '08:56 AM', avatarColor: '#7c3aed' },
  { id: 'SC007', studentName: 'Karan Singh',      rollNo: '20CS011',   status: 'Present', time: '08:03 AM', avatarColor: '#0891b2' },
  { id: 'SC008', studentName: 'Ananya Mishra',    rollNo: '23ECE012',  status: 'Absent',  time: '—',        avatarColor: '#dc2626' },
]

/**
 * LIVE_CHART_DATA — hourly check-in counts for the Live Monitor bar chart.
 * Mirrors what the backend would return from GET /attendance/chart?eventId=...
 */
export const LIVE_CHART_DATA = [
  { hour: '8AM',  count: 12  },
  { hour: '9AM',  count: 89  },
  { hour: '10AM', count: 134 },
  { hour: '11AM', count: 172 },
  { hour: '12PM', count: 178 },
  { hour: '1PM',  count: 158 },
  { hour: '2PM',  count: 210 },
  { hour: '3PM',  count: 175 },
  { hour: '4PM',  count: 155 },
  { hour: '5PM',  count: 65  },
  { hour: '6PM',  count: 28  },
]

/**
 * DEPT_ATTENDANCE_DATA — mock data for Dept-wise Attendance chart.
 */
export const DEPT_ATTENDANCE_DATA = [
  { dept: 'CSE',   count: 35, color: '#615FFF' },
  { dept: 'ECE',   count: 26, color: '#00BC7D' },
  { dept: 'ME',    count: 15, color: '#FE9A00' },
  { dept: 'EEE',   count: 12, color: '#0284c7' },
  { dept: 'MBA',   count: 10, color: '#e11d48' },
  { dept: 'Civil', count: 6,  color: '#7c3aed' },
]

