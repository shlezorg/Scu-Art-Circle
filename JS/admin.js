/**
 * SCU ArtCircle - Admin Dashboard Logic
 * Integrates mock auth, role-based controls, dashboard widgets, Chart.js, 
 * CRUD panels, database backup/restore, CSV/PDF exports, and custom toasts.
 */

// Global State Variables
let currentTab = 'dashboard';
let db = null;
let activeUser = null;
let activeContactId = null;

// Pagination variables
let galleryCurrentPage = 1;
const galleryItemsPerPage = 8;

// DOMContentLoaded Entrypoint
document.addEventListener('DOMContentLoaded', () => {
    // Load Database
    db = getDB();
    
    // Check Session Auth
    checkSession();
    
    // Initialize UI Hooks
    initUIHooks();
});

// ==========================================================================
// 1. AUTHENTICATION & ROLE MANAGEMENT
// ==========================================================================

function checkSession() {
    const session = sessionStorage.getItem('scu_admin_session') || localStorage.getItem('scu_admin_session');
    if (session) {
        try {
            activeUser = JSON.parse(session);
            showAdminPanel();
        } catch (e) {
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('admin-panel').classList.remove('admin-container');
    document.getElementById('admin-panel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('admin-panel').style.display = 'flex';
    document.getElementById('admin-panel').classList.add('admin-container');
    
    // Update User Profile Header
    document.getElementById('user-display-name').textContent = activeUser.name;
    document.getElementById('user-display-role').textContent = activeUser.role;
    if (activeUser.avatar) {
        document.getElementById('user-avatar-img').src = activeUser.avatar;
    }
    
    // Set simulator selector matching activeUser role
    document.getElementById('role-simulator').value = activeUser.role;
    
    // Load initial tab data
    switchTab(currentTab);
    updateBadges();
    
    showToast(`Welcome back, ${activeUser.name}! Logged in as ${activeUser.role}.`, 'toast-success');
}

// Check Role Permissions
function checkPermission(action) {
    const role = activeUser ? activeUser.role : 'Guest';
    
    const PERMISSIONS = {
        'Super Admin': ['all'],
        'Admin': ['hero', 'about', 'categories', 'events', 'gallery', 'team', 'announcements', 'memberships', 'contact', 'logs'],
        'Editor': ['hero', 'about', 'categories', 'gallery', 'announcements'],
        'Event Manager': ['events', 'categories'],
        'Gallery Manager': ['gallery']
    };
    
    const allowedTabs = PERMISSIONS[role] || [];
    
    if (allowedTabs.includes('all')) return true;
    if (allowedTabs.includes(action)) return true;
    
    return false;
}

// Enforce Action Roles
function enforcePermission(action) {
    if (!checkPermission(action)) {
        showToast(`Access Denied: Your role (${activeUser.role}) does not have permission to modify ${action}.`, 'toast-error');
        return false;
    }
    return true;
}

// Switch simulator role directly (for testing)
document.getElementById('role-simulator').addEventListener('change', (e) => {
    const newRole = e.target.value;
    activeUser.role = newRole;
    
    // Find matching user profile to simulate fully
    const matchingUser = db.auth.users.find(u => u.role === newRole);
    if (matchingUser) {
        activeUser.name = matchingUser.name;
        activeUser.avatar = matchingUser.avatar;
    } else {
        activeUser.name = newRole + " Simulator";
        activeUser.avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80';
    }
    
    // Re-save session
    if (sessionStorage.getItem('scu_admin_session')) {
        sessionStorage.setItem('scu_admin_session', JSON.stringify(activeUser));
    } else {
        localStorage.setItem('scu_admin_session', JSON.stringify(activeUser));
    }
    
    // Reload Panel
    showAdminPanel();
    logActivity(activeUser.name, activeUser.role, `switched simulator role to ${newRole}`);
});

// Login submit
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value.trim();
    const rememberMe = document.getElementById('login-remember').checked;
    
    const user = db.auth.users.find(u => u.username === usernameInput && u.password === passwordInput);
    
    if (user) {
        // Check if 2FA is enabled for this user
        // We simulate 2FA by fetching preference from settings/profile
        const users2FA = JSON.parse(localStorage.getItem('users_2fa_enabled') || '{}');
        const is2FA = users2FA[user.username] === true;
        
        if (is2FA) {
            // Open 2FA Modal
            const mockCode = Math.floor(100000 + Math.random() * 900000);
            document.getElementById('mock-2fa-code').textContent = mockCode;
            openAdminModal('2fa');
            
            // Handle 2FA Verification
            const form2fa = document.getElementById('form-2fa');
            // Clean previous event listener
            const newForm = form2fa.cloneNode(true);
            form2fa.parentNode.replaceChild(newForm, form2fa);
            
            newForm.addEventListener('submit', (evt) => {
                evt.preventDefault();
                const inputCode = document.getElementById('field-2fa-code').value.trim();
                if (inputCode === mockCode.toString() || inputCode === '123456') {
                    closeAdminModal('2fa');
                    completeLogin(user, rememberMe);
                } else {
                    showToast('Invalid 2FA Code. Access Denied.', 'toast-error');
                }
            });
        } else {
            completeLogin(user, rememberMe);
        }
    } else {
        showToast('Invalid username or password.', 'toast-error');
    }
});

function completeLogin(user, rememberMe) {
    activeUser = {
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        avatar: user.avatar
    };
    
    const sessionStr = JSON.stringify(activeUser);
    if (rememberMe) {
        localStorage.setItem('scu_admin_session', sessionStr);
    } else {
        sessionStorage.setItem('scu_admin_session', sessionStr);
    }
    
    logActivity(activeUser.name, activeUser.role, "signed in successfully");
    showAdminPanel();
}

// Forgot Password Dialog
document.getElementById('forgot-password-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Simulated Password Recovery: A password reset link has been dispatched to admin@scuartcircle.org. The default password is "password123".');
});

// Logout action
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    logActivity(activeUser.name, activeUser.role, "signed out of CMS");
    activeUser = null;
    sessionStorage.removeItem('scu_admin_session');
    localStorage.removeItem('scu_admin_session');
    showLoginScreen();
    showToast('Signed out successfully.', 'toast-info');
});

// Change Password form submit
document.getElementById('change-password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPass = document.getElementById('chg-password-current').value;
    const newPass = document.getElementById('chg-password-new').value;
    const confirmPass = document.getElementById('chg-password-confirm').value;
    
    // Find matching account password
    const user = db.auth.users.find(u => u.username === activeUser.username);
    
    if (user.password !== currentPass) {
        showToast('Incorrect current password.', 'toast-error');
        return;
    }
    if (newPass !== confirmPass) {
        showToast('New passwords do not match.', 'toast-error');
        return;
    }
    
    // Update db
    user.password = newPass;
    saveDB(db);
    
    closeAdminModal('change-password');
    document.getElementById('change-password-form').reset();
    showToast('Password updated successfully.', 'toast-success');
    logActivity(activeUser.name, activeUser.role, "updated account password");
});

// Profile Settings Update
document.getElementById('profile-settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name-field').value;
    const email = document.getElementById('profile-email-field').value;
    const is2FA = document.getElementById('profile-2fa-enabled').checked;
    
    // Update activeUser
    activeUser.name = name;
    activeUser.email = email;
    
    // Save 2FA preference in local storage
    const users2FA = JSON.parse(localStorage.getItem('users_2fa_enabled') || '{}');
    users2FA[activeUser.username] = is2FA;
    localStorage.setItem('users_2fa_enabled', JSON.stringify(users2FA));
    
    // Update database user
    const dbUser = db.auth.users.find(u => u.username === activeUser.username);
    if (dbUser) {
        dbUser.name = name;
        dbUser.email = email;
        if (document.getElementById('profile-settings-img').src) {
            dbUser.avatar = document.getElementById('profile-settings-img').src;
            activeUser.avatar = dbUser.avatar;
        }
    }
    saveDB(db);
    
    // Update session storage
    if (sessionStorage.getItem('scu_admin_session')) {
        sessionStorage.setItem('scu_admin_session', JSON.stringify(activeUser));
    } else {
        localStorage.setItem('scu_admin_session', JSON.stringify(activeUser));
    }
    
    closeAdminModal('profile-settings');
    showAdminPanel();
    showToast('Profile settings updated.', 'toast-success');
    logActivity(activeUser.name, activeUser.role, "updated profile settings");
});

// Avatar photo upload triggers
document.getElementById('profile-avatar-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        compressImage(file, (base64) => {
            document.getElementById('profile-settings-img').src = base64;
        });
    }
});

// ==========================================================================
// 2. DASHBOARD & CHARTS WIDGETS
// ==========================================================================

let visitorsChartInstance = null;
let growthChartInstance = null;

