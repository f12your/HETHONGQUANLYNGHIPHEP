const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database file path
const DB_PATH = path.join(__dirname, 'database.json');

// Initialize database if it doesn't exist
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      users: [
        {
          id: 1,
          username: 'admin',
          password: bcrypt.hashSync('admin123', 10),
          name: 'Quản lý',
          role: 'manager',
          email: 'admin@company.com'
        }
      ],
      leaveRequests: [],
      advanceRequests: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Read database
function readDB() {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

// Write database
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Initialize database on startup
initDatabase();

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Check if user is manager
function isManager(req, res, next) {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
}

// Routes

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    }
  });
});

// Get current user
app.get('/api/me', authenticateToken, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email
  });
});

// Create employee account (Manager only)
app.post('/api/users', authenticateToken, isManager, (req, res) => {
  const { username, password, name, email } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Tên đăng nhập, mật khẩu và họ tên là bắt buộc' });
  }

  const db = readDB();

  // Check if username already exists
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
  }

  const newUser = {
    id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
    username,
    password: bcrypt.hashSync(password, 10),
    name,
    email: email || '',
    role: 'employee'
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role
  });
});

// Bulk create employees and remove Vũ (Manager only)
app.post('/api/users/bulk-setup', authenticateToken, isManager, (req, res) => {
  const db = readDB();

  // Remove employee named "Vũ" or username contains "vu"
  const vuIndex = db.users.findIndex(u => 
    u.role === 'employee' && 
    (u.name.toLowerCase().includes('vũ') || u.username.toLowerCase().includes('vu'))
  );
  if (vuIndex !== -1) {
    db.users.splice(vuIndex, 1);
  }

  // List of employees to add
  const employeeList = [
    { name: 'A.NĂM', username: 'anam' },
    { name: 'TIẾN', username: 'tien' },
    { name: 'HIỆP', username: 'hiep' },
    { name: 'CHƯƠNG', username: 'chuong' },
    { name: 'PHƯỚC', username: 'phuoc' },
    { name: 'GIANG', username: 'giang' },
    { name: 'HÒA', username: 'hoa' },
    { name: 'DUY', username: 'duy' },
    { name: 'THƯƠNG', username: 'thuong' },
    { name: 'ANH THÁI', username: 'anhthai' },
    { name: 'C.HƯỜNG', username: 'chuongc' },
    { name: 'TÚ', username: 'tu' },
    { name: 'LUẬT', username: 'luat' },
    { name: 'C.NHIỄM', username: 'cnhiem' },
    { name: 'VY', username: 'vy' },
    { name: 'THẾ ANH', username: 'theanh' },
    { name: 'HẬU', username: 'hau' }
  ];

  let maxId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) : 0;
  const addedUsers = [];

  employeeList.forEach(emp => {
    // Check if username already exists
    if (!db.users.find(u => u.username === emp.username)) {
      maxId++;
      const newUser = {
        id: maxId,
        username: emp.username,
        password: bcrypt.hashSync('123456', 10), // Default password
        name: emp.name,
        email: '',
        role: 'employee'
      };
      db.users.push(newUser);
      addedUsers.push({
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      });
    }
  });

  writeDB(db);

  res.json({
    message: `Đã xóa nhân viên Vũ và thêm ${addedUsers.length} nhân viên mới`,
    added: addedUsers
  });
});

// Get all users (Manager only)
app.get('/api/users', authenticateToken, isManager, (req, res) => {
  const db = readDB();
  const users = db.users.map(u => ({
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role
  }));
  res.json(users);
});

// Update user (Manager only)
app.put('/api/users/:id', authenticateToken, isManager, (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, username } = req.body;
  const db = readDB();

  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
  }

  // Check if username already exists (excluding current user)
  if (username && db.users.find(u => u.username === username && u.id !== userId)) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
  }

  if (name) db.users[userIndex].name = name;
  if (username) db.users[userIndex].username = username;

  writeDB(db);

  res.json({
    id: db.users[userIndex].id,
    username: db.users[userIndex].username,
    name: db.users[userIndex].name,
    email: db.users[userIndex].email,
    role: db.users[userIndex].role
  });
});

// Change password (Employee/Manager)
app.patch('/api/users/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  // Verify current password
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
  }

  // Update password
  user.password = bcrypt.hashSync(newPassword, 10);
  writeDB(db);

  res.json({ message: 'Đổi mật khẩu thành công' });
});

// Reset password for employee (Manager only)
app.patch('/api/users/:id/reset-password', authenticateToken, isManager, (req, res) => {
  const userId = parseInt(req.params.id);
  const { newPassword } = req.body;
  const db = readDB();

  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
  }

  // If newPassword is provided, use it; otherwise use default
  const password = newPassword || '123456';
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  db.users[userIndex].password = bcrypt.hashSync(password, 10);
  writeDB(db);

  res.json({ 
    message: 'Đặt lại mật khẩu thành công',
    defaultPassword: password
  });
});

