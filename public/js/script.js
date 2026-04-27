/* =============================================
   LIFELINE — script.js
   All frontend logic: auth, SOS, admin, responder
============================================= */

// ─── Session Helpers ────────────────────────────────────────
function getSession() {
  try { return JSON.parse(localStorage.getItem('lifeline_session') || 'null'); } catch { return null; }
}
function setSession(data) { localStorage.setItem('lifeline_session', JSON.stringify(data)); }
function clearSession()   { localStorage.removeItem('lifeline_session'); }

function requireAuth(roles) {
  const session = getSession();
  if (!session) { window.location.href = '/login.html'; return; }
  if (roles && !roles.includes(session.role)) {
    // redirect to correct page
    const map = { admin: '/admin.html', responder: '/responder.html', user: '/dashboard.html' };
    window.location.href = map[session.role] || '/login.html';
  }
}

function logout() {
  clearSession();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = '/login.html', 800);
}

// ─── Toast Notifications ────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.textContent = `${icon} ${message}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, duration);
}

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `msg ${type} show`;
}

function hideMsg(id) {
  const el = document.getElementById(id);
  if (el) el.className = 'msg';
}

// ─── Date Helpers ────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

// ─── setUserUI helper ────────────────────────────────────────
function setUserUI() {
  const session = getSession();
  if (!session) return;
  const avatarEl = document.getElementById('userAvatar');
  const nameEl   = document.getElementById('userName');
  const greetEl  = document.getElementById('greetName');
  const initial  = (session.name || session.email || 'U')[0].toUpperCase();
  
  if (avatarEl) {
    if (session.profilePicture) {
        avatarEl.innerHTML = `<img src="${session.profilePicture}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;" onerror="this.style.display='none'; this.parentElement.textContent='${initial}'">`;
        avatarEl.style.padding = '0';
    } else {
        avatarEl.textContent = initial;
    }
  }
  if (nameEl)   nameEl.textContent   = session.name || session.email || 'User';
  if (greetEl)  greetEl.textContent  = session.name ? session.name.split(' ')[0] : 'there';
}

// ─── Animation Engine ─────────────────────────────────────────

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function initGlobalAnimations() {
    const observerOptions = { threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.classList.contains('stagger')) {
                    const children = entry.target.children;
                    for(let i=0; i<children.length; i++) {
                        children[i].style.transitionDelay = `${(i+1)*0.15}s`;
                        children[i].style.opacity = '1';
                        children[i].style.transform = 'translateY(0)';
                    }
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal, .stagger').forEach(el => observer.observe(el));
    
    // Auto-reveal elements on page load
    setTimeout(() => {
        document.querySelectorAll('.reveal-entry').forEach(el => el.classList.add('visible'));
    }, 100);
}

document.addEventListener('DOMContentLoaded', initGlobalAnimations);

// ══════════════════════════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════════════════════════
async function login() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('loginBtn');
  hideMsg('msg');

  if (!email || !password) { showMsg('msg', 'Please fill in all fields.', 'error'); return; }

  btn.textContent = 'Signing in…';
  btn.disabled = true;

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.role) {
      setSession({ 
        role: data.role, 
        email, 
        name: data.name || email.split('@')[0], 
        id: data.id || null,
        profilePicture: data.profilePicture || '',
        aadhaarNumber: data.aadhaarNumber || ''
      });
      showToast('Login successful!', 'success');
      const redirect = { admin: '/admin.html', responder: '/responder.html', user: '/dashboard.html' };
      setTimeout(() => window.location.href = redirect[data.role], 600);
    } else {
      showMsg('msg', data.message || 'Invalid email or password.', 'error');
      btn.textContent = '🔐 Sign In'; btn.disabled = false;
    }
  } catch (err) {
    showMsg('msg', 'Server error. Please try again.', 'error');
    btn.textContent = '🔐 Sign In'; btn.disabled = false;
  }
}