function renderDashboardData() {
    // Dynamic Stats Counts
    document.getElementById('dash-members-count').textContent = db.memberships.filter(m => m.status === 'approved').length + 500; // Add pre-loaded 500
    document.getElementById('dash-events-count').textContent = db.events.filter(e => e.status === 'published').length;
    document.getElementById('dash-gallery-count').textContent = db.gallery.length;
    document.getElementById('dash-team-count').textContent = db.team.filter(t => t.active).length;
    
    const unreadMessagesCount = db.contactMessages.filter(c => !c.read).length;
    document.getElementById('dash-messages-count').textContent = db.contactMessages.length;
    document.getElementById('dash-unread-text').textContent = `${unreadMessagesCount} unread`;
    
    const pendingMembershipCount = db.memberships.filter(m => m.status === 'pending').length;
    document.getElementById('dash-membership-requests-count').textContent = db.memberships.length;
    document.getElementById('dash-pending-membership-text').textContent = `${pendingMembershipCount} pending`;
    
    document.getElementById('dash-announcements-count').textContent = db.announcements.length;
    document.getElementById('dash-visitors-count').textContent = db.settings.analyticsVisitors.toLocaleString();
    
    // LocalStorage storage quota calculations
    let totalBytes = 0;
    for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
            totalBytes += (localStorage[x].length + x.length) * 2; // UTF-16 character is 2 bytes
        }
    }
    const percentUsed = Math.min(100, Math.max(0.1, (totalBytes / (5 * 1024 * 1024)) * 100)).toFixed(1);
    document.getElementById('status-storage').textContent = `${percentUsed}% Used (${(totalBytes/1024).toFixed(0)} KB)`;
    if (percentUsed > 85) {
        document.getElementById('status-storage').className = "status-value text-danger";
    } else {
        document.getElementById('status-storage').className = "status-value text-warning";
    }

    // Dynamic Lists
    renderDashboardActivities();
    renderDashboardMemberships();
    renderDashboardCalendar();
    renderDashboardCharts();
}

function renderDashboardActivities() {
    const list = document.getElementById('dashboard-activities');
    list.innerHTML = '';
    
    // Take top 5 recent activity logs
    db.activityLogs.slice(0, 5).forEach(log => {
        let avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80';
        const u = db.auth.users.find(usr => usr.name === log.user);
        if (u && u.avatar) avatar = u.avatar;
        
        list.innerHTML += `
            <div class="log-item-compact">
                <img src="${avatar}" alt="Avatar" class="log-item-img">
                <div class="log-item-body">
                    <span class="log-item-user">${log.user}</span> (${log.role}) <span>${log.action}</span>
                    <div class="log-item-time">${log.time}</div>
                </div>
            </div>
        `;
    });
}

function renderDashboardMemberships() {
    const list = document.getElementById('dashboard-memberships');
    list.innerHTML = '';
    
    // Take top 4 recent membership forms
    db.memberships.slice(0, 4).forEach(m => {
        let catColorClass = 'badge-pending';
        if (m.status === 'approved') catColorClass = 'badge-approved';
        if (m.status === 'rejected') catColorClass = 'badge-rejected';
        
        list.innerHTML += `
            <div class="member-item-compact">
                <div class="member-item-body">
                    <span class="member-item-name">${m.name}</span>
                    <div class="member-item-date">${m.email} | ${m.artCategory.toUpperCase()}</div>
                </div>
                <span class="member-badge ${catColorClass}">${m.status.toUpperCase()}</span>
            </div>
        `;
    });
}

function renderDashboardCalendar() {
    const calendar = document.getElementById('dashboard-calendar');
    const list = document.getElementById('calendar-events-list');
    calendar.innerHTML = '';
    list.innerHTML = '';
    
    // Render Days Headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(d => {
        calendar.innerHTML += `<div class="calendar-day-header">${d}</div>`;
    });
    
    // We render July 2026 (matching mockup)
    // July 2026 starts on a Wednesday (offset = 3 empty slots)
    // Has 31 days
    const offset = 3;
    const totalDays = 31;
    
    for (let i = 0; i < offset; i++) {
        calendar.innerHTML += `<div class="calendar-day empty"></div>`;
    }
    
    // Map active events dates
    const eventDatesMap = {};
    db.events.forEach(e => {
        if (e.status === 'published' && e.date.startsWith('2026-07-')) {
            const dayNum = parseInt(e.date.split('-')[2]);
            if (!eventDatesMap[dayNum]) eventDatesMap[dayNum] = [];
            eventDatesMap[dayNum].push(e);
        }
    });
    
    for (let day = 1; day <= totalDays; day++) {
        const isToday = day === 2; // Simulate July 2nd 2026
        const hasEvent = eventDatesMap[day] !== undefined;
        
        let classStr = 'calendar-day';
        if (isToday) classStr += ' today';
        if (hasEvent) classStr += ' has-event';
        
        calendar.innerHTML += `
            <div class="${classStr}" onclick="handleCalendarDateClick(${day})">
                ${day}
            </div>
        `;
        
        // If has event, list it in upcoming events
        if (hasEvent) {
            eventDatesMap[day].forEach(evt => {
                const hourMinStr = formatTimeString(evt.time);
                list.innerHTML += `
                    <div class="cal-event-item">
                        <div class="cal-event-time">${evt.date.split('-')[1]}/${day} ${hourMinStr}</div>
                        <div class="cal-event-info">
                            <h4>${evt.title}</h4>
                            <p><i class="fas fa-location-dot"></i> ${evt.venue}</p>
                        </div>
                    </div>
                `;
            });
        }
    }
}

function handleCalendarDateClick(day) {
    // Show toast for simplicity
    showToast(`Viewing calendar schedule for July ${day}, 2026`, 'toast-info');
}

function renderDashboardCharts() {
    const isDark = document.body.classList.contains('theme-dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#8F8F9D' : '#6C6C7E';
    
    // Destroy previous Chart Instances
    if (visitorsChartInstance) visitorsChartInstance.destroy();
    if (growthChartInstance) growthChartInstance.destroy();
    
    const ctx1 = document.getElementById('visitorsChart').getContext('2d');
    const ctx2 = document.getElementById('growthChart').getContext('2d');
    
    // Chart 1: Visitors line chart
    visitorsChartInstance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['Jun 1', 'Jun 8', 'Jun 15', 'Jun 22', 'Jun 29'],
            datasets: [{
                label: 'Monthly Visitors',
                data: [1200, 2400, 2100, 2684, 3487],
                borderColor: '#D8B15C',
                backgroundColor: 'rgba(216, 177, 92, 0.15)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            }
        }
    });
    
    // Chart 2: Registrations bar chart
    growthChartInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Music', 'Dance', 'Drama', 'Visual Arts', 'Literature'],
            datasets: [{
                label: 'Event Registrations',
                data: [340, 180, 290, 120, 70],
                backgroundColor: 'rgba(0, 219, 222, 0.6)',
                borderColor: '#00DBDE',
                borderWidth: 1,
                borderRadius: 4
            }, {
                label: 'Membership Growth',
                data: [120, 95, 60, 110, 45],
                backgroundColor: 'rgba(155, 93, 229, 0.6)',
                borderColor: '#9B5DE5',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor, font: { family: 'Poppins' } }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

// ==========================================================================
// 3. HERO & ABOUT SECTION MANAGEMENT
// ==========================================================================

function renderHeroTab() {
    const h = db.hero;
    
    document.getElementById('hero-title').value = h.title;
    document.getElementById('hero-title-highlight').value = h.titleHighlight;
    document.getElementById('hero-desc').value = h.description;
    document.getElementById('hero-video').value = h.videoUrl;
    document.getElementById('hero-video-mov').value = h.videoFallbackUrl || '';
    document.getElementById('hero-btn-primary').value = h.primaryButtonText;
    document.getElementById('hero-btn-primary-link').value = h.primaryButtonLink;
    document.getElementById('hero-btn-secondary').value = h.secondaryButtonText;
    document.getElementById('hero-btn-secondary-link').value = h.secondaryButtonLink;
    document.getElementById('hero-fb').value = h.facebookLink;
    document.getElementById('hero-ig').value = h.instagramLink;
    document.getElementById('hero-tt').value = h.tiktokLink;
    document.getElementById('hero-avatar-desc').value = h.avatarText;
    
    document.getElementById('toggle-hero-logo').checked = h.visibility.logo;
    document.getElementById('toggle-hero-avatars').checked = h.visibility.avatars;
    document.getElementById('toggle-hero-socials').checked = h.visibility.socials;
    document.getElementById('toggle-hero-upcoming').checked = h.visibility.upcomingCard;
    document.getElementById('toggle-hero-join').checked = h.visibility.joinCard;
}

document.getElementById('hero-management-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!enforcePermission('hero')) return;
    
    const h = db.hero;
    h.title = document.getElementById('hero-title').value;
    h.titleHighlight = document.getElementById('hero-title-highlight').value;
    h.description = document.getElementById('hero-desc').value;
    h.videoUrl = document.getElementById('hero-video').value;
    h.videoFallbackUrl = document.getElementById('hero-video-mov').value;
    h.primaryButtonText = document.getElementById('hero-btn-primary').value;
    h.primaryButtonLink = document.getElementById('hero-btn-primary-link').value;
    h.secondaryButtonText = document.getElementById('hero-btn-secondary').value;
    h.secondaryButtonLink = document.getElementById('hero-btn-secondary-link').value;
    h.facebookLink = document.getElementById('hero-fb').value;
    h.instagramLink = document.getElementById('hero-ig').value;
    h.tiktokLink = document.getElementById('hero-tt').value;
    h.avatarText = document.getElementById('hero-avatar-desc').value;
    
    h.visibility.logo = document.getElementById('toggle-hero-logo').checked;
    h.visibility.avatars = document.getElementById('toggle-hero-avatars').checked;
    h.visibility.socials = document.getElementById('toggle-hero-socials').checked;
    h.visibility.upcomingCard = document.getElementById('toggle-hero-upcoming').checked;
    h.visibility.joinCard = document.getElementById('toggle-hero-join').checked;
    
    saveDB(db);
    showToast('Hero section settings saved successfully!', 'toast-success');
    logActivity(activeUser.name, activeUser.role, "updated Hero section properties");
});

function renderAboutTab() {
    const a = db.about;
    
    document.getElementById('about-tag').value = a.tag;
    document.getElementById('about-heading').value = a.heading;
    document.getElementById('about-description').value = a.description;
    document.getElementById('about-large-card-img').value = a.largeCardImage;
    document.getElementById('about-large-card-overlay').value = a.largeCardOverlayText;
    document.getElementById('about-large-card-link').value = a.largeCardLink;
    
    document.getElementById('about-mission-tag').value = a.mission.tag;
    document.getElementById('about-mission-heading').value = a.mission.heading;
    document.getElementById('about-mission-description').value = a.mission.description;
    document.getElementById('about-mission-logo').value = a.mission.logoUrl;
    document.getElementById('about-mission-community-img').value = a.mission.communityImage;
    
    // Render Stats Inputs
    const container = document.getElementById('about-stats-container');
    container.innerHTML = '';
    
    a.stats.forEach((s, idx) => {
        container.innerHTML += `
            <div class="form-grid mt-2" style="border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-sm); margin-bottom:12px;">
                <div class="form-group">
                    <label>Stat ${idx+1} Icon Class</label>
                    <input type="text" class="about-stat-icon" data-index="${idx}" value="${s.icon}" required>
                </div>
                <div class="form-group">
                    <label>Stat ${idx+1} Figure</label>
                    <input type="text" class="about-stat-number" data-index="${idx}" value="${s.number}" required>
                </div>
                <div class="form-group">
                    <label>Stat ${idx+1} Label</label>
                    <input type="text" class="about-stat-label" data-index="${idx}" value="${s.label}" required>
                </div>
            </div>
        `;
    });
}

document.getElementById('about-management-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!enforcePermission('about')) return;
    
    const a = db.about;
    a.tag = document.getElementById('about-tag').value;
    a.heading = document.getElementById('about-heading').value;
    a.description = document.getElementById('about-description').value;
    a.largeCardImage = document.getElementById('about-large-card-img').value;
    a.largeCardOverlayText = document.getElementById('about-large-card-overlay').value;
    a.largeCardLink = document.getElementById('about-large-card-link').value;
    
    a.mission.tag = document.getElementById('about-mission-tag').value;
    a.mission.heading = document.getElementById('about-mission-heading').value;
    a.mission.description = document.getElementById('about-mission-description').value;
    a.mission.logoUrl = document.getElementById('about-mission-logo').value;
    a.mission.communityImage = document.getElementById('about-mission-community-img').value;
    
    // Gather stats inputs
    const statIcons = document.querySelectorAll('.about-stat-icon');
    const statNumbers = document.querySelectorAll('.about-stat-number');
    const statLabels = document.querySelectorAll('.about-stat-label');
    
    a.stats = [];
    statIcons.forEach((el, idx) => {
        a.stats.push({
            icon: el.value,
            number: statNumbers[idx].value,
            label: statLabels[idx].value
        });
    });
    
    saveDB(db);
    showToast('About section settings saved successfully!', 'toast-success');
    logActivity(activeUser.name, activeUser.role, "updated About section narrative and stats");
});

