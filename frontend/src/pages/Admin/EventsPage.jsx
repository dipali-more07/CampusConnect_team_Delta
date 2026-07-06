import { useState, useEffect } from 'react'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'
import eventsService from '../../services/eventsService'
import { useToast } from '../../context/ToastContext'

// Import Admin Event sub-components
import EventsHeader from '../../components/admin/adminEvent/EventsHeader'
import EventsTable from '../../components/admin/adminEvent/EventsTable'
import EventFormModal from '../../components/admin/adminEvent/EventFormModal'
import EventDetailView from '../../components/admin/adminEvent/EventDetailView'
import DeleteConfirmModal from '../../components/admin/adminEvent/DeleteConfirmModal'
import ApprovalConfirmModal from '../../components/admin/adminEvent/ApprovalConfirmModal'
import ImportModal from '../../components/admin/adminEvent/ImportModal'

export default function EventsPage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  const showToast = useToast()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('All')
  const [activeCategory, setActiveCategory] = useState('All')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Modals state
  const [createEditOpen, setCreateEditOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [viewingDetailEvent, setViewingDetailEvent] = useState(null)
  const [approvalConfirmModal, setApprovalConfirmModal] = useState({
    open: false,
    event: null,
    targetStatus: 'Approved'
  })

  // Form state
  const [formState, setFormState] = useState({
    name: '',
    organizer: '',
    category: 'Technical',
    eventType: 'Individual',
    approvalStatus: 'Approved',
    venue: '',
    date: '',
    time: '09:00',
    capacity: 500,
    registrationsCount: 0,
    status: 'Upcoming',
    qrAttendance: 'Disabled',
    description: '',
    registrationDeadline: '',
    banner: null,
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)

  // Fetch events
  const loadEvents = async () => {
    setLoading(true)
    const res = await eventsService.fetchAll()
    if (res.success) {
      setEvents(res.events)
    } else {
      showToast(res.message || 'Failed to load events.', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // Categories & Event Types
  const categories = ['All', 'Technical', 'Cultural', 'Seminar', 'Sports', 'Academic', 'Workshop']
  const eventTypes = ['Individual', 'Team', 'Both']
  const statuses = ['All', 'Upcoming', 'Draft', 'Ongoing', 'Completed', 'Cancelled']

  // Filter events
  const filteredEvents = events.filter(event => {
    const statusMatch = activeStatus === 'All' || event.status === activeStatus
    const categoryMatch = activeCategory === 'All' || event.category === activeCategory
    
    const searchLower = searchQuery.toLowerCase()
    const nameMatch = event.name.toLowerCase().includes(searchLower)
    const idMatch = event.id.toLowerCase().includes(searchLower)
    const organizerMatch = event.organizer.toLowerCase().includes(searchLower)
    const venueMatch = event.venue.toLowerCase().includes(searchLower)
    const typeMatch = (event.eventType || '').toLowerCase().includes(searchLower)
    const searchMatch = searchQuery === '' || nameMatch || idMatch || organizerMatch || venueMatch || typeMatch

    return statusMatch && categoryMatch && searchMatch
  })

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeStatus, activeCategory])

  // Pagination Calculations
  const totalItems = filteredEvents.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage)

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedEvent(null)
    setFormState({
      name: '',
      organizer: '',
      category: 'Technical',
      eventType: 'Individual',
      approvalStatus: 'Approved',
      venue: '',
      date: '',
      time: '',
      capacity: 500,
      registrationsCount: 0,
      status: 'Upcoming',
      qrAttendance: 'Disabled',
      description: '',
      registrationDeadline: '',
      banner: null,
    })
    setFormErrors({})
    setCreateEditOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (event, e) => {
    if (e) e.stopPropagation()
    setSelectedEvent(event)
    setFormState({
      name: event.name,
      organizer: event.organizer,
      category: event.category,
      eventType: event.eventType || 'Individual',
      approvalStatus: event.approvalStatus || 'Approved',
      venue: event.venue,
      date: event.date,
      time: event.time || '09:00',
      capacity: event.capacity,
      registrationsCount: event.registrationsCount,
      status: event.status,
      qrAttendance: event.qrAttendance || 'Disabled',
      description: event.description || '',
      registrationDeadline: event.registrationDeadline || '',
      banner: event.banner || null,
    })
    setFormErrors({})
    setCreateEditOpen(true)
  }

  // Open View sub-page
  const handleOpenView = (event, e) => {
    if (e) e.stopPropagation()
    setViewingDetailEvent(event)
  }

  // Open Delete Confirmation Modal
  const handleOpenDelete = (event, e) => {
    if (e) e.stopPropagation()
    setSelectedEvent(event)
    setDeleteConfirmOpen(true)
  }

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return
    const res = await eventsService.delete(selectedEvent.id)
    if (res.success) {
      showToast(`Event ${selectedEvent.id} deleted successfully.`, 'success')
      setDeleteConfirmOpen(false)
      loadEvents()
    } else {
      showToast('Failed to delete event.', 'error')
    }
  }

  // Admin Approval Modal Trigger
  const handleOpenApprovalConfirm = (event, targetStatus, e) => {
    if (e) e.stopPropagation()
    if ((event.approvalStatus || 'Approved') === 'Approved' && targetStatus === 'Rejected') {
      showToast('Approved events cannot be rejected.', 'error')
      return
    }
    setApprovalConfirmModal({ open: true, event, targetStatus })
  }

  // Admin Approval Confirmation Action
  const handleConfirmApprovalStatus = async () => {
    const { event, targetStatus } = approvalConfirmModal
    if (!event) return
    const payload = {
      ...event,
      approvalStatus: targetStatus,
    }
    const res = await eventsService.update(event.id, payload)
    if (res.success) {
      showToast(`Event "${event.name}" ${targetStatus === 'Approved' ? 'approved' : 'rejected'} successfully.`, 'success')
      setApprovalConfirmModal({ open: false, event: null, targetStatus: 'Approved' })
      loadEvents()
    } else {
      showToast(res.message || 'Failed to update approval status.', 'error')
    }
  }

  // Form validation
  const validateForm = () => {
    const errors = {}
    if (!formState.name.trim()) errors.name = 'Event name is required'
    if (!formState.organizer.trim()) errors.organizer = 'Organizer is required'
    if (!formState.venue.trim()) errors.venue = 'Venue is required'
    if (!formState.date) errors.date = 'Date is required'
    if (formState.capacity <= 0) errors.capacity = 'Capacity must be greater than 0'
    if (formState.registrationsCount < 0) errors.registrationsCount = 'Registrations cannot be negative'
    if (parseInt(formState.registrationsCount, 10) > parseInt(formState.capacity, 10)) {
      errors.registrationsCount = 'Registrations cannot exceed capacity'
    }
    if (formState.registrationDeadline && formState.date) {
      if (new Date(formState.registrationDeadline) > new Date(formState.date)) {
        errors.registrationDeadline = 'Deadline must be on or before the event date'
      }
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Save Event (Create or Update)
  const handleSaveEvent = async (isDraft = false) => {
    if (!validateForm()) return
    setSubmitting(true)
    
    const payload = {
      ...formState,
      status: isDraft ? 'Draft' : (formState.status === 'Draft' ? 'Upcoming' : formState.status),
    }

    let res
    if (selectedEvent) {
      res = await eventsService.update(selectedEvent.id, payload)
    } else {
      res = await eventsService.create(payload)
    }

    setSubmitting(false)
    if (res.success) {
      showToast(
        selectedEvent 
          ? `Event ${selectedEvent.id} updated successfully.` 
          : (isDraft ? 'Draft saved successfully.' : 'New event published successfully.'), 
        'success'
      )
      setCreateEditOpen(false)
      if (selectedEvent && viewingDetailEvent && viewingDetailEvent.id === selectedEvent.id) {
        setViewingDetailEvent(res.event)
      }
      loadEvents()
    } else {
      showToast(res.message || 'Failed to save event.', 'error')
    }
  }

  // Export Events (Download JSON)
  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `events_export_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      showToast('Events exported successfully.', 'success')
    } catch (err) {
      showToast('Failed to export events.', 'error')
    }
  }

  // Import Action
  const handleImportDemo = async () => {
    setImporting(true)
    const demoData = [
      { name: 'National Seminar on AI', organizer: 'Dr. Priya Sharma', category: 'Academic', venue: 'Seminar Hall A', date: '2025-11-12', capacity: 200, registrationsCount: 150, status: 'Upcoming' },
      { name: 'Alumni Meet 2025', organizer: 'Prof. Raj Kumar', category: 'Seminar', venue: 'Open Air Theatre', date: '2025-12-05', capacity: 600, registrationsCount: 412, status: 'Upcoming' },
      { name: 'Innovate Hackathon', organizer: 'Dr. Anita Nair', category: 'Technical', venue: 'CS Lab Block', date: '2025-08-20', capacity: 150, registrationsCount: 0, status: 'Upcoming' }
    ]
    const res = await eventsService.import(demoData)
    setImporting(false)
    if (res.success) {
      showToast(`Imported ${res.count} demo events successfully.`, 'success')
      setImportOpen(false)
      loadEvents()
    } else {
      showToast('Failed to import events.', 'error')
    }
  }

  // Handle Custom JSON Import
  const handleImportCustom = async () => {
    if (!importText.trim()) return
    setImporting(true)
    try {
      const parsed = JSON.parse(importText)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      const res = await eventsService.import(list)
      if (res.success) {
        showToast(`Imported ${res.count} events successfully.`, 'success')
        setImportText('')
        setImportOpen(false)
        loadEvents()
      } else {
        showToast(res.message || 'Import failed.', 'error')
      }
    } catch (e) {
      showToast('Invalid JSON format. Please check the structure.', 'error')
    } finally {
      setImporting(false)
    }
  }

  // Style helper based on status badge
  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Upcoming':
        return {
          bg: dark ? 'rgba(97, 95, 255, 0.15)' : 'rgba(97, 95, 255, 0.1)',
          text: BRAND,
        }
      case 'Draft':
        return {
          bg: dark ? 'rgba(100, 116, 139, 0.15)' : 'rgba(100, 116, 139, 0.1)',
          text: dark ? '#94a3b8' : '#475569',
        }
      case 'Ongoing':
        return {
          bg: dark ? 'rgba(0, 188, 125, 0.15)' : 'rgba(0, 188, 125, 0.1)',
          text: '#00BC7D',
        }
      case 'Completed':
        return {
          bg: dark ? 'rgba(122, 152, 187, 0.15)' : 'rgba(100, 116, 139, 0.1)',
          text: dark ? '#7a98bb' : '#64748b',
        }
      case 'Cancelled':
        return {
          bg: dark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
          text: '#ef4444',
        }
      default:
        return {
          bg: dark ? '#162640' : '#f1f5f9',
          text: dark ? '#7a98bb' : '#64748b',
        }
    }
  }

  return (
    <div className="p-5 px-6">
      {viewingDetailEvent ? (
        <EventDetailView 
          event={viewingDetailEvent} 
          onBack={() => {
            setViewingDetailEvent(null)
            loadEvents()
          }}
          onEdit={(e) => handleOpenEdit(viewingDetailEvent, e)}
          tokens={tokens}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Header & Controls */}
          <EventsHeader 
            dark={dark}
            tokens={tokens}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeStatus={activeStatus}
            setActiveStatus={setActiveStatus}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            categories={categories}
            statuses={statuses}
            onOpenCreate={handleOpenCreate}
            onOpenImport={() => setImportOpen(true)}
            onExport={handleExport}
          />

          {/* Events Data Table */}
          <EventsTable 
            dark={dark}
            tokens={tokens}
            loading={loading}
            filteredEvents={filteredEvents}
            paginatedEvents={paginatedEvents}
            totalItems={totalItems}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            getStatusBadgeStyles={getStatusBadgeStyles}
            onOpenView={handleOpenView}
            onOpenEdit={handleOpenEdit}
            onOpenDelete={handleOpenDelete}
            onOpenApprovalConfirm={handleOpenApprovalConfirm}
          />

          {/* Create & Edit Event Modal */}
          <EventFormModal 
            open={createEditOpen}
            onClose={() => setCreateEditOpen(false)}
            selectedEvent={selectedEvent}
            formState={formState}
            setFormState={setFormState}
            formErrors={formErrors}
            submitting={submitting}
            onSaveEvent={handleSaveEvent}
            categories={categories}
            eventTypes={eventTypes}
            tokens={tokens}
          />

          {/* Delete Confirmation Modal */}
          <DeleteConfirmModal 
            open={deleteConfirmOpen}
            selectedEvent={selectedEvent}
            onClose={() => setDeleteConfirmOpen(false)}
            onConfirm={handleDeleteConfirm}
            tokens={tokens}
          />

          {/* Approval Confirmation Modal */}
          <ApprovalConfirmModal 
            modalState={approvalConfirmModal}
            onClose={() => setApprovalConfirmModal({ open: false, event: null, targetStatus: 'Approved' })}
            onConfirm={handleConfirmApprovalStatus}
            tokens={tokens}
          />

          {/* Import Modal */}
          <ImportModal 
            open={importOpen}
            onClose={() => setImportOpen(false)}
            importing={importing}
            importText={importText}
            setImportText={setImportText}
            onImportDemo={handleImportDemo}
            onImportCustom={handleImportCustom}
            tokens={tokens}
          />
        </>
      )}
    </div>
  )
}