// Allow Enter key on login
document.addEventListener('DOMContentLoaded', () => {
  ['email','password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  });
});

// ══════════════════════════════════════════════════════════
//  SIGNUP
// ══════════════════════════════════════════════════════════
async function signup() {
  const name     = document.getElementById('name')?.value.trim();
  const phone    = document.getElementById('phone')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const aadhaar  = document.getElementById('aadhaar')?.value.trim();
  const photo    = document.getElementById('photo')?.value.trim();
  const password = document.getElementById('password')?.value;
  const confirm  = document.getElementById('confirm')?.value;
  const terms    = document.getElementById('terms')?.checked;
  const btn      = document.getElementById('signupBtn');
  hideMsg('msg');

  if (!name || !email || !password || !confirm || !aadhaar) { showMsg('msg', 'Please fill in all required fields.', 'error'); return; }
  if (aadhaar.length !== 12 || isNaN(aadhaar))  { showMsg('msg', 'Invalid Aadhaar Number. Must be 12 digits.', 'error'); return; }
  if (password.length < 6)                       { showMsg('msg', 'Password must be at least 6 characters.', 'error'); return; }
  if (password !== confirm)                       { showMsg('msg', 'Passwords do not match.', 'error'); return; }
  if (!terms)                                    { showMsg('msg', 'Please agree to the Terms & Conditions.', 'error'); return; }

  btn.textContent = 'Creating account…'; btn.disabled = true;

  try {
    const res  = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, password, aadhaarNumber: aadhaar, profilePicture: photo })
    });
    const data = await res.json();

    if (data.success) {
      showMsg('msg', 'Account created! Redirecting to login…', 'success');
      showToast('Account created successfully!', 'success');
      setTimeout(() => window.location.href = '/login.html', 1500);
    } else {
      showMsg('msg', data.message || 'Registration failed.', 'error');
      btn.textContent = '🚀 Create Account'; btn.disabled = false;
    }
  } catch (err) {
    showMsg('msg', 'Server error. Please try again.', 'error');
    btn.textContent = '🚀 Create Account'; btn.disabled = false;
  }
}

// Terms Checkbox & Modal Logic
document.addEventListener('DOMContentLoaded', () => {
    const termsCheck = document.getElementById('terms');
    const signupBtn  = document.getElementById('signupBtn');
    const openTerms  = document.getElementById('openTerms');
    const termsModal = document.getElementById('termsModal');

    if (termsCheck && signupBtn) {
        termsCheck.addEventListener('change', () => {
            signupBtn.disabled = !termsCheck.checked;
        });
    }

    if (openTerms && termsModal) {
        openTerms.addEventListener('click', (e) => {
            e.preventDefault();
            termsModal.classList.add('open');
        });
    }
});

// ══════════════════════════════════════════════════════════
//  USER DASHBOARD
// ══════════════════════════════════════════════════════════
async function loadDashboard() {
  setUserUI();
  const dateEl = document.getElementById('currentDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric'});

  try {
    const res  = await fetch('/api/incidents/mine', { headers: authHeaders() });
    const data = await res.json();
    const incidents = Array.isArray(data) ? data : [];

    // Update stats with counting animation
    const curTotal = parseInt(document.getElementById('totalSOS')?.textContent) || 0;
    const curPending = parseInt(document.getElementById('pendingCount')?.textContent) || 0;
    const curResolved = parseInt(document.getElementById('resolvedCount')?.textContent) || 0;

    animateValue('totalSOS', curTotal, incidents.length, 1000);
    animateValue('pendingCount', curPending, incidents.filter(i => i.status === 'Pending').length, 1000);
    animateValue('resolvedCount', curResolved, incidents.filter(i => i.status === 'Resolved').length, 1000);
    setText('myIncidentsBadge', incidents.length);

    // Recent list
    const container = document.getElementById('recentIncidents');
    if (!container) return;
    if (incidents.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">No incidents yet. Stay safe!</div></div>`;
      return;
    }
    container.innerHTML = incidents.slice(0,8).map(i => `
      <div class="incident-item">
        <div class="incident-dot ${i.type ? i.type.toLowerCase() : 'medical'}"></div>
        <div class="incident-info">
          <div class="incident-title">${i.type || '—'} Emergency</div>
          <div class="incident-meta">${i.description || 'No description'}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
          <span class="incident-time">${timeAgo(i.createdAt)}</span>
          <span class="badge ${(i.status||'pending').toLowerCase()}">${i.status || 'Pending'}</span>
        </div>
      </div>`).join('');
  } catch {
    document.getElementById('recentIncidents').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Could not load incidents.</div></div>`;
  }
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function authHeaders() {
  const s = getSession();
  return { 'Content-Type': 'application/json', 'x-user-email': s?.email || '', 'x-user-id': s?.id || '' };
}

// ══════════════════════════════════════════════════════════
//  SOS PAGE
// ══════════════════════════════════════════════════════════
let sosLat = null, sosLng = null, sosType = 'Medical';

function initSOS() {
  setUserUI();
  // Pre-select type from URL param
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('type');
  if (typeParam) selectType(typeParam);
  else selectType('Medical');
  getLocation();
}

function selectType(type) {
  sosType = type;
  document.querySelectorAll('.sos-type-card').forEach(c => c.classList.remove('selected'));
  const el = document.getElementById(`type-${type}`);
  if (el) el.classList.add('selected');
}

function getLocation() {
  const statusEl = document.getElementById('locationStatus');
  const coordsEl = document.getElementById('locationCoords');
  if (!navigator.geolocation) {
    if (statusEl) statusEl.textContent = '⚠️ Geolocation not supported by your browser.';
    return;
  }
  if (statusEl) statusEl.innerHTML = '<span style="color:var(--yellow)">📍 Detecting your location…</span>';
  navigator.geolocation.getCurrentPosition(
    pos => {
      sosLat = pos.coords.latitude;
      sosLng = pos.coords.longitude;
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--green)">✅ Location detected</span>`;
      if (coordsEl) coordsEl.textContent = `Lat: ${sosLat.toFixed(5)}, Lng: ${sosLng.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m accuracy)`;
    },
    err => {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--accent)">⚠️ Location unavailable — ${err.message}</span>`;
      if (coordsEl) coordsEl.textContent = 'Your SOS will be sent without GPS coordinates.';
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