// ==========================================================================
// 4. ART CATEGORIES CRUD
// ==========================================================================

function renderCategoriesTab() {
    const tbody = document.getElementById('categories-tbody');
    tbody.innerHTML = '';
    
    db.categories.sort((a, b) => a.displayOrder - b.displayOrder).forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${c.displayOrder}</strong></td>
                <td><i class="${c.icon}" style="font-size: 1.25rem; color: var(--gold);"></i></td>
                <td><code>${c.id}</code></td>
                <td><strong>${c.title}</strong></td>
                <td>${c.description}</td>
                <td>
                    <span class="member-badge ${c.enabled ? 'badge-approved' : 'badge-rejected'}">
                        ${c.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="action-btn-sm" onclick="editCategory('${c.id}')" title="Edit"><i class="far fa-edit"></i></button>
                    <button class="action-btn-sm action-btn-danger" onclick="confirmDeleteCategory('${c.id}')" title="Delete"><i class="far fa-trash-can"></i></button>
                </td>
            </tr>
        `;
    });
}

function openCategoryModal(catId = null) {
    if (!enforcePermission('categories')) return;
    
    const modal = document.getElementById('modal-category');
    const form = document.getElementById('category-modal-form');
    form.reset();
    
    if (catId) {
        document.getElementById('category-modal-title').textContent = "Edit Art Category";
        const c = db.categories.find(cat => cat.id === catId);
        document.getElementById('cat-field-id').value = c.id;
        document.getElementById('cat-field-title').value = c.title;
        document.getElementById('cat-field-icon').value = c.icon;
        document.getElementById('cat-field-desc').value = c.description;
        document.getElementById('cat-field-order').value = c.displayOrder;
        document.getElementById('cat-field-enabled').checked = c.enabled;
        
        // Ready only for key
        document.getElementById('cat-field-title').readOnly = false;
    } else {
        document.getElementById('category-modal-title').textContent = "Add Art Category";
        document.getElementById('cat-field-id').value = '';
        document.getElementById('cat-field-title').readOnly = false;
    }
    
    openAdminModal('category');
}

document.getElementById('category-modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!enforcePermission('categories')) return;
    
    const id = document.getElementById('cat-field-id').value;
    const title = document.getElementById('cat-field-title').value;
    const icon = document.getElementById('cat-field-icon').value;
    const desc = document.getElementById('cat-field-desc').value;
    const order = parseInt(document.getElementById('cat-field-order').value);
    const enabled = document.getElementById('cat-field-enabled').checked;
    
    if (id) {
        // Edit
        const c = db.categories.find(cat => cat.id === id);
        c.title = title;
        c.icon = icon;
        c.description = desc;
        c.displayOrder = order;
        c.enabled = enabled;
        showToast(`Category "${title}" updated.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `edited art category "${title}"`);
    } else {
        // Add
        const newId = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (db.categories.some(cat => cat.id === newId)) {
            showToast('Category name already exists.', 'toast-error');
            return;
        }
        db.categories.push({
            id: newId,
            title,
            icon,
            description: desc,
            displayOrder: order,
            enabled
        });
        showToast(`Category "${title}" added successfully.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `added new art category "${title}"`);
    }
    
    saveDB(db);
    closeAdminModal('category');
    renderCategoriesTab();
});

function editCategory(id) {
    openCategoryModal(id);
}

function confirmDeleteCategory(id) {
    if (!enforcePermission('categories')) return;
    
    const c = db.categories.find(cat => cat.id === id);
    openConfirmationModal(`Delete Category "${c.title}"`, `Are you sure you want to delete this category? All associated events and gallery images might lose their categories. This cannot be undone.`, () => {
        db.categories = db.categories.filter(cat => cat.id !== id);
        saveDB(db);
        renderCategoriesTab();
        showToast(`Category "${c.title}" removed.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `deleted category "${c.title}"`);
    });
}

// ==========================================================================
// 5. EVENTS CRUD
// ==========================================================================

function renderEventsTab() {
    // Populate Category selectors
    const filterCat = document.getElementById('event-filter-category');
    const modalCat = document.getElementById('event-field-category');
    
    // Save current selection values
    const selectedFilter = filterCat.value || 'all';
    
    filterCat.innerHTML = '<option value="all">All Categories</option>';
    modalCat.innerHTML = '';
    
    db.categories.forEach(c => {
        filterCat.innerHTML += `<option value="${c.id}">${c.title}</option>`;
        modalCat.innerHTML += `<option value="${c.id}">${c.title}</option>`;
    });
    
    // Restore selection
    filterCat.value = selectedFilter;
    
    const tbody = document.getElementById('events-tbody');
    tbody.innerHTML = '';
    
    const searchVal = document.getElementById('event-search-input').value.toLowerCase();
    const catVal = document.getElementById('event-filter-category').value;
    const statusVal = document.getElementById('event-filter-status').value;
    
    db.events.forEach(ev => {
        const matchesSearch = ev.title.toLowerCase().includes(searchVal) || ev.venue.toLowerCase().includes(searchVal);
        const matchesCat = catVal === 'all' || ev.category === catVal;
        const matchesStatus = statusVal === 'all' || ev.status === statusVal;
        
        if (matchesSearch && matchesCat && matchesStatus) {
            let statusColor = 'badge-pending';
            if (ev.status === 'published') statusColor = 'badge-approved';
            if (ev.status === 'archived') statusColor = 'badge-rejected';
            
            const categoryName = getCategoryName(ev.category);
            const hourMinStr = formatTimeString(ev.time);
            
            tbody.innerHTML += `
                <tr>
                    <td><img src="${ev.banner}" alt="Banner" class="table-img"></td>
                    <td><strong>${ev.title}</strong>${ev.featured ? ' <i class="fas fa-star text-gold" title="Featured"></i>' : ''}</td>
                    <td><span class="text-gold" style="font-size:0.82rem; font-weight:600;"><i class="${getCategoryIcon(ev.category)}"></i> ${categoryName}</span></td>
                    <td><code>${ev.date} | ${hourMinStr}</code></td>
                    <td><span style="font-size:0.85rem;"><i class="fas fa-map-marker-alt text-muted"></i> ${ev.venue}</span></td>
                    <td><span style="font-size:0.82rem;"><i class="fas fa-users text-muted"></i> ${db.rsvpRegistrations.filter(r => r.eventId === ev.id).length}/${ev.maxParticipants}</span></td>
                    <td>
                        <label class="toggle-container">
                            <input type="checkbox" ${ev.featured ? 'checked' : ''} onchange="toggleEventFeatured('${ev.id}')">
                            <span class="toggle-slider"></span>
                        </label>
                    </td>
                    <td><span class="member-badge ${statusColor}">${ev.status.toUpperCase()}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn-sm" onclick="editEvent('${ev.id}')" title="Edit"><i class="far fa-edit"></i></button>
                        <button class="action-btn-sm" onclick="duplicateEvent('${ev.id}')" title="Duplicate"><i class="far fa-copy"></i></button>
                        <button class="action-btn-sm action-btn-danger" onclick="confirmDeleteEvent('${ev.id}')" title="Delete"><i class="far fa-trash-can"></i></button>
                    </td>
                </tr>
            `;
        }
    });
}

