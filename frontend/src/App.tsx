import type { ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'

const currentUser = {
  name: 'Demo Student',
  email: 'demo@student.example',
  role: 'STUDENT' as const,
}

const dashboardCards = [
  { label: 'Upcoming Events', value: '3' },
  { label: 'Unread Notices', value: '5' },
  { label: 'Open Requests', value: '2' },
  { label: 'Knowledge Matches', value: '18' },
]

const mockEvents = [
  { id: '1', title: 'Tech Fest Orientation', startsAt: '2026-10-12T10:00:00Z', status: 'PUBLISHED' },
  { id: '2', title: 'Career Guidance Webinar', startsAt: '2026-10-14T15:30:00Z', status: 'PUBLISHED' },
  { id: '3', title: 'Campus Cleanliness Drive', startsAt: '2026-10-20T08:00:00Z', status: 'DRAFT' },
]

const mockAnnouncements = [
  { id: 'a1', title: 'Semester exam timetable released', priority: 'HIGH' },
  { id: 'a2', title: 'Hostel maintenance schedule', priority: 'NORMAL' },
  { id: 'a3', title: 'Transport holiday update', priority: 'LOW' },
]

const mockRequests = [
  { id: 'r1', category: 'ACADEMIC', status: 'OPEN', title: 'Attendance clarification' },
  { id: 'r2', category: 'HOSTEL', status: 'RESOLVED', title: 'Room fan issue' },
]

function RequireAuth({ allowRoles, children }: { allowRoles?: Array<'ADMIN' | 'STAFF' | 'STUDENT'>; children: ReactNode }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (allowRoles && !allowRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function Layout() {
  const { pathname } = useLocation()

  const navItems = [
    { to: '/', label: 'Dashboard' },
    { to: '/assistant', label: 'Ask Assistant' },
    { to: '/events', label: 'Events' },
    { to: '/announcements', label: 'Announcements' },
    { to: '/requests', label: 'My Requests' },
    { to: '/admin', label: 'Admin' },
  ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-badge">C</div>
          <div>
            <div className="brand-title">CHAAMP</div>
            <div className="brand-subtitle">Campus assistant</div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={pathname === item.to ? 'nav-link active' : 'nav-link'}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="user-pill">
          <span>{currentUser.name}</span>
          <small>{currentUser.role}</small>
        </div>
      </header>

      <main className="page-wrap">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/requests" element={<RequireAuth allowRoles={['STUDENT', 'STAFF']}><RequestsPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth allowRoles={['ADMIN']}><AdminDashboardPage /></RequireAuth>} />
          <Route path="/admin/documents" element={<RequireAuth allowRoles={['ADMIN']}><AdminDocumentsPage /></RequireAuth>} />
          <Route path="/admin/requests" element={<RequireAuth allowRoles={['ADMIN']}><AdminRequestsPage /></RequireAuth>} />
          <Route path="/admin/analytics" element={<RequireAuth allowRoles={['ADMIN']}><AnalyticsPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

function LoginPage() {
  return (
    <section className="panel login-panel">
      <h1>Welcome to CHAAMP</h1>
      <p>Sign in with Cognito or confirm your email to continue.</p>
      <div className="stack">
        <input placeholder="Email" defaultValue="demo@student.example" />
        <input type="password" placeholder="Password" defaultValue="placeholder" />
        <button type="button">Continue</button>
      </div>
      <p className="placeholder-note">AWS Cognito and API values are placeholders until the live environment is configured.</p>
    </section>
  )
}

function DashboardPage() {
  return (
    <section>
      <div className="section-header">
        <h1>Dashboard</h1>
        <Link to="/assistant" className="button ghost">Ask the assistant</Link>
      </div>

      <div className="cards-grid">
        {dashboardCards.map((card) => (
          <article key={card.label} className="panel stat-card">
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
          </article>
        ))}
      </div>

      <div className="split-grid">
        <div className="panel">
          <h3>Next events</h3>
          <ul className="list">
            {mockEvents.slice(0, 3).map((event) => (
              <li key={event.id}>{event.title} • {new Date(event.startsAt).toLocaleDateString()}</li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3>Latest notices</h3>
          <ul className="list">
            {mockAnnouncements.map((announcement) => (
              <li key={announcement.id}>{announcement.title} • {announcement.priority}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function AssistantPage() {
  return (
    <section className="panel chat-panel">
      <div className="section-header">
        <h1>Ask the assistant</h1>
        <span className="badge success">Student view</span>
      </div>

      <div className="chat-box">
        <div className="message assistant">What is the minimum attendance requirement?</div>
        <div className="message user">I need to know the rule for attendance.</div>
        <div className="message assistant answer">
          The minimum attendance requirement is 75%. Please refer to the Academic Regulations document for the latest policy.
        </div>
        <div className="source-row">
          <span className="chip">Academic Regulations</span>
          <span className="chip">v2026.1</span>
          <span className="chip">Approved</span>
        </div>
      </div>

      <div className="chat-input-row">
        <input placeholder="Ask a campus question..." defaultValue="What is the minimum attendance requirement?" />
        <button type="button">Send</button>
      </div>
    </section>
  )
}

function EventsPage() {
  return (
    <section>
      <div className="section-header">
        <h1>Events</h1>
        <Link to="/admin" className="button ghost">Admin tools</Link>
      </div>
      <div className="panel list-panel">
        {mockEvents.map((event) => (
          <div key={event.id} className="list-item">
            <div>
              <strong>{event.title}</strong>
              <small>{new Date(event.startsAt).toLocaleString()}</small>
            </div>
            <span className="badge">{event.status}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function AnnouncementsPage() {
  return (
    <section>
      <h1>Announcements</h1>
      <div className="panel list-panel">
        {mockAnnouncements.map((item) => (
          <div key={item.id} className="list-item">
            <div>
              <strong>{item.title}</strong>
              <small>Published recently</small>
            </div>
            <span className="badge">{item.priority}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function RequestsPage() {
  return (
    <section>
      <h1>My requests</h1>
      <div className="panel list-panel">
        {mockRequests.map((request) => (
          <div key={request.id} className="list-item">
            <div>
              <strong>{request.title}</strong>
              <small>{request.category}</small>
            </div>
            <span className="badge">{request.status}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function AdminDashboardPage() {
  return (
    <section>
      <h1>Admin dashboard</h1>
      <div className="cards-grid">
        <Link className="panel stat-card block-link" to="/admin/documents">
          <div className="stat-label">Documents</div>
          <div className="stat-value">12</div>
        </Link>
        <Link className="panel stat-card block-link" to="/admin/requests">
          <div className="stat-label">Open complaints</div>
          <div className="stat-value">8</div>
        </Link>
        <Link className="panel stat-card block-link" to="/admin/analytics">
          <div className="stat-label">Queries</div>
          <div className="stat-value">241</div>
        </Link>
      </div>
    </section>
  )
}

function AdminDocumentsPage() {
  return (
    <section>
      <h1>Document management</h1>
      <div className="panel list-panel">
        <div className="doc-row"><strong>Academic Regulations</strong><span className="badge success">ACTIVE</span></div>
        <div className="doc-row"><strong>Student Handbook</strong><span className="badge warn">REVIEW</span></div>
        <div className="doc-row"><strong>Fee Policy</strong><span className="badge">ARCHIVED</span></div>
      </div>
    </section>
  )
}

function AdminRequestsPage() {
  return (
    <section>
      <h1>All requests</h1>
      <div className="panel list-panel">
        {mockRequests.map((request) => (
          <div key={request.id} className="list-item">
            <div>
              <strong>{request.title}</strong>
              <small>{request.category}</small>
            </div>
            <span className="badge">{request.status}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function AnalyticsPage() {
  return (
    <section>
      <h1>Analytics</h1>
      <div className="cards-grid">
        <div className="panel stat-card"><div className="stat-label">Queries today</div><div className="stat-value">94</div></div>
        <div className="panel stat-card"><div className="stat-label">Answer rate</div><div className="stat-value">81%</div></div>
        <div className="panel stat-card"><div className="stat-label">Avg latency</div><div className="stat-value">1.2s</div></div>
      </div>
    </section>
  )
}

export default App