async function sendSOS() {
  const desc = document.getElementById('desc')?.value.trim();
  const btn  = document.getElementById('sosBtn');
  hideMsg('msg');

  if (!sosType) { showMsg('msg', 'Please select emergency type.', 'error'); return; }
  if (!desc)    { showMsg('msg', 'Please describe the emergency.', 'error'); return; }

  btn.style.opacity = '0.7'; btn.style.pointerEvents = 'none';
  btn.innerHTML = '<span class="sos-icon">⏳</span><span>SENDING…</span>';

  try {
    const res  = await fetch('/api/incidents/sos', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ type: sosType, description: desc, latitude: sosLat, longitude: sosLng })
    });
    const data = await res.json();

    if (data.success || data.message) {
      showMsg('msg', '🚨 SOS Sent! Help is on the way.', 'success');
      showToast('Emergency SOS sent successfully!', 'success');
      btn.innerHTML = '<span class="sos-icon">✅</span><span>SENT!</span>';
      // Reset after 4s
      setTimeout(() => {
        btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
        btn.innerHTML = '<span class="sos-icon">🆘</span><span>SOS</span>';
        document.getElementById('desc').value = '';
        hideMsg('msg');
      }, 4000);
    } else {
      throw new Error(data.message || 'Failed');
    }
  } catch (err) {
    showMsg('msg', '❌ Failed to send SOS. Try again.', 'error');
    btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
    btn.innerHTML = '<span class="sos-icon">🆘</span><span>SOS</span>';
  }
}

// ══════════════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════════════
let allIncidentsCache = [];

function initAdmin() {
  const dateEl = document.getElementById('adminDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  loadAdminIncidents();
}

function showSection(name) {
  ['dashboard','incidents','users','responders'].forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.style.display = s === name ? 'block' : 'none';
  });
  // nav highlighting
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navMap = { dashboard: 'navDashboard', incidents: 'navIncidents', users: 'navUsers', responders: 'navResponders' };
  const navEl = document.getElementById(navMap[name]);
  if (navEl) navEl.classList.add('active');

  if (name === 'users') loadUsersTable();
}

async function loadAdminIncidents() {
  try {
    const res  = await fetch('/api/incidents/all', { headers: authHeaders() });
    const data = await res.json();
    allIncidentsCache = Array.isArray(data) ? data : [];
    renderAdminStats(allIncidentsCache);
    renderAdminTable(allIncidentsCache);
  } catch {
    showToast('Failed to load incidents', 'error');
  }
}

function renderAdminStats(incidents) {
  animateValue('statTotal',    0, incidents.length, 1200);
  animateValue('statPending',  0, incidents.filter(i => i.status === 'Pending').length, 1200);
  animateValue('statActive',   0, incidents.filter(i => i.status === 'Active').length, 1200);
  animateValue('statResolved', 0, incidents.filter(i => i.status === 'Resolved').length, 1200);
}