function openEventModal(eventId = null) {
    if (!enforcePermission('events')) return;
    
    const modal = document.getElementById('modal-event');
    const form = document.getElementById('event-modal-form');
    form.reset();
    
    if (eventId) {
        document.getElementById('event-modal-title').textContent = "Edit Event Details";
        const ev = db.events.find(e => e.id === eventId);
        document.getElementById('event-field-id').value = ev.id;
        document.getElementById('event-field-title').value = ev.title;
        document.getElementById('event-field-category').value = ev.category;
        document.getElementById('event-field-desc').value = ev.description;
        document.getElementById('event-field-banner').value = ev.banner;
        document.getElementById('event-field-venue').value = ev.venue;
        document.getElementById('event-field-date').value = ev.date;
        document.getElementById('event-field-time').value = ev.time;
        document.getElementById('event-field-organizer').value = ev.organizer || '';
        document.getElementById('event-field-artists').value = ev.guestArtists || '';
        document.getElementById('event-field-max').value = ev.maxParticipants || 500;
        document.getElementById('event-field-link').value = ev.registrationLink || '#';
        document.getElementById('event-field-status').value = ev.status;
        document.getElementById('event-field-featured').checked = ev.featured;
        document.getElementById('event-field-timer').checked = ev.countdownTimer;
    } else {
        document.getElementById('event-modal-title').textContent = "Create Performance Event";
        document.getElementById('event-field-id').value = '';
    }
    
    openAdminModal('event');
}

document.getElementById('event-modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!enforcePermission('events')) return;
    
    const id = document.getElementById('event-field-id').value;
    const title = document.getElementById('event-field-title').value;
    const category = document.getElementById('event-field-category').value;
    const desc = document.getElementById('event-field-desc').value;
    const banner = document.getElementById('event-field-banner').value || 'ASSETS/images/Singers.svg';
    const venue = document.getElementById('event-field-venue').value;
    const date = document.getElementById('event-field-date').value;
    const time = document.getElementById('event-field-time').value;
    const organizer = document.getElementById('event-field-organizer').value;
    const guestArtists = document.getElementById('event-field-artists').value;
    const max = parseInt(document.getElementById('event-field-max').value);
    const link = document.getElementById('event-field-link').value;
    const status = document.getElementById('event-field-status').value;
    const featured = document.getElementById('event-field-featured').checked;
    const timer = document.getElementById('event-field-timer').checked;
    
    if (id) {
        // Edit
        const ev = db.events.find(e => e.id === id);
        ev.title = title;
        ev.category = category;
        ev.description = desc;
        ev.banner = banner;
        ev.venue = venue;
        ev.date = date;
        ev.time = time;
        ev.organizer = organizer;
        ev.guestArtists = guestArtists;
        ev.maxParticipants = max;
        ev.registrationLink = link;
        ev.status = status;
        ev.featured = featured;
        ev.countdownTimer = timer;
        
        showToast(`Event "${title}" updated.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `edited event "${title}"`);
    } else {
        // Create
        const newId = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        db.events.push({
            id: newId,
            title,
            category,
            description: desc,
            banner,
            venue,
            date,
            time,
            organizer,
            guestArtists,
            maxParticipants: max,
            registrationLink: link,
            status,
            featured,
            countdownTimer: timer,
            galleryImages: []
        });
        showToast(`Event "${title}" created successfully.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `created new event "${title}"`);
    }
    
    saveDB(db);
    closeAdminModal('event');
    renderEventsTab();
});

function editEvent(id) {
    openEventModal(id);
}

function toggleEventFeatured(id) {
    if (!enforcePermission('events')) return;
    
    const ev = db.events.find(e => e.id === id);
    ev.featured = !ev.featured;
    saveDB(db);
    renderEventsTab();
    showToast(`Featured state toggled for "${ev.title}".`, 'toast-info');
}

function duplicateEvent(id) {
    if (!enforcePermission('events')) return;
    
    const source = db.events.find(e => e.id === id);
    const newId = source.id + "-copy-" + Math.floor(Math.random() * 1000);
    const duplicate = Object.assign({}, source, {
        id: newId,
        title: source.title + " (Copy)",
        featured: false,
        status: 'draft'
    });
    
    db.events.push(duplicate);
    saveDB(db);
    renderEventsTab();
    showToast(`Duplicated "${source.title}" as draft.`, 'toast-success');
    logActivity(activeUser.name, activeUser.role, `duplicated event "${source.title}"`);
}

function confirmDeleteEvent(id) {
    if (!enforcePermission('events')) return;
    
    const ev = db.events.find(e => e.id === id);
    openConfirmationModal(`Delete Event "${ev.title}"`, `Are you sure you want to permanently delete this event? This will remove all registries. This cannot be undone.`, () => {
        db.events = db.events.filter(e => e.id !== id);
        saveDB(db);
        renderEventsTab();
        showToast(`Event "${ev.title}" deleted.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `deleted event "${ev.title}"`);
    });
}

// Search and Filter Events Listeners
document.getElementById('event-search-input').addEventListener('input', renderEventsTab);
document.getElementById('event-filter-category').addEventListener('change', renderEventsTab);
document.getElementById('event-filter-status').addEventListener('change', renderEventsTab);

// ==========================================================================
// 6. GALLERY CURATOR CRUD & ASPECT COMPRESSION
// ==========================================================================

let galleryCuratorFilter = 'all';

function renderGalleryTab() {
    const grid = document.getElementById('curator-gallery-grid');
    grid.innerHTML = '';
    
    const searchVal = document.getElementById('gallery-search-input').value.toLowerCase();
    
    // Filters array
    let filtered = db.gallery.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchVal) || (item.desc && item.desc.toLowerCase().includes(searchVal));
        
        let matchesFilter = true;
        if (galleryCuratorFilter === 'featured') {
            matchesFilter = item.featured === true;
        } else if (galleryCuratorFilter !== 'all') {
            matchesFilter = item.category === galleryCuratorFilter;
        }
        
        return matchesSearch && matchesFilter;
    });
    
    // Pagination slicing
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / galleryItemsPerPage);
    galleryCurrentPage = Math.min(galleryCurrentPage, Math.max(1, totalPages));
    
    const startIndex = (galleryCurrentPage - 1) * galleryItemsPerPage;
    const sliced = filtered.slice(startIndex, startIndex + galleryItemsPerPage);
    
    sliced.forEach(item => {
        const isVideo = item.src.endsWith('.mp4') || item.src.startsWith('data:video');
        const mediaHtml = isVideo 
            ? `<video src="${item.src}" muted></video>` 
            : `<img src="${item.src}" alt="${item.title}">`;
            
        grid.innerHTML += `
            <div class="gallery-card-admin">
                ${mediaHtml}
                ${item.featured ? `<div class="gallery-star-indicator" title="Curated Showcase"><i class="fas fa-star"></i></div>` : ''}
                <div class="gallery-card-admin-overlay">
                    <div class="gallery-card-cat">${item.category}</div>
                    <div class="gallery-card-title">${item.title}</div>
                    <div class="gallery-card-actions">
                        <div>
                            <button class="action-btn-sm" onclick="editGalleryItem(${item.id})" title="Edit Properties"><i class="far fa-edit"></i></button>
                        </div>
                        <div>
                            <button class="action-btn-sm action-btn-danger" onclick="confirmDeleteGalleryItem(${item.id})" title="Delete Media"><i class="far fa-trash-can"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Render pagination buttons
    const pagination = document.getElementById('gallery-pagination');
    pagination.innerHTML = '';
    
    if (totalPages > 1) {
        for (let page = 1; page <= totalPages; page++) {
            pagination.innerHTML += `
                <button class="page-btn ${page === galleryCurrentPage ? 'active' : ''}" onclick="changeGalleryPage(${page})">
                    ${page}
                </button>
            `;
        }
    }
}

function changeGalleryPage(page) {
    galleryCurrentPage = page;
    renderGalleryTab();
}

// Drag & Drop event bindings
const dropzone = document.getElementById('gallery-dropzone');

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (!enforcePermission('gallery')) return;
    
    const files = e.dataTransfer.files;
    handleImageUploadBatch(files);
});

document.getElementById('gallery-file-input').addEventListener('change', (e) => {
    if (!enforcePermission('gallery')) return;
    handleImageUploadBatch(e.target.files);
});

function handleImageUploadBatch(files) {
    let loaded = 0;
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            compressImage(file, (base64) => {
                const nextId = db.gallery.length > 0 ? Math.max(...db.gallery.map(i => i.id)) + 1 : 1;
                db.gallery.unshift({
                    id: nextId,
                    category: 'music', // Default
                    title: file.name.split('.')[0].replace(/[-_]/g, ' '),
                    src: base64,
                    size: '',
                    desc: 'Curated photo uploaded from administration panel.',
                    featured: false
                });
                
                loaded++;
                if (loaded === files.length || loaded === 3) { // Limit Base64 insertions to prevent localstorage crash
                    saveDB(db);
                    renderGalleryTab();
                    showToast(`Successfully uploaded & compressed ${loaded} images.`, 'toast-success');
                    logActivity(activeUser.name, activeUser.role, `uploaded ${loaded} new images to gallery`);
                }
            });
        } else if (file.type.startsWith('video/')) {
            // Video stored as direct Mock file or URL due to Base64 size limits
            // We mock a local asset reference to prevent storage quota crash
            const nextId = db.gallery.length > 0 ? Math.max(...db.gallery.map(i => i.id)) + 1 : 1;
            db.gallery.unshift({
                id: nextId,
                category: 'music',
                title: file.name.split('.')[0].replace(/[-_]/g, ' '),
                src: 'ASSETS/videos/HeroVideo.webm', // Mock fallback
                size: 'size-wide',
                desc: 'Simulated video placeholder uploaded from panel.',
                featured: false
            });
            loaded++;
            saveDB(db);
            renderGalleryTab();
            showToast('Simulated Video file reference successfully created.', 'toast-success');
        }
    });
}

