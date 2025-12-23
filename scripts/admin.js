// 管理员功能脚本
let selectedUsers = [];
let allUsers = [];

// 模拟数据 - 在实际中会从后端API获取
const mockUsers = [
  {
    id: 'user_001',
    email: 'soul.seeker@example.com',
    name: 'Soul Seeker',
    times: ['mon-19', 'wed-19', 'sat-15'],
    signedUp: '2024-03-20',
    matchCount: 0
  },
  {
    id: 'user_002',
    email: 'digital.nomad@example.com',
    name: 'Digital Nomad',
    times: ['tue-20', 'thu-20', 'sat-20'],
    signedUp: '2024-03-19',
    matchCount: 2
  },
  {
    id: 'user_003',
    email: 'quantum.thinker@example.com',
    name: 'Quantum Thinker',
    times: ['mon-19', 'fri-19', 'sun-15'],
    signedUp: '2024-03-21',
    matchCount: 1
  },
  {
    id: 'user_004',
    email: 'cosmic.wanderer@example.com',
    name: 'Cosmic Wanderer',
    times: ['wed-19', 'sat-15', 'sat-20'],
    signedUp: '2024-03-20',
    matchCount: 0
  }
];

// 加载用户队列
function loadQueue() {
  allUsers = mockUsers; // 实际中从API获取
  renderUserQueue(allUsers);
  updateStats();
  logAction('Queue refreshed');
}

// 渲染用户队列
function renderUserQueue(users) {
  const queueEl = document.getElementById('user-queue');
  if (!queueEl) return;
  
  if (users.length === 0) {
    queueEl.innerHTML = '<div class="empty-queue">🌌 No souls awaiting connection...</div>';
    return;
  }
  
  queueEl.innerHTML = users.map(user => `
    <div class="user-card" data-id="${user.id}">
      <div class="user-info">
        <div>
          <div class="user-email">${user.email}</div>
          <div class="user-times">🕐 ${user.times.map(t => formatTime(t)).join(', ')}</div>
        </div>
        <div class="user-stats">
          <small>Matches: ${user.matchCount}</small>
        </div>
      </div>
      <div class="match-controls">
        <button class="select-btn ${selectedUsers.find(u => u.id === user.id) ? 'selected' : ''}" 
                onclick="toggleSelectUser('${user.id}')">
          ${selectedUsers.find(u => u.id === user.id) ? '✓ Selected' : 'Select'}
        </button>
      </div>
    </div>
  `).join('');
}

// 格式化时间显示
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

// 选择/取消选择用户
function toggleSelectUser(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  
  const index = selectedUsers.findIndex(u => u.id === userId);
  
  if (index === -1) {
    // 添加到选择
    if (selectedUsers.length >= 2) {
      showNotification('Maximum 2 souls can be selected for a connection');
      return;
    }
    selectedUsers.push(user);
  } else {
    // 从选择中移除
    selectedUsers.splice(index, 1);
  }
  
  updateSelectionUI();
}

// 更新选择UI
function updateSelectionUI() {
  // 更新所有按钮状态
  document.querySelectorAll('.select-btn').forEach(btn => {
    const userId = btn.closest('.user-card')?.dataset.id;
    if (userId) {
      const isSelected = selectedUsers.some(u => u.id === userId);
      btn.className = `select-btn ${isSelected ? 'selected' : ''}`;
      btn.textContent = isSelected ? '✓ Selected' : 'Select';
    }
  });
  
  // 显示/隐藏选择框
  const selectionBox = document.getElementById('selected-users-box');
  const selectionList = document.getElementById('selected-users-list');
  const matchBtn = document.getElementById('match-btn');
  
  if (selectedUsers.length > 0) {
    selectionBox.style.display = 'block';
    selectionList.innerHTML = selectedUsers.map(user => `
      <div class="selected-user">
        <span>${user.email}</span>
        <button class="remove-btn" onclick="toggleSelectUser('${user.id}')">×</button>
      </div>
    `).join('');
  } else {
    selectionBox.style.display = 'none';
  }
  
  // 启用/禁用匹配按钮
  matchBtn.disabled = selectedUsers.length !== 2;
}

// 创建匹配
function createMatch() {
  if (selectedUsers.length !== 2) {
    showNotification('Please select exactly 2 souls to connect');
    return;
  }
  
  const [userA, userB] = selectedUsers;
  
  // 查找共同的时间
  const commonTimes = userA.times.filter(time => userB.times.includes(time));
  
  if (commonTimes.length === 0) {
    showNotification('No common time slots found. Please select different souls.');
    return;
  }
  
  // 选择第一个共同时间
  const selectedTime = commonTimes[0];
  
  // 在这里添加实际的后端API调用
  console.log('Creating match:', {
    userA: userA.email,
    userB: userB.email,
    time: selectedTime,
    roomId: generateRoomId()
  });
  
  // 模拟匹配成功
  showNotification(`✨ Connection forged between ${userA.email} and ${userB.email} at ${formatTime(selectedTime)}`);
  logAction(`Match created: ${userA.email} ↔ ${userB.email}`);
  
  // 发送匹配邮件（模拟）
  sendMatchEmail(userA, userB, selectedTime);
  
  // 清除选择并刷新
  selectedUsers = [];
  updateSelectionUI();
  loadQueue();
}

// 自动匹配
function autoMatch() {
  if (allUsers.length < 2) {
    showNotification('Need at least 2 souls in queue');
    return;
  }
  
  // 简单的自动匹配算法：找到有共同时间的用户
  for (let i = 0; i < allUsers.length; i++) {
    for (let j = i + 1; j < allUsers.length; j++) {
      const userA = allUsers[i];
      const userB = allUsers[j];
      const commonTimes = userA.times.filter(time => userB.times.includes(time));
      
      if (commonTimes.length > 0) {
        // 匹配这对用户
        selectedUsers = [userA, userB];
        createMatch();
        return;
      }
    }
  }
  
  showNotification('No compatible matches found');
}

// 按时间筛选
function filterByTime() {
  const timeFilter = document.getElementById('time-filter').value;
  
  if (!timeFilter) {
    renderUserQueue(allUsers);
    return;
  }
  
  const filteredUsers = allUsers.filter(user => user.times.includes(timeFilter));
  renderUserQueue(filteredUsers);
}

// 更新统计
function updateStats() {
  document.getElementById('total-users').textContent = allUsers.length;
  document.getElementById('matches-made').textContent = allUsers.reduce((sum, user) => sum + user.matchCount, 0);
  document.getElementById('avg-rating').textContent = '8.5'; // 模拟数据
  document.getElementById('active-now').textContent = Math.floor(Math.random() * 3); // 模拟
}

// 生成房间ID
function generateRoomId() {
  return 'room_' + Math.random().toString(36).substr(2, 9);
}

// 发送匹配邮件（模拟）
function sendMatchEmail(userA, userB, time) {
  // 实际中会调用后端发送邮件
  console.log('Email sent to:', userA.email);
  console.log('Email sent to:', userB.email);
}

// 显示通知
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// 记录操作日志
function logAction(action) {
  const logEl = document.getElementById('action-log');
  if (!logEl) return;
  
  const now = new Date();
  const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
  
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  logEntry.innerHTML = `<span class="log-time">${timeStr}</span> ${action}`;
  
  logEl.prepend(logEntry);
  
  // 限制日志数量
  if (logEl.children.length > 50) {
    logEl.removeChild(logEl.lastChild);
  }
}

// 导出功能给控制台使用
window.adminAPI = {
  loadQueue,
  createMatch,
  autoMatch,
  logAction
};