function renderAdminTable(incidents) {
  const container = document.getElementById('adminIncidentTable');
  const allContainer = document.getElementById('allIncidentsTable');
  const html = incidents.length === 0
    ? `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">No incidents found.</div></div>`
    : `<table>
        <thead><tr><th>#</th><th>Type</th><th>Description</th><th>Location</th><th>Status</th><th>Time</th><th>Action</th></tr></thead>
        <tbody>${incidents.map((i, idx) => `
          <tr>
            <td style="color:var(--text-muted)">${idx+1}</td>
            <td><span class="badge ${(i.type||'').toLowerCase()}">${i.type || '—'}</span></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.description || '—'}</td>
            <td style="font-size:12px;color:var(--text-muted)">${i.latitude ? `${parseFloat(i.latitude).toFixed(4)}, ${parseFloat(i.longitude).toFixed(4)}` : 'No GPS'}</td>
            <td><span class="badge ${(i.status||'pending').toLowerCase()}">${i.status}</span></td>
            <td style="font-size:12px;color:var(--text-muted)">${timeAgo(i.createdAt)}</td>
            <td><button class="btn btn-secondary btn-sm" onclick="openModal('${i._id}','${i.status}')">✏️ Update</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  if (container)    container.innerHTML = html;
  if (allContainer) allContainer.innerHTML = html;
}

function filterIncidents() {
  const status = document.getElementById('filterStatus')?.value;
  const type   = document.getElementById('filterType')?.value;
  let filtered = allIncidentsCache;
  if (status) filtered = filtered.filter(i => i.status === status);
  if (type)   filtered = filtered.filter(i => i.type   === type);
  renderAdminTable(filtered);
}

async function loadUsersTable() {
  const container = document.getElementById('usersTable');
  if (!container) return;
  try {
    const res  = await fetch('/api/auth/users', { headers: authHeaders() });
    const data = await res.json();
    const users = Array.isArray(data) ? data : [];
    if (users.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">No registered users yet.</div></div>`;
      return;
    }
    container.innerHTML = `<table>
      <thead><tr><th>Photo</th><th>Name</th><th>Email</th><th>Aadhaar</th><th>Role</th><th>Action</th></tr></thead>
      <tbody>${users.map(u => `
        <tr>
          <td>
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 10px;">
              ${u.profilePicture ? `<img src="${u.profilePicture}" style="width: 100%; height: 100%; object-fit: cover;">` : 'U'}
            </div>
          </td>
          <td style="font-weight: 600;">${u.name || '—'}</td>
          <td style="font-size: 12px; color: var(--text-dim);">${u.email}</td>
          <td style="font-family: monospace; font-size: 13px;">${u.aadhaarNumber ? u.aadhaarNumber.replace(/(.{4})/g, '$1 ') : '—'}</td>
          <td><span class="badge ${u.role === 'responder' ? 'resolved' : 'pending'}">${u.role || 'user'}</span></td>
          <td>
            ${u.role === 'user' ? `<button class="btn btn-secondary btn-sm" onclick="promoteUser('${u._id}','responder')" style="padding: 6px 12px; font-size: 11px;">🦺 Promote</button>` : `<button class="btn btn-secondary btn-sm" onclick="promoteUser('${u._id}','user')" style="padding: 6px 12px; font-size: 11px;">👤 Demote</button>`}
          </td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Failed to load users.</div></div>`;
  }
}

async function promoteUser(id, role) {
    try {
        const res = await fetch(`/api/auth/users/${id}/role`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ role })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`User updated to ${role}`, "success");
            loadUsersTable();
        }
    } catch (err) {
        showToast("Role update failed", "error");
    }
}

// ─── Status Modal ───────────────────────────────────────────
function openModal(incidentId, currentStatus) {
  document.getElementById('modalIncidentId').value = incidentId;
  document.getElementById('modalStatus').value     = currentStatus;
  document.getElementById('statusModal').classList.add('open');
}
function closeModal() { document.getElementById('statusModal').classList.remove('open'); }

async function confirmStatusUpdate() {
  const id     = document.getElementById('modalIncidentId').value;
  const status = document.getElementById('modalStatus').value;
  try {
    const res  = await fetch(`/api/incidents/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Status updated to ${status}`, 'success');
      closeModal();
      loadAdminIncidents();
    } else throw new Error();
  } catch {
    showToast('Failed to update status', 'error');
  }
}

// ══════════════════════════════════════════════════════════
//  RESPONDER
// ══════════════════════════════════════════════════════════
let leafletMap = null;

function initResponder() {
  loadResponderData();
  setTimeout(initLeafletMap, 300);
}

function showRSection(name) {
  ['map','incidents','history'].forEach(s => {
    const el = document.getElementById(`rsection-${s}`);
    if (el) el.style.display = s === name ? 'block' : 'none';
  });
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (name === 'map') document.getElementById('navMap')?.classList.add('active');
  if (name === 'incidents') { document.getElementById('navRIncidents')?.classList.add('active'); loadResponderIncidents(); }
  if (name === 'history')   loadResponderHistory();
  if (name === 'map' && leafletMap) { setTimeout(() => leafletMap.invalidateSize(), 200); }
}

async function loadResponderData() {
  try {
    const res  = await fetch('/api/incidents/all', { headers: authHeaders() });
    const data = await res.json();
    const incidents = Array.isArray(data) ? data : [];
    animateValue('rStatPending',  0, incidents.filter(i => i.status === 'Pending').length, 1200);
    animateValue('rStatActive',   0, incidents.filter(i => i.status === 'Active').length, 1200);
    animateValue('rStatResolved', 0, incidents.filter(i => i.status === 'Resolved').length, 1200);
    drawMapMarkers(incidents);
  } catch {}
}

function initLeafletMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl || !window.L) return;
  if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  leafletMap = L.map('map', { zoomControl: true }).setView([20.5937, 78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 18
  }).addTo(leafletMap);
}

function drawMapMarkers(incidents) {
  if (!leafletMap || !window.L) return;
  const colors = { Medical: '#e63946', Police: '#457bff', Fire: '#f77f00' };
  incidents.filter(i => i.latitude && i.longitude).forEach(i => {
    const color  = colors[i.type] || '#e63946';
    const icon   = L.divIcon({
      html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px ${color}"></div>`,
      iconSize: [18,18], iconAnchor: [9,9], className: ''
    });
    L.marker([i.latitude, i.longitude], { icon })
      .addTo(leafletMap)
      .bindPopup(`<b>${i.type} Emergency</b><br/>${i.description || '—'}<br/><small>${formatDate(i.createdAt)}</small><br/><span style="color:${color}">${i.status}</span>`);
  });
}