function editGalleryItem(id) {
    if (!enforcePermission('gallery')) return;
    
    const item = db.gallery.find(g => g.id === id);
    document.getElementById('gallery-modal-title').textContent = "Edit Gallery Details";
    document.getElementById('gallery-field-id').value = item.id;
    document.getElementById('gallery-preview-img').src = item.src;
    document.getElementById('gallery-field-title').value = item.title;
    document.getElementById('gallery-field-category').value = item.category;
    document.getElementById('gallery-field-desc').value = item.desc || '';
    document.getElementById('gallery-field-size').value = item.size || '';
    document.getElementById('gallery-field-featured').checked = item.featured === true;
    
    openAdminModal('gallery');
}

document.getElementById('gallery-modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!enforcePermission('gallery')) return;
    
    const id = parseInt(document.getElementById('gallery-field-id').value);
    const title = document.getElementById('gallery-field-title').value;
    const category = document.getElementById('gallery-field-category').value;
    const desc = document.getElementById('gallery-field-desc').value;
    const size = document.getElementById('gallery-field-size').value;
    const featured = document.getElementById('gallery-field-featured').checked;
    
    const item = db.gallery.find(g => g.id === id);
    item.title = title;
    item.category = category;
    item.desc = desc;
    item.size = size;
    item.featured = featured;
    
    saveDB(db);
    closeAdminModal('gallery');
    renderGalleryTab();
    showToast('Gallery image details saved successfully.', 'toast-success');
    logActivity(activeUser.name, activeUser.role, `updated gallery item #${id} details`);
});

function confirmDeleteGalleryItem(id) {
    if (!enforcePermission('gallery')) return;
    
    openConfirmationModal("Delete Gallery Media", "Are you sure you want to permanently delete this media file from the gallery?", () => {
        db.gallery = db.gallery.filter(g => g.id !== id);
        saveDB(db);
        renderGalleryTab();
        showToast('Media deleted successfully.', 'toast-success');
        logActivity(activeUser.name, activeUser.role, `deleted gallery item #${id}`);
    });
}

// Search and category curator actions
document.getElementById('gallery-search-input').addEventListener('input', renderGalleryTab);

const filterTabBtns = document.querySelectorAll('.filter-tab-btn');
filterTabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterTabBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        galleryCuratorFilter = e.target.getAttribute('data-filter');
        galleryCurrentPage = 1;
        renderGalleryTab();
    });
});

// Image Compressor canvas helper
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Constrain sizes
            const maxDimension = 400;
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress JPEG quality
            const base64 = canvas.toDataURL('image/jpeg', 0.6);
            callback(base64);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// ==========================================================================
// 7. TEAM DIRECTORY CRUD & ORDERING
// ==========================================================================

function renderTeamTab() {
    const tbody = document.getElementById('team-tbody');
    tbody.innerHTML = '';
    
    db.team.sort((a, b) => a.displayOrder - b.displayOrder).forEach((m, index) => {
        tbody.innerHTML += `
            <tr>
                <td>
                    <div class="actions-cell">
                        <button class="action-btn-sm" onclick="moveTeamOrder(${m.id}, -1)" ${index === 0 ? 'disabled' : ''}><i class="fas fa-chevron-up"></i></button>
                        <button class="action-btn-sm" onclick="moveTeamOrder(${m.id}, 1)" ${index === db.team.length - 1 ? 'disabled' : ''}><i class="fas fa-chevron-down"></i></button>
                    </div>
                </td>
                <td><img src="${m.image}" alt="Photo" class="table-avatar"></td>
                <td><strong>${m.name}</strong></td>
                <td><span class="badge-approved member-badge">${m.role}</span></td>
                <td><span style="font-size:0.82rem;">${m.email}<br>${m.phone || 'N/A'}</span></td>
                <td>
                    <div style="display:flex; gap:6px; font-size:0.8rem; color:var(--text-muted);">
                        <i class="fab fa-linkedin" title="${m.linkedin}"></i>
                        <i class="fab fa-instagram" title="${m.instagram}"></i>
                        <i class="fab fa-twitter" title="${m.twitter}"></i>
                    </div>
                </td>
                <td>
                    <span class="member-badge ${m.active ? 'badge-approved' : 'badge-rejected'}">
                        ${m.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="action-btn-sm" onclick="editTeamMember(${m.id})" title="Edit"><i class="far fa-edit"></i></button>
                    <button class="action-btn-sm action-btn-danger" onclick="confirmDeleteTeamMember(${m.id})" title="Delete"><i class="far fa-trash-can"></i></button>
                </td>
            </tr>
        `;
    });
}

function openTeamModal(memberId = null) {
    if (!enforcePermission('team')) return;
    
    const modal = document.getElementById('modal-team');
    const form = document.getElementById('team-modal-form');
    form.reset();
    
    if (memberId) {
        document.getElementById('team-modal-title').textContent = "Edit Committee Profile";
        const m = db.team.find(t => t.id === memberId);
        document.getElementById('team-field-id').value = m.id;
        document.getElementById('team-field-name').value = m.name;
        document.getElementById('team-field-role').value = m.role;
        document.getElementById('team-field-photo').value = m.image;
        document.getElementById('team-field-bio').value = m.bio;
        document.getElementById('team-field-email').value = m.email;
        document.getElementById('team-field-phone').value = m.phone || '';
        document.getElementById('team-field-linkedin').value = m.linkedin || '#';
        document.getElementById('team-field-instagram').value = m.instagram || '#';
        document.getElementById('team-field-twitter').value = m.twitter || '#';
        document.getElementById('team-field-order').value = m.displayOrder;
        document.getElementById('team-field-active').checked = m.active;
    } else {
        document.getElementById('team-modal-title').textContent = "Add Team Member";
        document.getElementById('team-field-id').value = '';
    }
    
    openAdminModal('team');
}

document.getElementById('team-modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!enforcePermission('team')) return;
    
    const id = document.getElementById('team-field-id').value;
    const name = document.getElementById('team-field-name').value;
    const role = document.getElementById('team-field-role').value;
    const photo = document.getElementById('team-field-photo').value || 'ASSETS/images/p.jpeg';
    const bio = document.getElementById('team-field-bio').value;
    const email = document.getElementById('team-field-email').value;
    const phone = document.getElementById('team-field-phone').value;
    const linkedin = document.getElementById('team-field-linkedin').value;
    const instagram = document.getElementById('team-field-instagram').value;
    const twitter = document.getElementById('team-field-twitter').value;
    const order = parseInt(document.getElementById('team-field-order').value);
    const active = document.getElementById('team-field-active').checked;
    
    if (id) {
        // Edit
        const m = db.team.find(t => t.id === parseInt(id));
        m.name = name;
        m.role = role;
        m.image = photo;
        m.bio = bio;
        m.email = email;
        m.phone = phone;
        m.linkedin = linkedin;
        m.instagram = instagram;
        m.twitter = twitter;
        m.displayOrder = order;
        m.active = active;
        
        showToast(`Profile of "${name}" updated.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `edited committee profile for "${name}"`);
    } else {
        // Create
        const nextId = db.team.length > 0 ? Math.max(...db.team.map(t => t.id)) + 1 : 1;
        db.team.push({
            id: nextId,
            name,
            role,
            image: photo,
            bio,
            email,
            phone,
            linkedin,
            instagram,
            twitter,
            displayOrder: order,
            active
        });
        showToast(`Member profile "${name}" created.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `added new committee profile for "${name}"`);
    }
    
    saveDB(db);
    closeAdminModal('team');
    renderTeamTab();
});

// Member photo uploader listener
document.getElementById('team-photo-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        compressImage(file, (base64) => {
            document.getElementById('team-field-photo').value = base64;
        });
    }
});

function editTeamMember(id) {
    openTeamModal(id);
}

function moveTeamOrder(id, direction) {
    if (!enforcePermission('team')) return;
    
    const m = db.team.find(t => t.id === id);
    const currentIdx = db.team.indexOf(m);
    
    // Sort array first by displayOrder
    db.team.sort((a, b) => a.displayOrder - b.displayOrder);
    
    const sortedIdx = db.team.indexOf(m);
    const swapIdx = sortedIdx + direction;
    
    if (swapIdx >= 0 && swapIdx < db.team.length) {
        const swapMember = db.team[swapIdx];
        
        // Swap displayOrders
        const temp = m.displayOrder;
        m.displayOrder = swapMember.displayOrder;
        swapMember.displayOrder = temp;
        
        saveDB(db);
        renderTeamTab();
    }
}

function confirmDeleteTeamMember(id) {
    if (!enforcePermission('team')) return;
    
    const m = db.team.find(t => t.id === id);
    openConfirmationModal("Delete Committee Profile", `Are you sure you want to permanently delete the profile of "${m.name}"? This cannot be undone.`, () => {
        db.team = db.team.filter(t => t.id !== id);
        saveDB(db);
        renderTeamTab();
        showToast('Profile deleted successfully.', 'toast-success');
        logActivity(activeUser.name, activeUser.role, `deleted committee profile for "${m.name}"`);
    });
}

// ==========================================================================
// 8. ANNOUNCEMENTS CRUD
// ==========================================================================