// Get own salary for employee (MUST BE BEFORE /api/users/:id/salary/:month)
app.get('/api/users/me/salary/:month', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const month = req.params.month;
    const db = readDB();

    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    console.log(`[Salary API] User ID: ${userId}, Month: ${month}`);
    console.log(`[Salary API] User salaries:`, user.salaries);
    
    const salary = user.salaries && user.salaries[month] ? user.salaries[month] : null;
    
    console.log(`[Salary API] Found salary:`, salary);

    res.json({ month, salary });
  } catch (err) {
    console.error('Error in /api/users/me/salary/:month:', err);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin lương: ' + err.message });
  }
});

// Set salary for employee (Manager only)
app.post('/api/users/:id/salary', authenticateToken, isManager, (req, res) => {
  const userId = parseInt(req.params.id);
  const { month, salary } = req.body; // month format: YYYY-MM
  const db = readDB();

  if (!month || salary === undefined || salary === null) {
    return res.status(400).json({ error: 'Tháng và lương là bắt buộc' });
  }

  if (salary < 0) {
    return res.status(400).json({ error: 'Lương không thể âm' });
  }

  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
  }

  // Initialize salaries object if not exists
  if (!db.users[userIndex].salaries) {
    db.users[userIndex].salaries = {};
  }

  // Set salary for the month
  db.users[userIndex].salaries[month] = parseFloat(salary);
  writeDB(db);

  res.json({
    message: 'Đặt lương thành công',
    month,
    salary: db.users[userIndex].salaries[month]
  });
});

// Get salary for employee (Manager only)
app.get('/api/users/:id/salary/:month', authenticateToken, isManager, (req, res) => {
  const userId = parseInt(req.params.id);
  const month = req.params.month;
  const db = readDB();

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
  }

  const salary = user.salaries && user.salaries[month] ? user.salaries[month] : null;

  res.json({ month, salary });
});

// Get all salaries for employee (Manager only)
app.get('/api/users/:id/salaries', authenticateToken, isManager, (req, res) => {
  const userId = parseInt(req.params.id);
  const db = readDB();

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
  }

  res.json({ salaries: user.salaries || {} });
});

// Delete user (Manager only)
app.delete('/api/users/:id', authenticateToken, isManager, (req, res) => {
  const userId = parseInt(req.params.id);
  const db = readDB();

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Không thể xóa tài khoản của chính bạn' });
  }

  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
  }

  db.users.splice(userIndex, 1);
  writeDB(db);

  res.json({ message: 'Xóa nhân viên thành công' });
});

// Submit leave request (Employee)
app.post('/api/leave-requests', authenticateToken, (req, res) => {
  // Support both old format (startDate/endDate) and new format (date)
  const { date, startDate, endDate, reason, type, timePeriod, startTimePeriod, endTimePeriod, userId } = req.body;

  // New simplified format (check if date field exists in request)
  if (date !== undefined && date !== null) {
    if (!date || date.trim() === '') {
      return res.status(400).json({ error: 'Ngày nghỉ là bắt buộc' });
    }

    const db = readDB();
    
    // Nếu là quản lý và có userId trong body, cho phép tạo đơn cho nhân viên khác
    let targetUserId = req.user.id;
    let targetUser = db.users.find(u => u.id === req.user.id);
    
    if (req.user.role === 'manager' && userId) {
      // Quản lý có thể tạo đơn cho nhân viên khác
      const targetEmployee = db.users.find(u => u.id === parseInt(userId) && u.role === 'employee');
      if (!targetEmployee) {
        return res.status(400).json({ error: 'Không tìm thấy nhân viên' });
      }
      targetUserId = parseInt(userId);
      targetUser = targetEmployee;
    }

    const newRequest = {
      id: db.leaveRequests.length > 0 ? Math.max(...db.leaveRequests.map(r => r.id)) + 1 : 1,
      userId: targetUserId,
      userName: targetUser.name,
      date,
      timePeriod: timePeriod || 'cả ngày',
      reason: reason || '',
      status: 'approved', // Mặc định được duyệt
      submittedAt: new Date().toISOString(),
      canEdit: false, // Nhân viên không thể sửa
      createdByManager: req.user.role === 'manager' && userId ? true : false // Đánh dấu đơn do quản lý tạo
    };

    db.leaveRequests.push(newRequest);
    writeDB(db);

    return res.status(201).json(newRequest);
  }

  // Old format (backward compatibility)
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Ngày bắt đầu và ngày kết thúc là bắt buộc' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);

    const newRequest = {
      id: db.leaveRequests.length > 0 ? Math.max(...db.leaveRequests.map(r => r.id)) + 1 : 1,
      userId: req.user.id,
      userName: user.name,
      startDate,
      endDate,
      startTimePeriod: startTimePeriod || 'cả ngày',
      endTimePeriod: endTimePeriod || 'cả ngày',
      reason: reason || '',
      type: type || 'nghỉ phép',
      status: 'approved', // Mặc định được duyệt
      submittedAt: new Date().toISOString(),
      canEdit: false // Nhân viên không thể sửa
    };

  db.leaveRequests.push(newRequest);
  writeDB(db);

  res.status(201).json(newRequest);
});