function refreshMap() {
  loadResponderData();
  showToast('Map refreshed', 'info');
}

async function loadResponderIncidents() {
  const container = document.getElementById('rIncidentsList');
  if (!container) return;
  container.innerHTML = `<div class="empty-state"><div class="loading-dots"><span></span><span></span><span></span></div></div>`;
  try {
    const res  = await fetch('/api/incidents/all', { headers: authHeaders() });
    const data = await res.json();
    const active = (Array.isArray(data) ? data : []).filter(i => i.status !== 'Resolved');
    if (active.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-text">No active incidents. All clear!</div></div>`;
      return;
    }
    const typeIcon = { Medical: '🏥', Police: '👮', Fire: '🔥' };
    container.innerHTML = active.map(i => `
      <div class="r-incident-card">
        <div class="r-incident-header">
          <div class="r-incident-type">${typeIcon[i.type] || '🆘'} ${i.type} Emergency</div>
          <span class="badge ${(i.status||'pending').toLowerCase()}">${i.status}</span>
        </div>
        <div class="r-incident-loc">📍 ${i.latitude ? `${parseFloat(i.latitude).toFixed(4)}, ${parseFloat(i.longitude).toFixed(4)}` : 'No GPS data'} &nbsp;·&nbsp; ${timeAgo(i.createdAt)}</div>
        <div class="r-incident-desc">${i.description || 'No description provided.'}</div>
        <div class="r-incident-actions">
          ${i.status === 'Pending'  ? `<button class="btn btn-outline btn-sm" onclick="updateResponderStatus('${i._id}','Active')">⚡ Mark Active</button>` : ''}
          ${i.status !== 'Resolved' ? `<button class="btn btn-secondary btn-sm" onclick="updateResponderStatus('${i._id}','Resolved')">✅ Resolve</button>` : ''}
          ${i.latitude ? `<a href="https://maps.google.com/?q=${i.latitude},${i.longitude}" target="_blank" class="btn btn-secondary btn-sm">🗺️ Open Map</a>` : ''}
        </div>
      </div>`).join('');
  } catch {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Failed to load incidents.</div></div>`;
  }
}

async function updateResponderStatus(id, status) {
  try {
    const res  = await fetch(`/api/incidents/${id}/status`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Incident marked as ${status}`, 'success');
      loadResponderIncidents();
      loadResponderData();
    }
  } catch { showToast('Update failed', 'error'); }
}