function renderAnnouncementsTab() {
    const tbody = document.getElementById('announcements-tbody');
    tbody.innerHTML = '';
    
    db.announcements.forEach(a => {
        let statusColor = 'badge-pending';
        if (a.status === 'published') statusColor = 'badge-approved';
        
        tbody.innerHTML += `
            <tr>
                <td><img src="${a.image || 'ASSETS/images/Singers.svg'}" alt="Image" class="table-img"></td>
                <td><strong>${a.title}</strong></td>
                <td><code>${a.publishDate}</code></td>
                <td><code>${a.expiryDate}</code></td>
                <td>
                    <label class="toggle-container">
                        <input type="checkbox" ${a.pinned ? 'checked' : ''} onchange="toggleAnnouncementPinned(${a.id})">
                        <span class="toggle-slider"></span>
                    </label>
                </td>
                <td><span class="member-badge ${statusColor}">${a.status.toUpperCase()}</span></td>
                <td class="actions-cell">
                    <button class="action-btn-sm" onclick="editAnnouncement(${a.id})" title="Edit"><i class="far fa-edit"></i></button>
                    <button class="action-btn-sm action-btn-danger" onclick="confirmDeleteAnnouncement(${a.id})" title="Delete"><i class="far fa-trash-can"></i></button>
                </td>
            </tr>
        `;
    });
}

function openAnnouncementModal(annId = null) {
    if (!enforcePermission('announcements')) return;
    
    const modal = document.getElementById('modal-announcement');
    const form = document.getElementById('announcement-modal-form');
    form.reset();
    
    if (annId) {
        document.getElementById('announcement-modal-title').textContent = "Edit Notice";
        const a = db.announcements.find(ann => ann.id === annId);
        document.getElementById('ann-field-id').value = a.id;
        document.getElementById('ann-field-title').value = a.title;
        document.getElementById('ann-field-content').value = a.content;
        document.getElementById('ann-field-image').value = a.image || '';
        document.getElementById('ann-field-publish').value = a.publishDate;
        document.getElementById('ann-field-expiry').value = a.expiryDate;
        document.getElementById('ann-field-pinned').checked = a.pinned;
        document.getElementById('ann-field-scheduled').checked = a.scheduled || false;
        document.getElementById('ann-field-status').value = a.status;
    } else {
        document.getElementById('announcement-modal-title').textContent = "Create Notice";
        document.getElementById('ann-field-id').value = '';
    }
    
    openAdminModal('announcement');
}

document.getElementById('announcement-modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!enforcePermission('announcements')) return;
    
    const id = document.getElementById('ann-field-id').value;
    const title = document.getElementById('ann-field-title').value;
    const content = document.getElementById('ann-field-content').value;
    const image = document.getElementById('ann-field-image').value || 'ASSETS/images/Singers.svg';
    const publish = document.getElementById('ann-field-publish').value;
    const expiry = document.getElementById('ann-field-expiry').value;
    const pinned = document.getElementById('ann-field-pinned').checked;
    const scheduled = document.getElementById('ann-field-scheduled').checked;
    const status = document.getElementById('ann-field-status').value;
    
    if (id) {
        // Edit
        const a = db.announcements.find(ann => ann.id === parseInt(id));
        a.title = title;
        a.content = content;
        a.image = image;
        a.publishDate = publish;
        a.expiryDate = expiry;
        a.pinned = pinned;
        a.scheduled = scheduled;
        a.status = status;
        
        showToast(`Notice "${title}" updated.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `edited announcement notice "${title}"`);
    } else {
        // Create
        const nextId = db.announcements.length > 0 ? Math.max(...db.announcements.map(ann => ann.id)) + 1 : 1;
        db.announcements.push({
            id: nextId,
            title,
            content,
            image,
            publishDate: publish,
            expiryDate: expiry,
            pinned,
            scheduled,
            status
        });
        showToast(`Notice "${title}" published.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `published new announcement "${title}"`);
    }
    
    saveDB(db);
    closeAdminModal('announcement');
    renderAnnouncementsTab();
});

function editAnnouncement(id) {
    openAnnouncementModal(id);
}

function toggleAnnouncementPinned(id) {
    if (!enforcePermission('announcements')) return;
    
    const a = db.announcements.find(ann => ann.id === id);
    a.pinned = !a.pinned;
    saveDB(db);
    renderAnnouncementsTab();
    showToast(`Notice pinned state toggled for "${a.title}".`, 'toast-info');
}

function confirmDeleteAnnouncement(id) {
    if (!enforcePermission('announcements')) return;
    
    const a = db.announcements.find(ann => ann.id === id);
    openConfirmationModal("Delete Announcement", `Are you sure you want to permanently delete this notice board announcement?`, () => {
        db.announcements = db.announcements.filter(ann => ann.id !== id);
        saveDB(db);
        renderAnnouncementsTab();
        showToast('Notice deleted successfully.', 'toast-success');
        logActivity(activeUser.name, activeUser.role, `deleted announcement notice "${a.title}"`);
    });
}

// ==========================================================================
// 9. MEMBERSHIP MANAGEMENT & SUBMISSIONS EXPORTS
// ==========================================================================

function renderMembershipsTab() {
    const tbody = document.getElementById('memberships-tbody');
    tbody.innerHTML = '';
    
    const searchVal = document.getElementById('member-search-input').value.toLowerCase();
    const catVal = document.getElementById('member-filter-category').value;
    const statusVal = document.getElementById('member-filter-status').value;
    
    let approvedCount = 0;
    let pendingCount = 0;
    
    db.memberships.forEach(m => {
        if (m.status === 'approved') approvedCount++;
        if (m.status === 'pending') pendingCount++;
        
        const matchesSearch = m.name.toLowerCase().includes(searchVal) || m.email.toLowerCase().includes(searchVal) || (m.bio && m.bio.toLowerCase().includes(searchVal));
        const matchesCat = catVal === 'all' || m.artCategory === catVal;
        const matchesStatus = statusVal === 'all' || m.status === statusVal;
        
        if (matchesSearch && matchesCat && matchesStatus) {
            let statusColor = 'badge-pending';
            if (m.status === 'approved') statusColor = 'badge-approved';
            if (m.status === 'rejected') statusColor = 'badge-rejected';
            
            const submitDate = m.submittedAt ? m.submittedAt.split('T')[0] : '2026-07-01';
            
            tbody.innerHTML += `
                <tr>
                    <td><code>${submitDate}</code></td>
                    <td><strong>${m.name}</strong></td>
                    <td>${m.email}<br><span class="text-muted" style="font-size:0.75rem;">${m.phone || ''}</span></td>
                    <td><span class="text-gold" style="text-transform:uppercase; font-size:0.8rem; font-weight:600;"><i class="${getCategoryIcon(m.artCategory)}"></i> ${m.artCategory}</span></td>
                    <td><code>${m.year || '2026'}</code></td>
                    <td><span class="member-badge ${statusColor}">${m.status.toUpperCase()}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn-sm" onclick="viewMembershipDetail(${m.id})" title="Review application"><i class="far fa-eye"></i> Review</button>
                    </td>
                </tr>
            `;
        }
    });
    
    document.getElementById('membership-stat-approved').textContent = approvedCount + 500; // Add preloaded
    document.getElementById('membership-stat-pending').textContent = pendingCount;
    document.getElementById('membership-stat-total').textContent = db.memberships.length + 500;
}

function viewMembershipDetail(id) {
    if (!enforcePermission('memberships')) return;
    
    const m = db.memberships.find(mbr => mbr.id === id);
    const body = document.getElementById('membership-detail-body');
    const actions = document.getElementById('membership-detail-actions');
    
    body.innerHTML = `
        <div class="detail-grid">
            <span class="detail-label">Full Name</span><span class="detail-val">${m.name}</span>
            <span class="detail-label">Email Address</span><span class="detail-val">${m.email}</span>
            <span class="detail-label">Phone Number</span><span class="detail-val">${m.phone || 'N/A'}</span>
            <span class="detail-label">Art Category</span><span class="detail-val" style="text-transform:uppercase; font-weight:600; color:var(--gold);">${m.artCategory}</span>
            <span class="detail-label">Applied Year</span><span class="detail-val">${m.year || '2026'}</span>
            <span class="detail-label">Experience</span><span class="detail-val">${m.experience || 'None'}</span>
            <span class="detail-label">Status</span><span class="detail-val"><span class="member-badge ${m.status === 'approved' ? 'badge-approved' : m.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${m.status.toUpperCase()}</span></span>
        </div>
        <div class="detail-bio-box">
            <strong>Statement of Intent:</strong><br>
            "${m.bio || 'No statement provided.'}"
        </div>
    `;
    
    actions.innerHTML = `
        <button class="btn-secondary" onclick="closeAdminModal('view-membership')">Close</button>
        ${m.status === 'pending' ? `
            <button class="btn-secondary btn-danger" onclick="updateMembershipStatus(${m.id}, 'rejected')"><i class="fas fa-xmark"></i> Reject</button>
            <button class="btn-primary" onclick="updateMembershipStatus(${m.id}, 'approved')"><i class="fas fa-check"></i> Approve & Notify</button>
        ` : ''}
    `;
    
    openAdminModal('view-membership');
}

function updateMembershipStatus(id, newStatus) {
    const m = db.memberships.find(mbr => mbr.id === id);
    m.status = newStatus;
    saveDB(db);
    closeAdminModal('view-membership');
    renderMembershipsTab();
    updateBadges();
    
    const msg = newStatus === 'approved' ? 'approved' : 'rejected';
    showToast(`Membership application for ${m.name} has been ${msg}.`, 'toast-success');
    logActivity(activeUser.name, activeUser.role, `${msg} membership application for "${m.name}"`);
    
    // Simulate sending email
    setTimeout(() => {
        alert(`Simulated Email Sent:\nTo: ${m.email}\nSubject: SCU ArtCircle Membership Status\n\nDear ${m.name},\nWe are pleased to inform you that your membership application has been ${newStatus}. Welcome to the Circle!`);
    }, 800);
}