// Get leave requests
app.get('/api/leave-requests', authenticateToken, (req, res) => {
  const db = readDB();
  let requests;

  if (req.user.role === 'manager') {
    // Manager can see all requests
    requests = db.leaveRequests;
  } else {
    // Employee can only see their own requests
    requests = db.leaveRequests.filter(r => r.userId === req.user.id);
  }

  res.json(requests);
});

// Get single leave request
app.get('/api/leave-requests/:id', authenticateToken, (req, res) => {
  const requestId = parseInt(req.params.id);
  const db = readDB();
  const request = db.leaveRequests.find(r => r.id === requestId);

  if (!request) {
    return res.status(404).json({ error: 'Leave request not found' });
  }

  // Check permission
  if (req.user.role !== 'manager' && request.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(request);
});

// Update leave request (Manager only)
app.put('/api/leave-requests/:id', authenticateToken, (req, res) => {
  const requestId = parseInt(req.params.id);
  const db = readDB();
  const requestIndex = db.leaveRequests.findIndex(r => r.id === requestId);

  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy đơn nghỉ phép' });
  }

  // Chỉ quản lý mới có quyền sửa
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Chỉ quản lý mới có quyền chỉnh sửa đơn nghỉ phép' });
  }

  const request = db.leaveRequests[requestIndex];

  const { date, startDate, endDate, reason, type, timePeriod, startTimePeriod, endTimePeriod } = req.body;

  // Update new format
  if (date !== undefined) {
    db.leaveRequests[requestIndex] = {
      ...request,
      date: date || request.date,
      timePeriod: timePeriod !== undefined ? timePeriod : request.timePeriod,
      reason: reason || request.reason
    };
  } else {
    // Update old format (backward compatibility)
    db.leaveRequests[requestIndex] = {
      ...request,
      startDate: startDate || request.startDate,
      endDate: endDate || request.endDate,
      startTimePeriod: startTimePeriod !== undefined ? startTimePeriod : request.startTimePeriod,
      endTimePeriod: endTimePeriod !== undefined ? endTimePeriod : request.endTimePeriod,
      reason: reason || request.reason,
      type: type || request.type
    };
  }

  writeDB(db);

  res.json(db.leaveRequests[requestIndex]);
});

// Approve/Reject leave request (Manager only)
app.patch('/api/leave-requests/:id/status', authenticateToken, isManager, (req, res) => {
  const requestId = parseInt(req.params.id);
  const { status } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = readDB();
  const requestIndex = db.leaveRequests.findIndex(r => r.id === requestId);

  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Leave request not found' });
  }

  db.leaveRequests[requestIndex].status = status;
  db.leaveRequests[requestIndex].canEdit = false; // Lock after status change
  writeDB(db);

  res.json(db.leaveRequests[requestIndex]);
});

// Delete leave request (Manager only)
app.delete('/api/leave-requests/:id', authenticateToken, (req, res) => {
  const requestId = parseInt(req.params.id);
  const db = readDB();
  const requestIndex = db.leaveRequests.findIndex(r => r.id === requestId);

  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy đơn nghỉ phép' });
  }

  // Chỉ quản lý mới có quyền xóa
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Chỉ quản lý mới có quyền xóa đơn nghỉ phép' });
  }

  db.leaveRequests.splice(requestIndex, 1);
  writeDB(db);

  res.json({ message: 'Xóa đơn nghỉ phép thành công' });
});

// Advance salary requests