async function loadResponderHistory() {
  const container = document.getElementById('rHistoryTable');
  if (!container) return;
  try {
    const res  = await fetch('/api/incidents/all', { headers: authHeaders() });
    const data = await res.json();
    const resolved = (Array.isArray(data) ? data : []).filter(i => i.status === 'Resolved');
    if (resolved.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">No resolved incidents yet.</div></div>`;
      return;
    }
    container.innerHTML = `<table>
      <thead><tr><th>Type</th><th>Description</th><th>Location</th><th>Resolved At</th></tr></thead>
      <tbody>${resolved.map(i => `
        <tr>
          <td><span class="badge ${(i.type||'').toLowerCase()}">${i.type}</span></td>
          <td>${i.description || '—'}</td>
          <td style="font-size:12px;color:var(--text-muted)">${i.latitude ? `${parseFloat(i.latitude).toFixed(4)}, ${parseFloat(i.longitude).toFixed(4)}` : 'No GPS'}</td>
          <td style="font-size:12px;color:var(--text-muted)">${formatDate(i.createdAt)}</td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">Failed to load history.</div></div>`;
  }
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD MAP & CONTACTS
// ══════════════════════════════════════════════════════════
let dashMap = null;

function initDashboardMap() {
    const mapEl = document.getElementById('miniMap');
    if (!mapEl || !window.L) return;
    
    dashMap = L.map('miniMap', { 
        zoomControl: false, 
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false
    }).setView([20.5937, 78.9629], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
    }).addTo(dashMap);

    // Get current location
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        dashMap.setView([latitude, longitude], 15);
        L.circle([latitude, longitude], {
            color: 'var(--clr-blue)',
            fillColor: 'var(--clr-blue)',
            fillOpacity: 0.2,
            radius: 200
        }).addTo(dashMap);
        
        const locStatus = document.getElementById('locationStatus');
        if (locStatus) locStatus.textContent = '📍 Secured Zone: Active';
    });
}

async function loadContacts() {
    const grid = document.getElementById('contactGrid');
    if (!grid) return;

    try {
        const res = await fetch('/api/contacts', { headers: authHeaders() });
        const contacts = await res.json();
        
        if (contacts.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No contacts added to your circle yet.</div>`;
            return;
        }

        grid.innerHTML = contacts.map(c => `
            <div class="contact-card stagger-item">
                <div class="contact-avatar">${c.name[0].toUpperCase()}</div>
                <div class="contact-name">${c.name}</div>
                <div class="contact-relation">${c.relation}</div>
                <div style="margin-top: 16px; font-weight: 600; font-size: 14px;">${c.phone}</div>
                <button onclick="deleteContact('${c._id}')" style="margin-top: 20px; color: var(--clr-red); background: none; font-size: 12px; cursor: pointer;">Remove</button>
            </div>
        `).join('');
    } catch (err) {
        console.error("Failed to load contacts", err);
    }
}

function openContactModal() {
    const modal = document.getElementById('contactModal');
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.transform = 'translate(-50%, -50%) scale(1)';
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    modal.style.opacity = '0';
    modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => modal.style.visibility = 'hidden', 300);
}

async function saveContact() {
    const name = document.getElementById('cName').value.trim();
    const relation = document.getElementById('cRelation').value.trim();
    const phone = document.getElementById('cPhone').value.trim();

    if (!name || !phone) { showToast("Name and Phone are required", "error"); return; }

    try {
        const res = await fetch('/api/contacts', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ name, relation, phone })
        });
        const data = await res.json();
        if (data.success) {
            showToast("Contact added!", "success");
            closeContactModal();
            loadContacts();
            // Clear inputs
            ['cName', 'cRelation', 'cPhone'].forEach(id => document.getElementById(id).value = '');
        }
    } catch (err) {
        showToast("Failed to save contact", "error");
    }
}

async function deleteContact(id) {
    if (!confirm("Remove this contact?")) return;
    try {
        await fetch(`/api/contacts/${id}`, { method: 'DELETE', headers: authHeaders() });
        showToast("Contact removed", "info");
        loadContacts();
    } catch (err) {
        showToast("Delete failed", "error");
    }
}

// ─── Real-time Polling ───────────────────────────────────────
function startDashboardPolling() {
    setInterval(() => {
        const session = getSession();
        if (session && session.role === 'user' && window.location.pathname.includes('dashboard')) {
            loadDashboard();
        }
    }, 15000); // Poll every 15s
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard')) startDashboardPolling();
});