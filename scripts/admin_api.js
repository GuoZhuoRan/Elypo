// admin-api.js - API for accessing registration data
class SoulLabAPI {
  constructor() {
    // This will read from localStorage where the registrations are saved
  }

  // 获取所有Soul Lab用户（从localStorage读取实际注册数据）
  async getUsers() {
    const users = JSON.parse(localStorage.getItem('soulLabUsers')) || [];
    
    // 如果没有真实用户，返回示例数据（仅用于演示）
    if (users.length === 0) {
      return [
        {
          id: 'user_demo_001',
          email: 'demo@example.com',
          times: ['mon-19', 'wed-19', 'sat-15'],
          createdAt: new Date().toISOString(),
          matchCount: 0,
          status: 'pending'
        }
      ];
    }
    
    return users;
  }

  // 获取Waitlist用户
  async getWaitlist() {
    return JSON.parse(localStorage.getItem('elypoWaitlist')) || [];
  }

  // 获取所有匹配
  async getMatches() {
    return JSON.parse(localStorage.getItem('soulLabMatches')) || [];
  }

  // 获取所有会话
  async getSessions() {
    return JSON.parse(localStorage.getItem('soulLabSessions')) || [];
  }

  // 保存用户数据
  async saveUsers(users) {
    localStorage.setItem('soulLabUsers', JSON.stringify(users));
    return true;
  }

  // 保存匹配数据
  async saveMatches(matches) {
    localStorage.setItem('soulLabMatches', JSON.stringify(matches));
    return true;
  }

  // 保存会话数据
  async saveSessions(sessions) {
    localStorage.setItem('soulLabSessions', JSON.stringify(sessions));
    return true;
  }

  // 获取注册日志
  async getRegistrationLogs() {
    return JSON.parse(localStorage.getItem('registrationLogs')) || [];
  }

  // 获取统计数据
  async getStats() {
    const users = await this.getUsers();
    const matches = await this.getMatches();
    const sessions = await this.getSessions();
    const waitlist = await this.getWaitlist();
    
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    
    return {
      totalUsers: users.length,
      totalWaitlist: waitlist.length,
      matchesMade: matches.length,
      completedMatches: completedMatches,
      activeSessions: activeSessions,
      avgMatchCount: users.length > 0 
        ? (users.reduce((sum, u) => sum + (u.matchCount || 0), 0) / users.length).toFixed(1)
        : 0
    };
  }

  // 清除所有数据（慎用！）
  async clearAllData() {
    if (confirm('⚠️ This will delete ALL registration data. Are you sure?')) {
      localStorage.removeItem('soulLabUsers');
      localStorage.removeItem('soulLabMatches');
      localStorage.removeItem('soulLabSessions');
      localStorage.removeItem('elypoWaitlist');
      localStorage.removeItem('registrationLogs');
      return true;
    }
    return false;
  }

  // 导出CSV格式的用户数据
  async exportUsersCSV() {
    const users = await this.getUsers();
    
    if (users.length === 0) {
      alert('No users to export');
      return;
    }
    
    const headers = ['ID', 'Email', 'Time Slots', 'Match Count', 'Status', 'Created At'];
    const rows = users.map(user => [
      user.id,
      user.email,
      (user.times || []).join('; '),
      user.matchCount || 0,
      user.status || 'pending',
      user.createdAt || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // 创建下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `soul-lab-users-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  }
}

// 创建全局API实例
window.SoulLabAPI = new SoulLabAPI();
