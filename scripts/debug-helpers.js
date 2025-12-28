// debug-helpers.js - Helper functions for testing

// Add test users quickly
window.addTestUsers = function() {
  const testUsers = [
    {
      id: 'user_test_001',
      email: 'alice@soullab.com',
      times: ['mon-19', 'wed-19', 'sat-15'],
      createdAt: new Date().toISOString(),
      matchCount: 0,
      status: 'pending'
    },
    {
      id: 'user_test_002',
      email: 'bob@soullab.com',
      times: ['mon-19', 'tue-20', 'sat-15'],
      createdAt: new Date().toISOString(),
      matchCount: 0,
      status: 'pending'
    },
    {
      id: 'user_test_003',
      email: 'charlie@soullab.com',
      times: ['wed-19', 'thu-20', 'sat-20'],
      createdAt: new Date().toISOString(),
      matchCount: 0,
      status: 'pending'
    }
  ];
  
  const users = JSON.parse(localStorage.getItem('soulLabUsers')) || [];
  
  // Remove existing test users
  const filteredUsers = users.filter(u => !u.email.includes('@soullab.com'));
  
  // Add new test users
  filteredUsers.push(...testUsers);
  
  localStorage.setItem('soulLabUsers', JSON.stringify(filteredUsers));
  
  console.log('✅ Added 3 test users!');
  console.log('Test users:', testUsers.map(u => u.email));
  
  if (typeof loadQueue === 'function') {
    loadQueue();
  }
  
  return testUsers;
};

// Clear all test data
window.clearTestData = function() {
  if (confirm('Clear all test data?')) {
    localStorage.removeItem('soulLabUsers');
    localStorage.removeItem('soulLabMatches');
    localStorage.removeItem('soulLabSessions');
    console.log('✅ Test data cleared!');
    
    if (typeof loadQueue === 'function') {
      loadQueue();
    }
  }
};

// View current state
window.viewState = function() {
  const data = {
    users: JSON.parse(localStorage.getItem('soulLabUsers')) || [],
    waitlist: JSON.parse(localStorage.getItem('elypoWaitlist')) || [],
    matches: JSON.parse(localStorage.getItem('soulLabMatches')) || [],
    sessions: JSON.parse(localStorage.getItem('soulLabSessions')) || [],
    logs: JSON.parse(localStorage.getItem('registrationLogs')) || []
  };
  
  console.log('=== CURRENT STATE ===');
  console.log('📧 Total Users:', data.users.length);
  console.log('📋 Waitlist:', data.waitlist.length);
  console.log('🔗 Matches:', data.matches.length);
  console.log('💬 Sessions:', data.sessions.length);
  console.log('📝 Logs:', data.logs.length);
  console.log('\nFull data:', data);
  
  return data;
};

// Export to JSON file
window.exportToJSON = function() {
  const data = window.viewState();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `soul-lab-data-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  console.log('✅ Data exported to JSON file!');
};

// Quick match test
window.quickMatchTest = async function() {
  console.log('🧪 Running quick match test...');
  
  // Add test users if none exist
  const users = JSON.parse(localStorage.getItem('soulLabUsers')) || [];
  if (users.length < 2) {
    console.log('Adding test users first...');
    window.addTestUsers();
  }
  
  // Reload users
  const allUsers = JSON.parse(localStorage.getItem('soulLabUsers')) || [];
  
  if (allUsers.length < 2) {
    console.log('❌ Need at least 2 users');
    return;
  }
  
  // Find two users with common time
  let matched = false;
  for (let i = 0; i < allUsers.length && !matched; i++) {
    for (let j = i + 1; j < allUsers.length && !matched; j++) {
      const userA = allUsers[i];
      const userB = allUsers[j];
      const commonTimes = (userA.times || []).filter(t => (userB.times || []).includes(t));
      
      if (commonTimes.length > 0) {
        // Create match
        const matches = JSON.parse(localStorage.getItem('soulLabMatches')) || [];
        const newMatch = {
          id: 'match_test_' + Date.now(),
          userA: userA.id,
          userB: userB.id,
          userAEmail: userA.email,
          userBEmail: userB.email,
          timeSlot: commonTimes[0],
          scheduledDate: new Date().toISOString().split('T')[0],
          status: 'scheduled',
          createdAt: new Date().toISOString()
        };
        
        matches.push(newMatch);
        localStorage.setItem('soulLabMatches', JSON.stringify(matches));
        
        console.log('✅ Match created!');
        console.log(`   ${userA.email} ↔ ${userB.email}`);
        console.log(`   Time: ${commonTimes[0]}`);
        
        matched = true;
        
        if (typeof loadQueue === 'function') {
          loadQueue();
        }
      }
    }
  }
  
  if (!matched) {
    console.log('❌ No compatible users found (no common time slots)');
  }
  
  return matched;
};

// Show helpful commands
window.help = function() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           🔮 Soul Lab Debug Helper Commands 🔮            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  📊 View Data:                                            ║
║    viewState()              - See all current data        ║
║    exportAllRegistrations() - Export registration data    ║
║    exportToJSON()           - Download data as JSON       ║
║                                                            ║
║  🧪 Testing:                                              ║
║    addTestUsers()           - Add 3 test users            ║
║    quickMatchTest()         - Create a test match         ║
║    clearTestData()          - Clear all test data         ║
║                                                            ║
║  🔧 Utils:                                                ║
║    exportWaitlist()         - View waitlist emails        ║
║    exportSoulLabUsers()     - View Soul Lab users         ║
║    help()                   - Show this help menu         ║
║                                                            ║
║  🗑️  Reset:                                               ║
║    localStorage.clear()     - Clear ALL data              ║
║    location.reload()        - Refresh page                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
};

// Auto-show help on load
console.log('💡 Type help() to see available debug commands');
