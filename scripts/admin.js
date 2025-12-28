// admin.js - 完整版本（包含批量匹配、日历视图、会话监控、CSV导出）

// Use the SoulLabAPI from admin_api.js
const API = window.SoulLabAPI || {
  async getUsers() {
    return JSON.parse(localStorage.getItem('soulLabUsers')) || [];
  },
  async getMatches() {
    return JSON.parse(localStorage.getItem('soulLabMatches')) || [];
  },
  async getSessions() {
    return JSON.parse(localStorage.getItem('soulLabSessions')) || [];
  },
  async saveUsers(users) {
    localStorage.setItem('soulLabUsers', JSON.stringify(users));
  },
  async saveMatches(matches) {
    localStorage.setItem('soulLabMatches', JSON.stringify(matches));
  },
  async saveSessions(sessions) {
    localStorage.setItem('soulLabSessions', JSON.stringify(sessions));
  }
};

// 全局状态
let selectedUsers = [];
let allUsers = [];
let allMatches = [];
let allSessions = [];
let currentView = 'queue'; // queue, calendar, sessions

// 主初始化
document.addEventListener('DOMContentLoaded', async function() {
  await loadAllData();
  setupEventListeners();
  updateStats();
  logAction('Admin portal initialized');
});

// 加载所有数据
async function loadAllData() {
  try {
    [allUsers, allMatches, allSessions] = await Promise.all([
      API.getUsers(),
      API.getMatches(),
      API.getSessions()
    ]);
    
    renderCurrentView();
  } catch (error) {
    console.error('Failed to load data:', error);
    showNotification('Failed to load data', 'error');
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 视图切换按钮
  document.getElementById('queue-view-btn')?.addEventListener('click', () => switchView('queue'));
  document.getElementById('calendar-view-btn')?.addEventListener('click', () => switchView('calendar'));
  document.getElementById('sessions-view-btn')?.addEventListener('click', () => switchView('sessions'));
  
  // 刷新按钮
  document.getElementById('refresh-btn')?.addEventListener('click', loadAllData);
  
  // 批量操作按钮
  document.getElementById('batch-match-btn')?.addEventListener('click', showBatchMatchModal);
  document.getElementById('export-csv-btn')?.addEventListener('click', exportUsersCSV);
  document.getElementById('auto-match-btn')?.addEventListener('click', autoMatch);
}

// 切换视图
function switchView(view) {
  currentView = view;
  
  // 更新按钮状态
  ['queue', 'calendar', 'sessions'].forEach(v => {
    const btn = document.getElementById(`${v}-view-btn`);
    if (btn) {
      if (v === view) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
  
  renderCurrentView();
}

// 渲染当前视图
function renderCurrentView() {
  const container = document.getElementById('main-content');
  if (!container) return;
  
  switch(currentView) {
    case 'queue':
      container.innerHTML = renderQueueView();
      attachQueueEventListeners();
      break;
    case 'calendar':
      container.innerHTML = renderCalendarView();
      renderCalendar();
      break;
    case 'sessions':
      container.innerHTML = renderSessionsView();
      renderActiveSessions();
      break;
  }
  
  updateStats();
}

// ========== 队列视图 ==========
function renderQueueView() {
  return `
    <div class="queue-view">
      <div class="view-header">
        <h3>📋 Soul Matching Queue</h3>
        <div class="queue-stats">
          <span class="stat-badge">${allUsers.length} souls waiting</span>
          <span class="stat-badge">${allMatches.length} connections made</span>
        </div>
      </div>
      
      <div class="queue-controls">
        <div class="search-filter">
          <input type="text" id="user-search" placeholder="Search souls..." class="search-input">
          <select id="time-filter" class="time-select">
            <option value="">All times</option>
            <option value="mon-19">Monday 7-8 PM</option>
            <option value="tue-20">Tuesday 8-9 PM</option>
            <option value="wed-19">Wednesday 7-8 PM</option>
            <option value="thu-20">Thursday 8-9 PM</option>
            <option value="fri-19">Friday 7-8 PM</option>
            <option value="sat-15">Saturday 3-4 PM</option>
            <option value="sat-20">Saturday 8-9 PM</option>
            <option value="sun-15">Sunday 3-4 PM</option>
          </select>
        </div>
        
        <div class="selection-info" id="selection-info" style="display: none;">
          <span id="selected-count">0</span> souls selected
          <button class="btn-clear" onclick="clearSelection()">Clear</button>
        </div>
      </div>
      
      <div id="user-list" class="user-list">
        ${renderUserList(allUsers)}
      </div>
      
      <div class="queue-actions">
        <button class="btn-primary" id="manual-match-btn" onclick="createManualMatch()" disabled>
          ✨ Create Connection
        </button>
        <button class="btn-secondary" onclick="showBatchMatchModal()">
          🧬 Batch Match
        </button>
      </div>
    </div>
  `;
}

function renderUserList(users) {
  if (users.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🌌</div>
        <h4>No souls in queue</h4>
        <p>New participants will appear here</p>
      </div>
    `;
  }
  
  return users.map(user => `
    <div class="user-card ${selectedUsers.some(u => u.id === user.id) ? 'selected' : ''}" data-user-id="${user.id}">
      <div class="user-card-header">
        <div class="user-avatar">${user.email.charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <div class="user-email">${user.email}</div>
          <div class="user-meta">
            <span class="meta-item">Matches: ${user.matchCount || 0}</span>
            <span class="meta-item">Joined: ${formatDate(user.createdAt)}</span>
          </div>
        </div>
        <div class="user-times">
          ${user.times?.slice(0, 2).map(time => `<span class="time-tag">${formatTime(time)}</span>`).join('')}
          ${user.times?.length > 2 ? `<span class="more-times">+${user.times.length - 2} more</span>` : ''}
        </div>
      </div>
      
      <div class="user-card-actions">
        <label class="select-checkbox">
          <input type="checkbox" 
                 onchange="toggleSelectUser('${user.id}', this.checked)"
                 ${selectedUsers.some(u => u.id === user.id) ? 'checked' : ''}>
          <span class="checkmark"></span>
          Select for matching
        </label>
        <button class="btn-small" onclick="viewUserDetails('${user.id}')">View</button>
      </div>
    </div>
  `).join('');
}

function attachQueueEventListeners() {
  // 搜索功能
  document.getElementById('user-search')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
      user.email.toLowerCase().includes(searchTerm) ||
      (user.name && user.name.toLowerCase().includes(searchTerm))
    );
    document.getElementById('user-list').innerHTML = renderUserList(filteredUsers);
  });
  
  // 时间过滤
  document.getElementById('time-filter')?.addEventListener('change', function(e) {
    const timeSlot = e.target.value;
    if (!timeSlot) {
      document.getElementById('user-list').innerHTML = renderUserList(allUsers);
      return;
    }
    
    const filteredUsers = allUsers.filter(user => 
      user.times && user.times.includes(timeSlot)
    );
    document.getElementById('user-list').innerHTML = renderUserList(filteredUsers);
  });
}

// ========== 日历视图 ==========
function renderCalendarView() {
  return `
    <div class="calendar-view">
      <div class="view-header">
        <h3>📅 Session Calendar</h3>
        <div class="calendar-controls">
          <button class="btn-secondary" onclick="prevWeek()">← Previous Week</button>
          <span id="current-week" class="week-label">Week of ${getCurrentWeek()}</span>
          <button class="btn-secondary" onclick="nextWeek()">Next Week →</button>
        </div>
      </div>
      
      <div id="calendar-container" class="calendar-container">
        <!-- Calendar will be rendered here -->
      </div>
      
      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-dot scheduled"></span>
          <span>Scheduled</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot active"></span>
          <span>Active Now</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot completed"></span>
          <span>Completed</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot cancelled"></span>
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  `;
}

function renderCalendar() {
  const container = document.getElementById('calendar-container');
  if (!container) return;
  
  // 生成一周的日期
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  
  let html = `
    <div class="calendar-grid">
      <div class="time-header"></div>
      ${days.map(day => `<div class="day-header">${day}</div>`).join('')}
  `;
  
  // 每个时间段
  timeSlots.forEach(time => {
    html += `
      <div class="time-slot">${time}</div>
      ${days.map(day => {
        const events = getEventsForDayAndTime(day, time);
        return `
          <div class="calendar-cell" data-day="${day}" data-time="${time}">
            ${events.map(event => `
              <div class="calendar-event ${event.status}" 
                   onclick="showEventDetails('${event.id}')"
                   title="${event.title}">
                <div class="event-time">${event.time}</div>
                <div class="event-title">${event.title}</div>
              </div>
            `).join('')}
          </div>
        `;
      }).join('')}
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function getEventsForDayAndTime(day, time) {
  // 简化：从匹配数据生成事件
  return allMatches.slice(0, 3).map((match, index) => ({
    id: match.id,
    title: `Match ${index + 1}`,
    time: time,
    status: ['scheduled', 'active', 'completed'][index % 3]
  }));
}

// ========== 会话视图 ==========
function renderSessionsView() {
  const activeSessions = allSessions.filter(s => s.status === 'active');
  const recentSessions = allSessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
    .slice(0, 10);
  
  return `
    <div class="sessions-view">
      <div class="view-header">
        <h3>🔴 Active Sessions</h3>
        <div class="session-stats">
          <span class="stat-badge">${activeSessions.length} active</span>
          <span class="stat-badge">${recentSessions.length} recent</span>
        </div>
      </div>
      
      <div class="sessions-grid">
        <div class="active-sessions">
          <h4>Live Now</h4>
          <div id="active-sessions-list">
            ${renderActiveSessionsList(activeSessions)}
          </div>
        </div>
        
        <div class="session-details">
          <h4>Session Details</h4>
          <div id="session-detail-panel" class="session-detail-panel">
            <div class="empty-detail">
              <p>Select a session to view details</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="recent-sessions">
        <h4>Recently Completed</h4>
        <div class="recent-list">
          ${renderRecentSessionsList(recentSessions)}
        </div>
      </div>
    </div>
  `;
}

function renderActiveSessionsList(sessions) {
  if (sessions.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🎭</div>
        <p>No active sessions</p>
      </div>
    `;
  }
  
  return sessions.map(session => `
    <div class="session-card" onclick="showSessionDetails('${session.id}')">
      <div class="session-card-header">
        <span class="session-id">${session.id.substring(0, 8)}</span>
        <span class="session-duration">${calculateDuration(session.startedAt)}</span>
      </div>
      <div class="session-participants">
        <span class="participant">User A</span>
        <span class="connector">↔</span>
        <span class="participant">User B</span>
      </div>
      <div class="session-metrics">
        <div class="metric">
          <span class="metric-label">Depth</span>
          <span class="metric-value ${getDepthClass(session.depthScore)}">${session.depthScore || 'N/A'}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Messages</span>
          <span class="metric-value">${session.messageCount || 0}</span>
        </div>
        <div class="metric">
          <span class="metric-label">AI Help</span>
          <span class="metric-value">${session.aiInterventions || 0}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ========== 核心功能 ==========

// 选择/取消选择用户
function toggleSelectUser(userId, isSelected) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  
  if (isSelected) {
    if (selectedUsers.length >= 2) {
      showNotification('Maximum 2 souls can be selected for matching', 'warning');
      return;
    }
    if (!selectedUsers.some(u => u.id === userId)) {
      selectedUsers.push(user);
    }
  } else {
    selectedUsers = selectedUsers.filter(u => u.id !== userId);
  }
  
  updateSelectionUI();
  updateMatchButton();
}

function updateSelectionUI() {
  const infoPanel = document.getElementById('selection-info');
  const selectedCount = document.getElementById('selected-count');
  
  if (selectedUsers.length > 0) {
    infoPanel.style.display = 'flex';
    selectedCount.textContent = selectedUsers.length;
    
    // 更新卡片选中状态
    document.querySelectorAll('.user-card').forEach(card => {
      const userId = card.dataset.userId;
      if (selectedUsers.some(u => u.id === userId)) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  } else {
    infoPanel.style.display = 'none';
  }
}

function clearSelection() {
  selectedUsers = [];
  updateSelectionUI();
  updateMatchButton();
}

function updateMatchButton() {
  const btn = document.getElementById('manual-match-btn');
  if (btn) {
    btn.disabled = selectedUsers.length !== 2;
  }
}

// 创建手动匹配
async function createManualMatch() {
  if (selectedUsers.length !== 2) {
    showNotification('Please select exactly 2 users', 'warning');
    return;
  }
  
  const [userA, userB] = selectedUsers;
  
  // 查找共同时间
  const commonTimes = userA.times?.filter(t => userB.times?.includes(t)) || [];
  if (commonTimes.length === 0) {
    showNotification('No common time slots found', 'error');
    return;
  }
  
  // 创建匹配
  const match = {
    id: 'match_' + Date.now(),
    userA: userA.id,
    userB: userB.id,
    userAEmail: userA.email,
    userBEmail: userB.email,
    timeSlot: commonTimes[0],
    scheduledDate: new Date().toISOString().split('T')[0],
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };
  
  // 保存匹配
  allMatches.push(match);
  await API.saveMatches(allMatches);
  
  // 更新用户匹配计数
  userA.matchCount = (userA.matchCount || 0) + 1;
  userB.matchCount = (userB.matchCount || 0) + 1;
  await API.saveUsers(allUsers);
  
  showNotification(`Connection created between ${userA.email} and ${userB.email}`, 'success');
  logAction(`Manual match created: ${userA.email} ↔ ${userB.email}`);
  
  // 清除选择并刷新
  clearSelection();
  await loadAllData();
}

// 批量匹配
function showBatchMatchModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🧬 Batch Matching</h3>
        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      
      <div class="batch-controls">
        <div class="form-group">
          <label>Time Slot</label>
          <select id="batch-time" class="form-select">
            <option value="">All available times</option>
            <option value="mon-19">Monday 7-8 PM</option>
            <option value="tue-20">Tuesday 8-9 PM</option>
            <option value="wed-19">Wednesday 7-8 PM</option>
            <option value="thu-20">Thursday 8-9 PM</option>
            <option value="fri-19">Friday 7-8 PM</option>
            <option value="sat-15">Saturday 3-4 PM</option>
            <option value="sat-20">Saturday 8-9 PM</option>
            <option value="sun-15">Sunday 3-4 PM</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Match Strategy</label>
          <select id="batch-strategy" class="form-select">
            <option value="common-time">Match by common time slots</option>
            <option value="similar-count">Match users with similar match counts</option>
            <option value="new-users">Prioritize new users</option>
          </select>
        </div>
        
        <div class="batch-preview">
          <h4>Potential Matches</h4>
          <div id="batch-preview-list" class="batch-preview-list">
            <p>Configure settings to see potential matches</p>
          </div>
          <div class="batch-stats">
            <span id="potential-count">0</span> potential matches found
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" onclick="previewBatchMatches()">Preview</button>
          <button class="btn-primary" onclick="executeBatchMatches()" id="execute-batch-btn" disabled>
            Create All Matches
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function previewBatchMatches() {
  const timeSlot = document.getElementById('batch-time')?.value;
  const strategy = document.getElementById('batch-strategy')?.value;
  
  // 根据策略生成匹配对
  const pairs = generateBatchPairs(timeSlot, strategy);
  
  const previewList = document.getElementById('batch-preview-list');
  const potentialCount = document.getElementById('potential-count');
  
  if (pairs.length === 0) {
    previewList.innerHTML = '<p class="no-matches">No matches found with current settings</p>';
    potentialCount.textContent = '0';
    document.getElementById('execute-batch-btn').disabled = true;
    return;
  }
  
  previewList.innerHTML = pairs.map(pair => `
    <div class="batch-pair">
      <div class="pair-users">
        <span class="user">${pair.userAEmail}</span>
        <span class="connector">↔</span>
        <span class="user">${pair.userBEmail}</span>
      </div>
      <div class="pair-time">${formatTime(pair.timeSlot)}</div>
    </div>
  `).join('');
  
  potentialCount.textContent = pairs.length;
  document.getElementById('execute-batch-btn').disabled = false;
}

function generateBatchPairs(timeSlot, strategy) {
  const pairs = [];
  const usedUsers = new Set();
  
  // 过滤可用用户
  let availableUsers = timeSlot 
    ? allUsers.filter(u => u.times?.includes(timeSlot))
    : allUsers;
  
  // 根据策略排序
  if (strategy === 'new-users') {
    availableUsers.sort((a, b) => (a.matchCount || 0) - (b.matchCount || 0));
  } else if (strategy === 'similar-count') {
    availableUsers.sort((a, b) => Math.abs((a.matchCount || 0) - (b.matchCount || 0)));
  }
  
  // 生成配对
  for (let i = 0; i < availableUsers.length; i++) {
    if (usedUsers.has(availableUsers[i].id)) continue;
    
    for (let j = i + 1; j < availableUsers.length; j++) {
      if (usedUsers.has(availableUsers[j].id)) continue;
      
      const actualTimeSlot = timeSlot || findCommonTime(availableUsers[i], availableUsers[j]);
      if (actualTimeSlot) {
        pairs.push({
          userA: availableUsers[i].id,
          userB: availableUsers[j].id,
          userAEmail: availableUsers[i].email,
          userBEmail: availableUsers[j].email,
          timeSlot: actualTimeSlot
        });
        
        usedUsers.add(availableUsers[i].id);
        usedUsers.add(availableUsers[j].id);
        break;
      }
    }
  }
  
  return pairs;
}

function findCommonTime(userA, userB) {
  return userA.times?.find(t => userB.times?.includes(t));
}

async function executeBatchMatches() {
  const timeSlot = document.getElementById('batch-time')?.value;
  const strategy = document.getElementById('batch-strategy')?.value;
  
  const pairs = generateBatchPairs(timeSlot, strategy);
  
  if (pairs.length === 0) {
    showNotification('No matches to create', 'warning');
    return;
  }
  
  // 创建所有匹配
  const createdMatches = [];
  
  for (const pair of pairs) {
    const match = {
      id: 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      userA: pair.userA,
      userB: pair.userB,
      userAEmail: pair.userAEmail,
      userBEmail: pair.userBEmail,
      timeSlot: pair.timeSlot,
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    allMatches.push(match);
    createdMatches.push(match);
    
    // 更新用户匹配计数
    const userA = allUsers.find(u => u.id === pair.userA);
    const userB = allUsers.find(u => u.id === pair.userB);
    if (userA) userA.matchCount = (userA.matchCount || 0) + 1;
    if (userB) userB.matchCount = (userB.matchCount || 0) + 1;
  }
  
  // 保存数据
  await Promise.all([
    API.saveMatches(allMatches),
    API.saveUsers(allUsers)
  ]);
  
  showNotification(`Created ${createdMatches.length} matches successfully`, 'success');
  logAction(`Batch matches created: ${createdMatches.length} pairs`);
  
  // 关闭模态框并刷新
  document.querySelector('.modal-overlay')?.remove();
  await loadAllData();
}

// CSV导出
async function exportUsersCSV() {
  const headers = ['ID', 'Email', 'Name', 'Available Times', 'Match Count', 'Created At', 'Last Active'];
  const rows = allUsers.map(user => [
    user.id,
    user.email,
    user.name || '',
    (user.times || []).join(';'),
    user.matchCount || 0,
    user.createdAt || '',
    user.lastActive || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  // 创建下载链接
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `soul-lab-users-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('CSV exported successfully', 'success');
  logAction('User data exported to CSV');
}

// 自动匹配
async function autoMatch() {
  // 找到两个有共同时间的用户
  for (let i = 0; i < allUsers.length; i++) {
    for (let j = i + 1; j < allUsers.length; j++) {
      const commonTime = findCommonTime(allUsers[i], allUsers[j]);
      if (commonTime) {
        selectedUsers = [allUsers[i], allUsers[j]];
        await createManualMatch();
        return;
      }
    }
  }
  
  showNotification('No compatible matches found', 'warning');
}

// ========== 工具函数 ==========
function updateStats() {
  const totalUsers = document.getElementById('total-users');
  const matchesMade = document.getElementById('matches-made');
  const activeSessionsCount = document.getElementById('active-now');
  
  if (totalUsers) totalUsers.textContent = allUsers.length;
  if (matchesMade) matchesMade.textContent = allMatches.length;
  
  // 计算活跃会话
  const activeSessions = allSessions.filter(s => s.status === 'active').length;
  if (activeSessionsCount) activeSessionsCount.textContent = activeSessions;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${getNotificationIcon(type)}</span>
      <span class="notification-text">${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // 自动移除
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || 'ℹ️';
}

function logAction(action) {
  const logEl = document.getElementById('action-log');
  if (!logEl) return;
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  logEntry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${action}`;
  
  logEl.prepend(logEntry);
  
  // 限制日志数量
  if (logEl.children.length > 50) {
    logEl.removeChild(logEl.lastChild);
  }
}

function formatTime(timeCode) {
  const timeMap = {
    'mon-19': 'Mon 7-8 PM',
    'tue-20': 'Tue 8-9 PM',
    'wed-19': 'Wed 7-8 PM',
    'thu-20': 'Thu 8-9 PM',
    'fri-19': 'Fri 7-8 PM',
    'sat-15': 'Sat 3-4 PM',
    'sat-20': 'Sat 8-9 PM',
    'sun-15': 'Sun 3-4 PM'
  };
  return timeMap[timeCode] || timeCode;
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function calculateDuration(startTime) {
  if (!startTime) return 'N/A';
  const start = new Date(startTime);
  const now = new Date();
  const diff = Math.floor((now - start) / 1000 / 60); // 分钟
  
  if (diff < 60) return `${diff}m`;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h ${minutes}m`;
}

function getDepthClass(score) {
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

function getCurrentWeek() {
  const now = new Date();
  const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  return firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// 导出到全局
window.admin = {
  loadAllData,
  switchView,
  createManualMatch,
  showBatchMatchModal,
  exportUsersCSV,
  autoMatch,
  logAction
};