// Excel Export function (CSV format)
document.getElementById('btn-export-members-csv').addEventListener('click', () => {
    if (!enforcePermission('memberships')) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Email,Phone,Category,Year,Status\n";
    
    db.memberships.forEach(m => {
        csvContent += `"${m.name}","${m.email}","${m.phone || ''}","${m.artCategory}","${m.year || '2026'}","${m.status}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "SCU_ArtCircle_Memberships_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV Membership spreadsheet downloaded.', 'toast-success');
});

// PDF Export function (Styled Print Layout)
document.getElementById('btn-export-members-pdf').addEventListener('click', () => {
    if (!enforcePermission('memberships')) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>SCU ArtCircle Members Registry</title>
            <style>
                body { font-family: 'Poppins', sans-serif; padding: 40px; color: #111; }
                h1 { text-align: center; font-family: 'Outfit', sans-serif; margin-bottom: 5px; }
                h3 { text-align: center; color: #888; font-weight: 400; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #f5f5f5; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
                tr:nth-child(even) { background-color: #fafafa; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
                .approved { background-color: #d4edda; color: #155724; }
                .pending { background-color: #fff3cd; color: #856404; }
                .rejected { background-color: #f8d7da; color: #721c24; }
            </style>
        </head>
        <body>
            <h1>SCU ArtCircle</h1>
            <h3>Official Membership Registry — July 2026</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Category</th>
                        <th>Year</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${db.memberships.map(m => `
                        <tr>
                            <td><strong>${m.name}</strong></td>
                            <td>${m.email}</td>
                            <td>${m.phone || 'N/A'}</td>
                            <td style="text-transform: capitalize;">${m.artCategory}</td>
                            <td>${m.year || '2026'}</td>
                            <td><span class="badge ${m.status}">${m.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
    showToast('Registry report printed successfully.', 'toast-success');
});

// Search and Filter memberships listeners
document.getElementById('member-search-input').addEventListener('input', renderMembershipsTab);
document.getElementById('member-filter-category').addEventListener('change', renderMembershipsTab);
document.getElementById('member-filter-status').addEventListener('change', renderMembershipsTab);

// ==========================================================================
// 10. CONTACT US MESSAGES INBOX
// ==========================================================================

function renderContactTab() {
    const list = document.getElementById('contact-messages-list');
    list.innerHTML = '';
    
    const searchVal = document.getElementById('contact-search-input').value.toLowerCase();
    
    db.contactMessages.forEach(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchVal) || c.message.toLowerCase().includes(searchVal);
        if (matchesSearch) {
            let classStr = 'message-list-item';
            if (activeContactId === c.id) classStr += ' active';
            if (!c.read) classStr += ' unread';
            
            const submitDate = c.submittedAt ? c.submittedAt.split('T')[0] : '2026-07-02';
            
            list.innerHTML += `
                <li class="${classStr}" onclick="selectContactMessage(${c.id})">
                    <div class="message-list-item-header">
                        <span class="msg-sender">${c.name}</span>
                        <span class="msg-time">${submitDate}</span>
                    </div>
                    <div class="msg-subject">Contact Form Query</div>
                    <div class="msg-body-preview">${c.message}</div>
                </li>
            `;
        }
    });
}

function selectContactMessage(id) {
    if (!enforcePermission('contact')) return;
    
    activeContactId = id;
    const msg = db.contactMessages.find(c => c.id === id);
    
    // Mark as read
    if (!msg.read) {
        msg.read = true;
        saveDB(db);
        updateBadges();
    }
    
    renderContactTab();
    
    const view = document.getElementById('contact-message-viewer');
    const submitDate = msg.submittedAt ? msg.submittedAt.split('T')[0] : '2026-07-02';
    
    view.innerHTML = `
        <div class="msg-view-header">
            <div class="msg-view-title-row">
                <h3 class="msg-view-subject">Inquiry from SCU ArtCircle Contact Form</h3>
                <div class="actions-cell">
                    <button class="action-btn-sm action-btn-danger" onclick="deleteContactMessage(${msg.id})" title="Delete"><i class="far fa-trash-can"></i></button>
                </div>
            </div>
            <div class="msg-view-sender-info">
                <div class="msg-view-sender-avatar">${msg.name.charAt(0).toUpperCase()}</div>
                <div class="msg-view-sender-details">
                    <span class="msg-view-sender-name">${msg.name}</span>
                    <span class="msg-view-sender-email">${msg.email}</span>
                </div>
                <span class="msg-time" style="margin-left: auto;">${submitDate}</span>
            </div>
        </div>
        <div class="msg-view-body">${msg.message}</div>
        <div class="msg-view-footer">
            <button class="btn-secondary" onclick="markUnreadContactMessage(${msg.id})"><i class="far fa-envelope"></i> Mark as Unread</button>
            <button class="btn-primary" onclick="openReplyMessageModal(${msg.id})"><i class="fas fa-reply"></i> Send Reply Email</button>
        </div>
    `;
}

function markUnreadContactMessage(id) {
    const msg = db.contactMessages.find(c => c.id === id);
    msg.read = false;
    saveDB(db);
    activeContactId = null;
    
    // Clear viewer
    document.getElementById('contact-message-viewer').innerHTML = `
        <div class="no-message-selected">
            <i class="far fa-envelope-open"></i>
            <p>Select a message from the inbox to read and reply.</p>
        </div>
    `;
    
    renderContactTab();
    updateBadges();
    showToast('Message marked as unread.', 'toast-info');
}

function openReplyMessageModal(id) {
    const msg = db.contactMessages.find(c => c.id === id);
    document.getElementById('reply-message-id').value = msg.id;
    document.getElementById('reply-to-email').value = msg.email;
    document.getElementById('reply-content').value = `Dear ${msg.name},\n\nThank you for reaching out to SCU ArtCircle. Regarding your inquiry:\n\n[Write details here]\n\nBest regards,\nSCU ArtCircle Team`;
    openAdminModal('reply-message');
}

document.getElementById('reply-message-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('reply-message-id').value);
    const to = document.getElementById('reply-to-email').value;
    const body = document.getElementById('reply-content').value;
    
    closeAdminModal('reply-message');
    showToast(`Reply email sent to ${to}.`, 'toast-success');
    logActivity(activeUser.name, activeUser.role, `replied to inbox message from ${to}`);
    
    // Simulate email dispatch
    setTimeout(() => {
        alert(`Simulated Email Dispatched:\nTo: ${to}\nSubject: Re: SCU ArtCircle Inquiry\n\n${body}`);
    }, 600);
});

function deleteContactMessage(id) {
    openConfirmationModal("Delete Contact Message", "Are you sure you want to permanently delete this message? This cannot be undone.", () => {
        db.contactMessages = db.contactMessages.filter(c => c.id !== id);
        saveDB(db);
        activeContactId = null;
        
        // Reset viewer
        document.getElementById('contact-message-viewer').innerHTML = `
            <div class="no-message-selected">
                <i class="far fa-envelope-open"></i>
                <p>Select a message from the inbox to read and reply.</p>
            </div>
        `;
        
        renderContactTab();
        updateBadges();
        showToast('Message deleted.', 'toast-success');
        logActivity(activeUser.name, activeUser.role, `deleted inbox message #${id}`);
    });
}

document.getElementById('contact-search-input').addEventListener('input', renderContactTab);

// ==========================================================================
// 11. USERS & SYSTEM SETTINGS
// ==========================================================================