// Create advance salary request
// Manager can create for any employee, Employee can create for themselves
app.post('/api/advance-requests', authenticateToken, (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Số tiền là bắt buộc' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền phải lớn hơn 0' });
    }

    const db = readDB();
    
    // Đảm bảo advanceRequests luôn là array
    if (!db.advanceRequests || !Array.isArray(db.advanceRequests)) {
      db.advanceRequests = [];
    }
    
    let targetUserId;
    let targetUser;

    if (req.user.role === 'manager') {
      // Manager can create for any employee
      if (!userId) {
        return res.status(400).json({ error: 'Nhân viên là bắt buộc' });
      }
      const employee = db.users.find(u => u && u.id === parseInt(userId) && u.role === 'employee');
      if (!employee) {
        return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
      }
      targetUserId = parseInt(userId);
      targetUser = employee;
    } else {
      // Employee can only create for themselves
      targetUserId = req.user.id;
      targetUser = db.users.find(u => u && u.id === req.user.id);
      if (!targetUser) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin người dùng' });
      }
    }

    // Tính ID mới an toàn
    let newId = 1;
    if (db.advanceRequests.length > 0) {
      const validIds = db.advanceRequests
        .filter(r => r && r.id && typeof r.id === 'number')
        .map(r => r.id);
      if (validIds.length > 0) {
        newId = Math.max(...validIds) + 1;
      }
    }

    const newRequest = {
      id: newId,
      userId: targetUserId,
      userName: targetUser.name || 'Unknown',
      amount: parsedAmount,
      reason: (reason || '').trim(),
      status: req.user.role === 'manager' ? 'approved' : 'pending', // Manager auto-approve, Employee needs approval
      submittedAt: new Date().toISOString()
    };

    db.advanceRequests.push(newRequest);
    writeDB(db);

    res.status(201).json(newRequest);
  } catch (err) {
    console.error('Error creating advance request:', err);
    res.status(500).json({ error: 'Lỗi khi tạo yêu cầu ứng lương: ' + err.message });
  }
});

// Get advance requests
app.get('/api/advance-requests', authenticateToken, (req, res) => {
  try {
    const db = readDB();
    
    // Đảm bảo advanceRequests luôn là array
    if (!db.advanceRequests || !Array.isArray(db.advanceRequests)) {
      db.advanceRequests = [];
      writeDB(db);
    }
    
    let requests;

    if (req.user.role === 'manager') {
      // Manager can see all requests
      requests = db.advanceRequests;
    } else {
      // Employee can only see their own requests
      requests = db.advanceRequests.filter(r => r && r.userId === req.user.id);
    }

    res.json(requests || []);
  } catch (err) {
    console.error('Error fetching advance requests:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách ứng lương' });
  }
});

// Approve/Reject advance request (Manager only)
app.patch('/api/advance-requests/:id/status', authenticateToken, isManager, (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const db = readDB();
    
    // Đảm bảo advanceRequests luôn là array
    if (!db.advanceRequests || !Array.isArray(db.advanceRequests)) {
      db.advanceRequests = [];
      writeDB(db);
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu ứng lương' });
    }
    
    const requestIndex = db.advanceRequests.findIndex(r => r && r.id === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu ứng lương' });
    }

    db.advanceRequests[requestIndex].status = status;
    writeDB(db);

    res.json(db.advanceRequests[requestIndex]);
  } catch (err) {
    console.error('Error updating advance request status:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái ứng lương' });
  }
});

// Update advance request (Manager only)
app.put('/api/advance-requests/:id', authenticateToken, isManager, (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { amount, reason } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Số tiền là bắt buộc' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền phải lớn hơn 0' });
    }

    const db = readDB();
    
    // Đảm bảo advanceRequests luôn là array
    if (!db.advanceRequests || !Array.isArray(db.advanceRequests)) {
      db.advanceRequests = [];
      writeDB(db);
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu ứng lương' });
    }
    
    const requestIndex = db.advanceRequests.findIndex(r => r && r.id === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu ứng lương' });
    }

    db.advanceRequests[requestIndex].amount = parsedAmount;
    db.advanceRequests[requestIndex].reason = (reason || '').trim();
    writeDB(db);

    res.json(db.advanceRequests[requestIndex]);
  } catch (err) {
    console.error('Error updating advance request:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật yêu cầu ứng lương' });
  }
});

// Delete advance request (Manager only)
app.delete('/api/advance-requests/:id', authenticateToken, isManager, (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const db = readDB();
    
    // Đảm bảo advanceRequests luôn là array
    if (!db.advanceRequests || !Array.isArray(db.advanceRequests)) {
      db.advanceRequests = [];
      writeDB(db);
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu ứng lương' });
    }
    
    const requestIndex = db.advanceRequests.findIndex(r => r && r.id === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu ứng lương' });
    }

    db.advanceRequests.splice(requestIndex, 1);
    writeDB(db);

    res.json({ message: 'Xóa yêu cầu ứng lương thành công' });
  } catch (err) {
    console.error('Error deleting advance request:', err);
    res.status(500).json({ error: 'Lỗi khi xóa yêu cầu ứng lương' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