function renderUsersTab() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';
    
    db.auth.users.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${u.avatar}" alt="Avatar" class="table-avatar"></td>
                <td><code>${u.username}</code></td>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="member-badge badge-approved">${u.role}</span></td>
                <td class="actions-cell">
                    ${u.username !== 'superadmin' ? `<button class="action-btn-sm action-btn-danger" onclick="confirmDeleteUser('${u.username}')" title="Remove Account"><i class="far fa-trash-can"></i></button>` : '<span class="text-muted" style="font-size:0.75rem;">System Owned</span>'}
                </td>
            </tr>
        `;
    });
}

function openUserModal() {
    if (!enforcePermission('users')) return;
    
    const form = document.getElementById('user-modal-form');
    form.reset();
    openAdminModal('user');
}

document.getElementById('user-modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!enforcePermission('users')) return;
    
    const username = document.getElementById('user-field-username').value.trim();
    const name = document.getElementById('user-field-name').value.trim();
    const email = document.getElementById('user-field-email').value.trim();
    const role = document.getElementById('user-field-role').value;
    const pass = document.getElementById('user-field-password').value;
    
    if (db.auth.users.some(u => u.username === username)) {
        showToast('Username already registered.', 'toast-error');
        return;
    }
    
    db.auth.users.push({
        username,
        password: pass,
        name,
        role,
        email,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
    });
    
    saveDB(db);
    closeAdminModal('user');
    renderUsersTab();
    showToast(`Administrator account for "${name}" created successfully.`, 'toast-success');
    logActivity(activeUser.name, activeUser.role, `created admin account for "${username}"`);
});

function confirmDeleteUser(username) {
    if (!enforcePermission('users')) return;
    
    openConfirmationModal("Remove Admin Login", `Are you sure you want to permanently delete the administrator login for "${username}"?`, () => {
        db.auth.users = db.auth.users.filter(u => u.username !== username);
        saveDB(db);
        renderUsersTab();
        showToast(`Administrator account "${username}" removed.`, 'toast-success');
        logActivity(activeUser.name, activeUser.role, `deleted admin login account "${username}"`);
    });
}

function renderSettingsTab() {
    document.getElementById('settings-site-name').value = db.settings.websiteName;
    document.getElementById('settings-logo-url').value = db.hero.logoUrl;
    document.getElementById('settings-maintenance').checked = db.settings.maintenanceMode;
}

document.getElementById('save-settings-btn').addEventListener('click', () => {
    if (!enforcePermission('settings')) return;
    
    const siteName = document.getElementById('settings-site-name').value;
    const logoUrl = document.getElementById('settings-logo-url').value;
    const maintenance = document.getElementById('settings-maintenance').checked;
    
    db.settings.websiteName = siteName;
    db.hero.logoUrl = logoUrl;
    db.settings.maintenanceMode = maintenance;
    
    saveDB(db);
    showToast('Global settings saved successfully.', 'toast-success');
    logActivity(activeUser.name, activeUser.role, "updated website configuration and settings");
});

// JSON DB Backup & Restore
document.getElementById('btn-export-backup').addEventListener('click', () => {
    if (!enforcePermission('settings')) return;
    
    const dbStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dbStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SCU_ArtCircle_DB_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Database JSON backup downloaded successfully.', 'toast-success');
    logActivity(activeUser.name, activeUser.role, "exported full database backup");
});

document.getElementById('backup-file-input').addEventListener('change', (e) => {
    if (!enforcePermission('settings')) return;
    
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                // Validate schema slightly
                if (imported.hero && imported.events && imported.gallery && imported.team) {
                    db = imported;
                    saveDB(db);
                    showToast('Database successfully restored from backup file.', 'toast-success');
                    logActivity(activeUser.name, activeUser.role, "restored database from backup file");
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showToast('Invalid database file structure.', 'toast-error');
                }
            } catch (err) {
                showToast('Failed to parse backup JSON file.', 'toast-error');
            }
        };
        reader.readAsText(file);
    }
});

document.getElementById('btn-reset-db').addEventListener('click', () => {
    if (!enforcePermission('settings')) return;
    
    openConfirmationModal("RESET DATABASE", "DANGER: This will permanently wipe all your edits, CRUD content, message histories, memberships registrations, and revert the website to factory defaults. Are you absolutely sure?", () => {
        resetDB();
        showToast('Database wiped and reset to factory defaults.', 'toast-success');
        setTimeout(() => window.location.reload(), 1000);
    });
});

// ==========================================================================
// 12. AUDIT LOGS
// ==========================================================================

function renderLogsTab() {
    const tbody = document.getElementById('logs-tbody');
    tbody.innerHTML = '';
    
    const searchVal = document.getElementById('logs-search').value.toLowerCase();
    
    db.activityLogs.forEach(log => {
        const matchesSearch = log.user.toLowerCase().includes(searchVal) || log.action.toLowerCase().includes(searchVal) || log.role.toLowerCase().includes(searchVal);
        if (matchesSearch) {
            tbody.innerHTML += `
                <tr>
                    <td><code>${log.time}</code></td>
                    <td><strong>${log.user}</strong></td>
                    <td><span class="badge-approved member-badge">${log.role}</span></td>
                    <td>${log.action}</td>
                </tr>
            `;
        }
    });
}

document.getElementById('logs-search').addEventListener('input', renderLogsTab);

document.getElementById('clear-logs-btn').addEventListener('click', () => {
    if (!enforcePermission('settings')) return;
    
    openConfirmationModal("Clear Audit Logs", "Are you sure you want to clear all the system audit logs? This cannot be undone.", () => {
        db.activityLogs = [];
        saveDB(db);
        renderLogsTab();
        showToast('Audit logs cleared.', 'toast-success');
    });
});

function logActivity(user, role, action) {
    // Add to top of logs
    db.activityLogs.unshift({
        user,
        role,
        action,
        time: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString()
    });
    saveDB(db);
}

// ==========================================================================
// 13. GLOBAL UI HANDLERS & UTIL METHODS
// ==========================================================================

function initUIHooks() {
    // Tab buttons event listeners
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(t => {
        t.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = t.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Sidebar toggle (Mobile/Hamburger)
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.querySelector('.admin-sidebar').classList.toggle('active');
    });
    
    // Profile Dropdown click toggle
    document.getElementById('profile-menu-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profile-dropdown-menu').classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
        document.getElementById('profile-dropdown-menu').classList.remove('active');
    });
    
    // Profile settings triggers
    document.getElementById('btn-profile-settings').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('profile-name-field').value = activeUser.name;
        document.getElementById('profile-email-field').value = activeUser.email;
        document.getElementById('profile-settings-img').src = activeUser.avatar || '';
        
        const users2FA = JSON.parse(localStorage.getItem('users_2fa_enabled') || '{}');
        document.getElementById('profile-2fa-enabled').checked = users2FA[activeUser.username] === true;
        
        openAdminModal('profile-settings');
    });
    
    document.getElementById('btn-change-password-modal').addEventListener('click', (e) => {
        e.preventDefault();
        openAdminModal('change-password');
    });
    
    // Dark/Light Theme Switching
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
        const body = document.body;
        if (body.classList.contains('theme-dark')) {
            body.classList.remove('theme-dark');
            body.classList.add('theme-light');
            themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            db.theme = 'light';
        } else {
            body.classList.remove('theme-light');
            body.classList.add('theme-dark');
            themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            db.theme = 'dark';
        }
        saveDB(db);
        // Re-render chart since grid colors must flip
        if (currentTab === 'dashboard') {
            renderDashboardCharts();
        }
    });
    
    // Global Keyboard Shortcut (⌘K/Ctrl+K search)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('global-search').focus();
        }
    });
    
    document.getElementById('global-search').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        if (!val) return;
        // Simple search router - switch tab and search
        if (val.includes('event')) {
            switchTab('events');
            document.getElementById('event-search-input').value = val.replace('event', '').trim();
            renderEventsTab();
        } else if (val.includes('member') || val.includes('join')) {
            switchTab('memberships');
            document.getElementById('member-search-input').value = val.replace('member', '').replace('join', '').trim();
            renderMembershipsTab();
        } else if (val.includes('gallery') || val.includes('photo')) {
            switchTab('gallery');
            document.getElementById('gallery-search-input').value = val.replace('gallery', '').replace('photo', '').trim();
            renderGalleryTab();
        }
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update active tab buttons states
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(t => {
        if (t.getAttribute('data-tab') === tabName) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });
    
    // Hide all tab panes
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(p => {
        p.classList.remove('active');
    });
    
    // Show active pane
    const activePane = document.getElementById(`tab-${tabName}`);
    if (activePane) activePane.classList.add('active');
    
    // Load Tab Data
    if (tabName === 'dashboard') renderDashboardData();
    else if (tabName === 'hero') renderHeroTab();
    else if (tabName === 'about') renderAboutTab();
    else if (tabName === 'categories') renderCategoriesTab();
    else if (tabName === 'events') renderEventsTab();
    else if (tabName === 'gallery') renderGalleryTab();
    else if (tabName === 'team') renderTeamTab();
    else if (tabName === 'announcements') renderAnnouncementsTab();
    else if (tabName === 'memberships') renderMembershipsTab();
    else if (tabName === 'contact') renderContactTab();
    else if (tabName === 'users') renderUsersTab();
    else if (tabName === 'settings') renderSettingsTab();
    else if (tabName === 'logs') renderLogsTab();
    
    // Close sidebar in mobile view
    document.querySelector('.admin-sidebar').classList.remove('active');
}

function updateBadges() {
    const unreadMessagesCount = db.contactMessages.filter(c => !c.read).length;
    document.getElementById('contact-unread-badge').textContent = unreadMessagesCount;
    document.getElementById('contact-unread-badge').style.display = unreadMessagesCount > 0 ? 'inline-block' : 'none';
    
    const pendingMembershipCount = db.memberships.filter(m => m.status === 'pending').length;
    document.getElementById('membership-pending-badge').textContent = pendingMembershipCount;
    document.getElementById('membership-pending-badge').style.display = pendingMembershipCount > 0 ? 'inline-block' : 'none';
}

// Modal show/hide helpers
function openAdminModal(id) {
    document.getElementById('admin-modal-backdrop').classList.add('active');
    document.getElementById(`modal-${id}`).style.display = 'flex';
    setTimeout(() => {
        document.getElementById(`modal-${id}`).classList.add('active');
    }, 20);
}

function closeAdminModal(id) {
    document.getElementById(`modal-${id}`).classList.remove('active');
    setTimeout(() => {
        document.getElementById(`modal-${id}`).style.display = 'none';
        document.getElementById('admin-modal-backdrop').classList.remove('active');
    }, 300);
}

// Confirmation helper
let confirmCallback = null;
function openConfirmationModal(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = callback;
    openAdminModal('confirm');
}

document.getElementById('confirm-yes-btn').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeAdminModal('confirm');
});

// Toast System
function showToast(message, type = 'toast-info') {
    const container = document.getElementById('admin-toast-container');
    if (!container) return;
    
    let iconClass = 'fa-info-circle';
    if (type === 'toast-success') iconClass = 'fa-circle-check';
    if (type === 'toast-error') iconClass = 'fa-triangle-exclamation';
    if (type === 'toast-warning') iconClass = 'fa-circle-exclamation';
    
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `<i class="fas ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 50);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Global Category Mapping helpers
function getCategoryName(id) {
    const c = db.categories.find(cat => cat.id === id);
    return c ? c.title : id.toUpperCase();
}
function getCategoryIcon(id) {
    const c = db.categories.find(cat => cat.id === id);
    return c ? c.icon : 'fas fa-tags';
}

function formatTimeString(timeStr) {
    if (!timeStr) return '';
    try {
        const parts = timeStr.split(':');
        const hour = parseInt(parts[0]);
        const min = parts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${min} ${ampm}`;
    } catch(e) {
        return timeStr;
    }
}
