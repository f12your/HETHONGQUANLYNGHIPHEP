import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import api from '../services/auth';
import './Dashboard.css';

function ManagerDashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('leave-requests');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    username: '',
    password: '',
    name: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    username: ''
  });
  const [editingLeaveRequest, setEditingLeaveRequest] = useState(null);
  const [leaveRequestForm, setLeaveRequestForm] = useState({
    date: '',
    timePeriod: 'cả ngày',
    reason: ''
  });
  const [showCreateLeaveForm, setShowCreateLeaveForm] = useState(false);
  const [createLeaveForm, setCreateLeaveForm] = useState({
    userId: '',
    date: '',
    timePeriod: 'cả ngày',
    reason: ''
  });
  const [leaveRequestFilters, setLeaveRequestFilters] = useState({
    employeeId: '',
    status: '',
    month: ''
  });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyAttendanceDate, setMonthlyAttendanceDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [advanceRequests, setAdvanceRequests] = useState([]);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    userId: '',
    amount: '',
    reason: ''
  });
  const [editingAdvanceRequest, setEditingAdvanceRequest] = useState(null);
  const [advanceRequestFilter, setAdvanceRequestFilter] = useState({
    employeeId: ''
  });
  const [editingSalary, setEditingSalary] = useState(null);
  const [salaryForm, setSalaryForm] = useState({
    salary: '',
    advanceAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'leave-requests') {
      fetchLeaveRequests();
      fetchEmployees(); // Cần để hiển thị danh sách nhân viên trong form tạo đơn
    } else if (activeTab === 'salary') {
      fetchEmployees();
      fetchAdvanceRequests(); // Cần để tính số tiền đã ứng và hiển thị danh sách
      fetchLeaveRequests(); // Cần để tính số ngày nghỉ
    } else if (activeTab === 'advance-salary') {
      fetchAdvanceRequests();
      fetchEmployees();
    } else if (activeTab === 'employees') {
      fetchEmployees();
    } else if (activeTab === 'attendance' || activeTab === 'monthly-attendance') {
      fetchLeaveRequests();
      fetchEmployees();
    }
  }, [activeTab, attendanceDate, monthlyAttendanceDate, salaryMonth]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await api.get('/leave-requests');
      setLeaveRequests(response.data);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data.filter(u => u.role === 'employee'));
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchAdvanceRequests = async () => {
    try {
      const response = await api.get('/advance-requests');
      setAdvanceRequests(response.data || []);
    } catch (err) {
      console.error('Error fetching advance requests:', err);
      setAdvanceRequests([]);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/users', employeeForm);
      setShowEmployeeForm(false);
      setEmployeeForm({ username: '', password: '', name: '' });
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEditForm({
      name: employee.name,
      username: employee.username
    });
    setShowEmployeeForm(false);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.put(`/users/${editingEmployee.id}`, editForm);
      setEditingEmployee(null);
      setEditForm({ name: '', username: '' });
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (id, name) => {
    const newPassword = window.prompt(`Đặt lại mật khẩu cho ${name}:\n(Để trống sẽ dùng mật khẩu mặc định: 123456)`);
    if (newPassword === null) return; // User cancelled

    try {
      const response = await api.patch(`/users/${id}/reset-password`, {
        newPassword: newPassword || undefined
      });
      alert(`Đặt lại mật khẩu thành công!\nMật khẩu mới: ${response.data.defaultPassword || newPassword}`);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchEmployees();
      } catch (err) {
        alert(err.response?.data?.error || 'Có lỗi xảy ra');
      }
    }
  };

  const handleEditLeaveRequest = (request) => {
    setEditingLeaveRequest(request);
    if (request.date) {
      setLeaveRequestForm({
        date: request.date,
        timePeriod: request.timePeriod || 'cả ngày',
        reason: request.reason
      });
    } else {
      // Old format - convert to new format for editing
      setLeaveRequestForm({
        date: request.startDate,
        timePeriod: request.startTimePeriod || 'cả ngày',
        reason: request.reason
      });
    }
  };

  const handleUpdateLeaveRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.put(`/leave-requests/${editingLeaveRequest.id}`, leaveRequestForm);
      setEditingLeaveRequest(null);
      setLeaveRequestForm({ date: '', timePeriod: 'cả ngày', reason: '' });
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeaveRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/leave-requests', createLeaveForm);
      setShowCreateLeaveForm(false);
      setCreateLeaveForm({ userId: '', date: '', timePeriod: 'cả ngày', reason: '' });
      fetchLeaveRequests();
      alert('Tạo đơn nghỉ phép thành công!');
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeaveRequest = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa đơn nghỉ phép này?')) {
      try {
        await api.delete(`/leave-requests/${id}`);
        fetchLeaveRequests();
      } catch (err) {
        alert(err.response?.data?.error || 'Có lỗi xảy ra');
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/leave-requests/${id}/status`, { status });
      fetchLeaveRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleAdvanceStatusChange = async (id, status) => {
    try {
      await api.patch(`/advance-requests/${id}/status`, { status });
      fetchAdvanceRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteAdvanceRequest = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa yêu cầu ứng lương này?')) {
      try {
        await api.delete(`/advance-requests/${id}`);
        fetchAdvanceRequests();
      } catch (err) {
        alert(err.response?.data?.error || 'Có lỗi xảy ra');
      }
    }
  };

  const handleEditAdvanceRequest = (request) => {
    setEditingAdvanceRequest(request);
    setAdvanceForm({
      userId: request.userId.toString(),
      amount: request.amount.toString(),
      reason: request.reason
    });
    setShowAdvanceForm(false);
  };

  const handleUpdateAdvanceRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.put(`/advance-requests/${editingAdvanceRequest.id}`, advanceForm);
      setEditingAdvanceRequest(null);
      setAdvanceForm({ userId: '', amount: '', reason: '' });
      fetchAdvanceRequests();
      alert('Cập nhật yêu cầu ứng lương thành công!');
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdvance = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/advance-requests', advanceForm);
      setShowAdvanceForm(false);
      setAdvanceForm({ userId: '', amount: '', reason: '' });
      fetchAdvanceRequests();
      fetchEmployees(); // Refresh để có danh sách nhân viên mới nhất
      alert('Tạo yêu cầu ứng lương thành công!');
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Tính số tiền thực còn (giống công thức tính lương hiện tại của nhân viên)
  const calculateRemainingSalaryForForm = (employeeId, totalSalary, advanceAmount) => {
    if (!totalSalary || totalSalary <= 0) {
      return 0;
    }

    const today = new Date();
    const [year, month] = salaryMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = today.getDate();
    
    // Kiểm tra xem tháng được chọn có phải tháng hiện tại không
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    const daysToCalculate = isCurrentMonth ? currentDay : daysInMonth;

    // Lương 1 ngày = Tổng lương / Tổng ngày trong tháng
    const dailySalary = totalSalary / daysInMonth;

    // Tính số tiền đã ứng (dùng giá trị từ form)
    const advance = parseFloat(advanceAmount) || 0;

    // Tính số ngày nghỉ trong tháng (chỉ tính đến hôm nay nếu là tháng hiện tại)
    const monthStart = new Date(year, month - 1, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0);
    monthEnd.setHours(23, 59, 59, 999);
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const endDate = isCurrentMonth ? todayStart : monthEnd;

    let leaveShifts = 0; // Tổng số ca nghỉ
    (leaveRequests || []).forEach(req => {
      if (!req || req.status !== 'approved' || !req.date || req.userId !== employeeId) return;
      
      const dateStr = req.date;
      const [reqYear, reqMonth, reqDay] = dateStr.split('-').map(Number);
      const leaveDate = new Date(reqYear, reqMonth - 1, reqDay);
      leaveDate.setHours(0, 0, 0, 0);
      
      // Chỉ tính các ngày nghỉ trong tháng được chọn và <= endDate
      if (leaveDate >= monthStart && leaveDate <= endDate) {
        const timePeriod = (req.timePeriod || 'cả ngày').toLowerCase();
        if (timePeriod === 'cả ngày') {
          leaveShifts += 2; // Nghỉ cả ngày = 2 ca
        } else if (timePeriod === 'sáng' || timePeriod === 'chiều' || 
                   timePeriod === 'ca sáng' || timePeriod === 'ca chiều') {
          leaveShifts += 1; // Nghỉ 1 ca = 1 ca
        }
      }
    });
    
    // Tính số ngày nghỉ: 2 ca = 1 ngày, 1 ca = 0.5 ngày
    const leaveDays = leaveShifts / 2;

    // Lương hiện tại = ((Tổng lương / Tổng ngày trong tháng) × Số ngày từ đầu tháng đến hôm nay) - Số tiền ứng - (Số ngày nghỉ × Lương 1 ngày)
    const leaveDeduction = leaveDays * dailySalary;
    const currentSalary = (dailySalary * daysToCalculate) - advance - leaveDeduction;

    return Math.ceil(Math.max(0, currentSalary));
  };

  const handleEditSalary = async (employee) => {
    try {
      const response = await api.get(`/users/${employee.id}/salary/${salaryMonth}`);
      const salary = response.data.salary || '';
      
      // Tính số tiền đã ứng trong tháng
      let advanceAmount = 0;
      if (advanceRequests && Array.isArray(advanceRequests)) {
        const monthStart = new Date(salaryMonth + '-01');
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        advanceAmount = advanceRequests
          .filter(req => {
            if (!req || req.userId !== employee.id || req.status !== 'approved') {
              return false;
            }
            const reqDate = new Date(req.submittedAt);
            reqDate.setHours(0, 0, 0, 0);
            return reqDate >= monthStart && reqDate <= monthEnd;
          })
          .reduce((sum, req) => sum + (req.amount || 0), 0);
      }
      
      setEditingSalary(employee);
      setSalaryForm({ salary, advanceAmount: advanceAmount || '' });
    } catch (err) {
      setEditingSalary(employee);
      setSalaryForm({ salary: '', advanceAmount: '' });
    }
  };

  const handleSetSalary = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Set lương
      await api.post(`/users/${editingSalary.id}/salary`, {
        month: salaryMonth,
        salary: parseFloat(salaryForm.salary)
      });

      // Xử lý ứng lương
      const advanceAmount = parseFloat(salaryForm.advanceAmount) || 0;
      
      // Fetch advance requests mới nhất trước khi tính toán
      const latestAdvanceResponse = await api.get('/advance-requests');
      const latestAdvanceRequests = latestAdvanceResponse.data || [];
      
      // Tính số tiền đã ứng hiện tại trong tháng
      const monthStart = new Date(salaryMonth + '-01');
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const currentAdvanceRequests = latestAdvanceRequests.filter(req => {
        if (!req || req.userId !== editingSalary.id || req.status !== 'approved') {
          return false;
        }
        const reqDate = new Date(req.submittedAt);
        reqDate.setHours(0, 0, 0, 0);
        return reqDate >= monthStart && reqDate <= monthEnd;
      });
      
      const currentAdvance = currentAdvanceRequests.reduce((sum, req) => sum + (req.amount || 0), 0);

      // Nếu số tiền mới khác số tiền cũ
      if (Math.abs(advanceAmount - currentAdvance) > 0.01) {
        // Xóa tất cả ứng lương cũ trong tháng
        for (const req of currentAdvanceRequests) {
          try {
            await api.delete(`/advance-requests/${req.id}`);
          } catch (err) {
            console.error('Error deleting advance request:', err);
          }
        }
        
        // Tạo ứng lương mới nếu số tiền > 0
        if (advanceAmount > 0) {
          await api.post('/advance-requests', {
            userId: editingSalary.id,
            amount: advanceAmount,
            reason: 'Ứng lương tháng ' + new Date(salaryMonth + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
          });
        }
      }

      // Refresh data TRƯỚC KHI đóng form để đảm bảo state được cập nhật
      await fetchAdvanceRequests();
      await fetchEmployees();
      
      // Đợi một chút để đảm bảo state được cập nhật
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setEditingSalary(null);
      setSalaryForm({ salary: '', advanceAmount: '' });
      
      alert('Đặt lương thành công!');
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      default: return '#ff9800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return 'Chờ duyệt';
    }
  };

  // Check if employee is on leave for a specific date and shift
  const getEmployeeLeaveStatus = (employeeId, checkDate) => {
    const approvedRequests = leaveRequests.filter(
      req => req.userId === employeeId && req.status === 'approved'
    );

    let morningLeave = false;
    let afternoonLeave = false;

    for (const request of approvedRequests) {
      // New format: single date
      if (request.date) {
        const requestDate = new Date(request.date).toISOString().split('T')[0];
        if (requestDate === checkDate) {
          const timePeriod = request.timePeriod || 'cả ngày';
          if (timePeriod === 'cả ngày' || timePeriod === 'sáng') {
            morningLeave = true;
          }
          if (timePeriod === 'cả ngày' || timePeriod === 'chiều') {
            afternoonLeave = true;
          }
        }
      }
      // Old format: date range
      if (request.startDate && request.endDate) {
        const startDate = new Date(request.startDate).toISOString().split('T')[0];
        const endDate = new Date(request.endDate).toISOString().split('T')[0];
        if (checkDate >= startDate && checkDate <= endDate) {
          // For old format, check startTimePeriod and endTimePeriod
          const startPeriod = request.startTimePeriod || 'cả ngày';
          const endPeriod = request.endTimePeriod || 'cả ngày';
          
          // If it's the start date, use startPeriod
          if (checkDate === startDate) {
            if (startPeriod === 'cả ngày' || startPeriod === 'sáng') {
              morningLeave = true;
            }
            if (startPeriod === 'cả ngày' || startPeriod === 'chiều') {
              afternoonLeave = true;
            }
          }
          // If it's the end date, use endPeriod
          else if (checkDate === endDate) {
            if (endPeriod === 'cả ngày' || endPeriod === 'sáng') {
              morningLeave = true;
            }
            if (endPeriod === 'cả ngày' || endPeriod === 'chiều') {
              afternoonLeave = true;
            }
          }
          // If it's in between, assume cả ngày
          else {
            morningLeave = true;
            afternoonLeave = true;
          }
        }
      }
    }

    return {
      morning: morningLeave ? 'chưa đi làm' : 'đi làm',
      afternoon: afternoonLeave ? 'chưa đi làm' : 'đi làm'
    };
  };

  // Get attendance status for all employees
  const getAttendanceStatus = () => {
    return employees
      .map(employee => {
        const leaveStatus = getEmployeeLeaveStatus(employee.id, attendanceDate);
        return {
          ...employee,
          morningStatus: leaveStatus.morning,
          afternoonStatus: leaveStatus.afternoon
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'vi')); // Sort by name
  };

  // Group employees by attendance status
  const getGroupedAttendance = () => {
    const statusList = getAttendanceStatus();
    const presentFull = []; // Đi làm cả 2 ca
    const presentMorning = []; // Đi làm ca sáng
    const presentAfternoon = []; // Đi làm ca chiều
    const absent = []; // Không đi làm

    statusList.forEach(emp => {
      const morningPresent = emp.morningStatus === 'đi làm';
      const afternoonPresent = emp.afternoonStatus === 'đi làm';
      
      if (morningPresent && afternoonPresent) {
        // Đi làm cả 2 ca
        presentFull.push(emp);
      } else if (morningPresent && !afternoonPresent) {
        // Chỉ đi làm ca sáng
        presentMorning.push(emp);
      } else if (!morningPresent && afternoonPresent) {
        // Chỉ đi làm ca chiều
        presentAfternoon.push(emp);
      } else {
        // Không đi làm cả 2 ca
        absent.push(emp);
      }
    });

    return { presentFull, presentMorning, presentAfternoon, absent };
  };

  // Get monthly attendance data
  const getMonthlyAttendance = () => {
    const [year, month] = monthlyAttendanceDate.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return employees.map(employee => {
      const dailyStatus = days.map(day => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const leaveStatus = getEmployeeLeaveStatus(employee.id, dateStr);
        return {
          day,
          morning: leaveStatus.morning === 'đi làm',
          afternoon: leaveStatus.afternoon === 'đi làm'
        };
      });
      
      return {
        ...employee,
        dailyStatus
      };
    }).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  };

  // Get attendance statistics
  const getAttendanceStats = () => {
    const statusList = getAttendanceStatus();
    const total = statusList.length;
    let morningPresent = 0;
    let morningAbsent = 0;
    let afternoonPresent = 0;
    let afternoonAbsent = 0;

    statusList.forEach(emp => {
      if (emp.morningStatus === 'đi làm') morningPresent++;
      else morningAbsent++;
      if (emp.afternoonStatus === 'đi làm') afternoonPresent++;
      else afternoonAbsent++;
    });

    return {
      total,
      morningPresent,
      morningAbsent,
      afternoonPresent,
      afternoonAbsent
    };
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Xin chào, {user.name}</h1>
          <p>Quản lý</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Đăng xuất
        </button>
      </header>

      <div className="dashboard-content">
        <div className="tabs">
          <button
            className={activeTab === 'leave-requests' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('leave-requests')}
          >
            Đơn nghỉ phép
          </button>
          <button
            className={activeTab === 'employees' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('employees')}
          >
            Quản lý nhân viên
          </button>
          <button
            className={activeTab === 'attendance' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('attendance')}
          >
            Điểm danh
          </button>
          <button
            className={activeTab === 'monthly-attendance' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('monthly-attendance')}
          >
            Điểm danh tháng
          </button>
          <button
            className={activeTab === 'salary' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('salary')}
          >
            Quản lý lương
          </button>
          <button
            className={activeTab === 'advance-salary' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('advance-salary')}
          >
            Ứng lương
          </button>
        </div>

        {activeTab === 'leave-requests' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Tất cả đơn nghỉ phép</h2>
              <button 
                onClick={() => setShowCreateLeaveForm(!showCreateLeaveForm)} 
                className="primary-button"
              >
                {showCreateLeaveForm ? 'Hủy' : '+ Tạo đơn nghỉ phép cho nhân viên'}
              </button>
            </div>

            {showCreateLeaveForm && (
              <form onSubmit={handleCreateLeaveRequest} className="leave-form" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Tạo đơn nghỉ phép cho nhân viên</h3>
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                  <label>Chọn nhân viên</label>
                  <select
                    value={createLeaveForm.userId}
                    onChange={(e) => setCreateLeaveForm({ ...createLeaveForm, userId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày nghỉ</label>
                    <input
                      type="date"
                      value={createLeaveForm.date}
                      onChange={(e) => setCreateLeaveForm({ ...createLeaveForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ca nghỉ</label>
                    <select
                      value={createLeaveForm.timePeriod}
                      onChange={(e) => setCreateLeaveForm({ ...createLeaveForm, timePeriod: e.target.value })}
                      required
                    >
                      <option value="cả ngày">Cả ngày</option>
                      <option value="sáng">Sáng</option>
                      <option value="chiều">Chiều</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Lý do</label>
                  <textarea
                    value={createLeaveForm.reason}
                    onChange={(e) => setCreateLeaveForm({ ...createLeaveForm, reason: e.target.value })}
                    rows="4"
                    placeholder="Nhập lý do nghỉ phép (không bắt buộc)..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={loading} className="primary-button">
                    {loading ? 'Đang tạo...' : 'Tạo đơn nghỉ phép'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCreateLeaveForm(false);
                      setCreateLeaveForm({ userId: '', date: '', timePeriod: 'cả ngày', reason: '' });
                      setError('');
                    }} 
                    className="logout-button"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {editingLeaveRequest && (
              <form onSubmit={handleUpdateLeaveRequest} className="leave-form" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Chỉnh sửa đơn nghỉ phép: {editingLeaveRequest.userName}</h3>
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày nghỉ</label>
                    <input
                      type="date"
                      value={leaveRequestForm.date}
                      onChange={(e) => setLeaveRequestForm({ ...leaveRequestForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Ca nghỉ</label>
                    <select
                      value={leaveRequestForm.timePeriod}
                      onChange={(e) => setLeaveRequestForm({ ...leaveRequestForm, timePeriod: e.target.value })}
                      required
                    >
                      <option value="cả ngày">Cả ngày</option>
                      <option value="sáng">Sáng</option>
                      <option value="chiều">Chiều</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Lý do</label>
                  <textarea
                    value={leaveRequestForm.reason}
                    onChange={(e) => setLeaveRequestForm({ ...leaveRequestForm, reason: e.target.value })}
                    rows="4"
                    placeholder="Nhập lý do nghỉ phép (không bắt buộc)..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={loading} className="primary-button">
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingLeaveRequest(null);
                      setLeaveRequestForm({ date: '', timePeriod: 'cả ngày', reason: '' });
                      setError('');
                    }} 
                    className="logout-button"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* Bộ lọc */}
            <div style={{ 
              background: '#f9f9f9', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#333' }}>Bộ lọc</h3>
              <div className="form-row" style={{ marginBottom: '0' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Nhân viên</label>
                  <select
                    value={leaveRequestFilters.employeeId}
                    onChange={(e) => setLeaveRequestFilters({ ...leaveRequestFilters, employeeId: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="">Tất cả nhân viên</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Trạng thái</label>
                  <select
                    value={leaveRequestFilters.status}
                    onChange={(e) => setLeaveRequestFilters({ ...leaveRequestFilters, status: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Tháng</label>
                  <input
                    type="month"
                    value={leaveRequestFilters.month}
                    onChange={(e) => setLeaveRequestFilters({ ...leaveRequestFilters, month: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setLeaveRequestFilters({ employeeId: '', status: '', month: '' })}
                    className="logout-button"
                    style={{ width: '100%' }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>

            <div className="requests-list">
              {(() => {
                // Lọc danh sách đơn nghỉ phép
                let filteredRequests = leaveRequests;
                
                // Lọc theo nhân viên
                if (leaveRequestFilters.employeeId) {
                  filteredRequests = filteredRequests.filter(
                    req => req.userId === parseInt(leaveRequestFilters.employeeId)
                  );
                }
                
                // Lọc theo trạng thái
                if (leaveRequestFilters.status) {
                  filteredRequests = filteredRequests.filter(
                    req => req.status === leaveRequestFilters.status
                  );
                }
                
                // Lọc theo tháng
                if (leaveRequestFilters.month) {
                  filteredRequests = filteredRequests.filter(req => {
                    const requestDate = req.date || req.startDate;
                    if (!requestDate) return false;
                    const requestMonth = requestDate.substring(0, 7); // YYYY-MM
                    return requestMonth === leaveRequestFilters.month;
                  });
                }
                
                return filteredRequests.length === 0 ? (
                  <p className="empty-message">Không có đơn nghỉ phép nào phù hợp với bộ lọc</p>
                ) : (
                  <>
                    <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
                      Hiển thị {filteredRequests.length} / {leaveRequests.length} đơn nghỉ phép
                    </p>
                    {filteredRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <div>
                        <h3>{request.userName}</h3>
                        <p className="request-date">
                          {request.date ? new Date(request.date).toLocaleDateString('vi-VN') : 
                           request.startDate ? new Date(request.startDate).toLocaleDateString('vi-VN') : ''}
                          {request.timePeriod && ` (${request.timePeriod})`}
                          {request.startTimePeriod && !request.timePeriod && ` (${request.startTimePeriod})`}
                          {request.endDate && request.startDate !== request.endDate && 
                           ` - ${new Date(request.endDate).toLocaleDateString('vi-VN')}`}
                          {request.endTimePeriod && request.startTimePeriod !== request.endTimePeriod && 
                           !request.timePeriod && ` (${request.endTimePeriod})`}
                        </p>
                      </div>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(request.status) }}
                      >
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    <p className="request-reason">{request.reason}</p>
                    <div className="request-footer">
                      <span className="request-time">
                        Gửi lúc: {new Date(request.submittedAt).toLocaleString('vi-VN')}
                      </span>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditLeaveRequest(request)}
                          className="edit-button"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteLeaveRequest(request.id)}
                          className="delete-button"
                        >
                          Xóa
                        </button>
                        {request.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusChange(request.id, 'approved')}
                            className="approve-button"
                          >
                            Duyệt
                          </button>
                        )}
                        {request.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(request.id, 'rejected')}
                            className="reject-button"
                          >
                            Từ chối
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                    ))
                  }
                </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Danh sách nhân viên</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={async () => {
                    try {
                      const response = await api.post('/users/bulk-setup');
                      alert(response.data.message);
                      fetchEmployees();
                    } catch (err) {
                      alert(err.response?.data?.error || 'Có lỗi xảy ra');
                    }
                  }} 
                  className="primary-button"
                  style={{ background: '#4caf50' }}
                >
                  Thiết lập danh sách
                </button>
                <button onClick={() => setShowEmployeeForm(!showEmployeeForm)} className="primary-button">
                  {showEmployeeForm ? 'Hủy' : '+ Tạo tài khoản nhân viên'}
                </button>
              </div>
            </div>

            {showEmployeeForm && (
              <form onSubmit={handleCreateEmployee} className="employee-form">
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên đăng nhập</label>
                    <input
                      type="text"
                      value={employeeForm.username}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })}
                      required
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mật khẩu</label>
                    <input
                      type="password"
                      value={employeeForm.password}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                      required
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Họ tên</label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    required
                    placeholder="Nhập họ tên"
                  />
                </div>

                <button type="submit" disabled={loading} className="primary-button">
                  {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </form>
            )}

            {editingEmployee && (
              <form onSubmit={handleUpdateEmployee} className="employee-form" style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Chỉnh sửa nhân viên: {editingEmployee.name}</h3>
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ tên</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      placeholder="Nhập họ tên"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên đăng nhập</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      required
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={loading} className="primary-button">
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingEmployee(null);
                      setEditForm({ name: '', username: '' });
                      setError('');
                    }} 
                    className="logout-button"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            <div className="employees-list">
              {employees.length === 0 ? (
                <p className="empty-message">Chưa có nhân viên nào</p>
              ) : (
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Tên đăng nhập</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.name}</td>
                        <td>{employee.username}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleEditEmployee(employee)}
                              className="edit-button"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleResetPassword(employee.id, employee.name)}
                              className="primary-button"
                              style={{ background: '#FF9800', fontSize: '14px', padding: '8px 16px' }}
                            >
                              Đặt lại mật khẩu
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="delete-button"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Điểm danh nhân viên</h2>
              <div className="attendance-date-picker">
                <label>Chọn ngày: </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
            
            {employees.length > 0 && (() => {
              const stats = getAttendanceStats();
              return (
                <div className="attendance-stats">
                  <div className="stat-card">
                    <div className="stat-label">Tổng số nhân viên</div>
                    <div className="stat-value">{stats.total}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Ca sáng - Đi làm</div>
                    <div className="stat-value present-stat">{stats.morningPresent}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Ca sáng - Nghỉ</div>
                    <div className="stat-value absent-stat">{stats.morningAbsent}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Ca chiều - Đi làm</div>
                    <div className="stat-value present-stat">{stats.afternoonPresent}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Ca chiều - Nghỉ</div>
                    <div className="stat-value absent-stat">{stats.afternoonAbsent}</div>
                  </div>
                </div>
              );
            })()}

            <div className="attendance-list">
              {employees.length === 0 ? (
                <p className="empty-message">Chưa có nhân viên nào</p>
              ) : (() => {
                const { presentFull, presentMorning, presentAfternoon, absent } = getGroupedAttendance();
                return (
                  <div className="attendance-four-columns">
                    <div className="attendance-column present-full-column">
                      <h3 className="column-title">Đi làm</h3>
                      <div className="employee-name-list">
                        {presentFull.length === 0 ? (
                          <p className="empty-column">Không có</p>
                        ) : (
                          presentFull.map((employee) => (
                            <div key={employee.id} className="employee-name-item">
                              {employee.name}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="attendance-column present-morning-column">
                      <h3 className="column-title">Đi làm ca sáng</h3>
                      <div className="employee-name-list">
                        {presentMorning.length === 0 ? (
                          <p className="empty-column">Không có</p>
                        ) : (
                          presentMorning.map((employee) => (
                            <div key={employee.id} className="employee-name-item">
                              {employee.name}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="attendance-column present-afternoon-column">
                      <h3 className="column-title">Đi làm ca chiều</h3>
                      <div className="employee-name-list">
                        {presentAfternoon.length === 0 ? (
                          <p className="empty-column">Không có</p>
                        ) : (
                          presentAfternoon.map((employee) => (
                            <div key={employee.id} className="employee-name-item">
                              {employee.name}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="attendance-column absent-column">
                      <h3 className="column-title">Không đi làm</h3>
                      <div className="employee-name-list">
                        {absent.length === 0 ? (
                          <p className="empty-column">Không có</p>
                        ) : (
                          absent.map((employee) => (
                            <div key={employee.id} className="employee-name-item">
                              {employee.name}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'monthly-attendance' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Điểm danh tháng</h2>
              <div className="attendance-date-picker">
                <label>Chọn tháng: </label>
                <input
                  type="month"
                  value={monthlyAttendanceDate}
                  onChange={(e) => setMonthlyAttendanceDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
            
            <div className="monthly-attendance-container">
              {employees.length === 0 ? (
                <p className="empty-message">Chưa có nhân viên nào</p>
              ) : (
                <div className="monthly-table-wrapper">
                  <table className="monthly-attendance-table">
                    <thead>
                      <tr>
                        <th className="sticky-col">Tên nhân viên</th>
                        {Array.from({ length: new Date(monthlyAttendanceDate.split('-')[0], monthlyAttendanceDate.split('-')[1], 0).getDate() }, (_, i) => i + 1).map(day => (
                          <th key={day} className="day-header">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getMonthlyAttendance().map((employee) => (
                        <tr key={employee.id}>
                          <td className="sticky-col employee-name-cell">{employee.name}</td>
                          {employee.dailyStatus.map((status, idx) => (
                            <td key={idx} className="day-cell">
                              <div className="day-status">
                                <span className={`status-dot ${status.morning ? 'present' : 'absent'}`} title="Ca sáng"></span>
                                <span className={`status-dot ${status.afternoon ? 'present' : 'absent'}`} title="Ca chiều"></span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'salary' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Quản lý lương nhân viên</h2>
              <div className="attendance-date-picker">
                <label>Chọn tháng: </label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => {
                    setSalaryMonth(e.target.value);
                    setEditingSalary(null);
                    setSalaryForm({ salary: '', advanceAmount: '' });
                    setShowAdvanceForm(false);
                  }}
                  className="date-input"
                />
              </div>
            </div>

            {editingSalary && (
              <form onSubmit={handleSetSalary} className="leave-form" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Đặt lương cho {editingSalary.name} - Tháng {new Date(salaryMonth + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h3>
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Tổng lương (VNĐ)</label>
                    <input
                      type="number"
                      value={salaryForm.salary}
                      onChange={(e) => setSalaryForm({ ...salaryForm, salary: e.target.value })}
                      required
                      min="0"
                      step="1000"
                      placeholder="Nhập lương (ví dụ: 5000000)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số tiền đã ứng (VNĐ)</label>
                    <input
                      type="number"
                      value={salaryForm.advanceAmount}
                      onChange={(e) => setSalaryForm({ ...salaryForm, advanceAmount: e.target.value })}
                      min="0"
                      step="1000"
                      placeholder="Nhập số tiền đã ứng (ví dụ: 2000000)"
                    />
                  </div>
                </div>

                {salaryForm.salary && editingSalary && (
                  <div style={{ 
                    padding: '12px', 
                    background: '#e3f2fd', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: '1px solid #2196F3'
                  }}>
                    <strong>Thực còn: </strong>
                    <span style={{ 
                      color: '#2196F3', 
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {new Intl.NumberFormat('vi-VN').format(
                        calculateRemainingSalaryForForm(
                          editingSalary.id, 
                          parseFloat(salaryForm.salary) || 0, 
                          salaryForm.advanceAmount || 0
                        )
                      )} VNĐ
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={loading} className="primary-button">
                    {loading ? 'Đang lưu...' : 'Lưu lương'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingSalary(null);
                      setSalaryForm({ salary: '', advanceAmount: '' });
                      setError('');
                    }} 
                    className="logout-button"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            <SalaryTable 
              key={`salary-${salaryMonth}-${Array.isArray(advanceRequests) ? advanceRequests.length : 0}-${Array.isArray(advanceRequests) ? advanceRequests.reduce((sum, r) => sum + (r?.id || 0), 0) : 0}`}
              employees={employees} 
              salaryMonth={salaryMonth} 
              onEditSalary={handleEditSalary}
              advanceRequests={advanceRequests}
              leaveRequests={leaveRequests}
            />
          </div>
        )}

        {activeTab === 'advance-salary' && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Quản lý ứng lương</h2>
              <button 
                onClick={() => {
                  setShowAdvanceForm(!showAdvanceForm);
                  setEditingAdvanceRequest(null);
                  setAdvanceForm({ userId: '', amount: '', reason: '' });
                }} 
                className="primary-button"
              >
                {showAdvanceForm ? 'Hủy' : '+ Tạo ứng lương'}
              </button>
            </div>

            {showAdvanceForm && !editingAdvanceRequest && (
              <form onSubmit={handleCreateAdvance} className="leave-form" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Tạo ứng lương cho nhân viên</h3>
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                  <label>Chọn nhân viên</label>
                  <select
                    value={advanceForm.userId}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, userId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Số tiền ứng (VNĐ)</label>
                  <input
                    type="number"
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    required
                    min="1000"
                    step="1000"
                    placeholder="Nhập số tiền ứng (ví dụ: 1000000)"
                  />
                </div>

                <div className="form-group">
                  <label>Lý do</label>
                  <textarea
                    value={advanceForm.reason}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                    rows="4"
                    placeholder="Nhập lý do ứng lương (không bắt buộc)..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={loading} className="primary-button">
                    {loading ? 'Đang tạo...' : 'Tạo ứng lương'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowAdvanceForm(false);
                      setAdvanceForm({ userId: '', amount: '', reason: '' });
                      setError('');
                    }} 
                    className="logout-button"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {editingAdvanceRequest && (
              <form onSubmit={handleUpdateAdvanceRequest} className="leave-form" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Sửa ứng lương: {editingAdvanceRequest.userName}</h3>
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                  <label>Chọn nhân viên</label>
                  <select
                    value={advanceForm.userId}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, userId: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Số tiền ứng (VNĐ)</label>
                  <input
                    type="number"
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    required
                    min="1000"
                    step="1000"
                    placeholder="Nhập số tiền ứng (ví dụ: 1000000)"
                  />
                </div>

                <div className="form-group">
                  <label>Lý do</label>
                  <textarea
                    value={advanceForm.reason}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                    rows="4"
                    placeholder="Nhập lý do ứng lương (không bắt buộc)..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" disabled={loading} className="primary-button">
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingAdvanceRequest(null);
                      setAdvanceForm({ userId: '', amount: '', reason: '' });
                      setError('');
                    }} 
                    className="logout-button"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* Bộ lọc */}
            <div style={{ 
              background: '#f9f9f9', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              marginTop: '20px',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#333' }}>Bộ lọc</h3>
              <div className="form-row" style={{ marginBottom: '0' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label>Nhân viên</label>
                  <select
                    value={advanceRequestFilter.employeeId}
                    onChange={(e) => setAdvanceRequestFilter({ employeeId: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="">Tất cả nhân viên</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '0', display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setAdvanceRequestFilter({ employeeId: '' })}
                    className="logout-button"
                    style={{ width: '100%' }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Lịch sử ứng lương</h3>
              {(() => {
                // Lọc danh sách ứng lương
                let filteredRequests = advanceRequests;
                
                // Lọc theo nhân viên
                if (advanceRequestFilter.employeeId) {
                  filteredRequests = filteredRequests.filter(
                    req => req.userId === parseInt(advanceRequestFilter.employeeId)
                  );
                }
                
                return filteredRequests.length === 0 ? (
                  <p className="empty-message">Không có yêu cầu ứng lương nào phù hợp với bộ lọc</p>
                ) : (
                  <>
                    <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
                      Hiển thị {filteredRequests.length} / {advanceRequests.length} yêu cầu ứng lương
                    </p>
                    <table className="employees-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Thời gian</th>
                          <th>Nhân viên</th>
                          <th>Số tiền</th>
                          <th>Lý do</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests
                          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                          .map((request) => (
                        <tr key={request.id}>
                          <td>{new Date(request.submittedAt).toLocaleString('vi-VN')}</td>
                          <td>{request.userName}</td>
                          <td style={{ fontWeight: '600', color: '#2563eb' }}>
                            {new Intl.NumberFormat('vi-VN').format(request.amount)} VNĐ
                          </td>
                          <td>{request.reason}</td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{ 
                                backgroundColor: getStatusColor(request.status),
                                padding: '4px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: 'white'
                              }}
                            >
                              {getStatusText(request.status)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleEditAdvanceRequest(request)}
                                className="edit-button"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteAdvanceRequest(request.id)}
                                className="delete-button"
                              >
                                Xóa
                              </button>
                              {request.status !== 'approved' && (
                                <button
                                  onClick={() => handleAdvanceStatusChange(request.id, 'approved')}
                                  className="approve-button"
                                >
                                  Duyệt
                                </button>
                              )}
                              {request.status !== 'rejected' && (
                                <button
                                  onClick={() => handleAdvanceStatusChange(request.id, 'rejected')}
                                  className="reject-button"
                                >
                                  Từ chối
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f9f9f9', fontWeight: 'bold' }}>
                          <td colSpan="2">Tổng đã ứng (đã duyệt):</td>
                          <td style={{ color: '#2563eb', fontSize: '16px' }}>
                            {new Intl.NumberFormat('vi-VN').format(
                              filteredRequests
                                .filter(req => req.status === 'approved')
                                .reduce((sum, req) => sum + (req.amount || 0), 0)
                            )} VNĐ
                          </td>
                          <td colSpan="3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Salary Table Component
function SalaryTable({ employees, salaryMonth, onEditSalary, advanceRequests = [], leaveRequests = [] }) {
  const [salaries, setSalaries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalaries = async () => {
      const salaryData = {};
      for (const employee of employees) {
        try {
          const response = await api.get(`/users/${employee.id}/salary/${salaryMonth}`);
          salaryData[employee.id] = response.data.salary;
        } catch (err) {
          salaryData[employee.id] = null;
        }
      }
      setSalaries(salaryData);
      setLoading(false);
    };

    if (employees.length > 0) {
      fetchSalaries();
    } else {
      setLoading(false);
    }
  }, [employees, salaryMonth, advanceRequests]);

  // Tính số tiền đã ứng cho mỗi nhân viên trong tháng
  const getAdvanceAmount = (employeeId) => {
    if (!advanceRequests || !Array.isArray(advanceRequests)) {
      return 0;
    }
    
    const monthStart = new Date(salaryMonth + '-01');
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    return advanceRequests
      .filter(req => {
        if (!req || req.userId !== employeeId || req.status !== 'approved') {
          return false;
        }
        const reqDate = new Date(req.submittedAt);
        reqDate.setHours(0, 0, 0, 0);
        return reqDate >= monthStart && reqDate <= monthEnd;
      })
      .reduce((sum, req) => sum + (req.amount || 0), 0);
  };

  // Tính số tiền thực còn (giống công thức tính lương hiện tại của nhân viên)
  const calculateRemainingSalary = (employeeId, totalSalary) => {
    if (!totalSalary || totalSalary <= 0) {
      return 0;
    }

    const today = new Date();
    const [year, month] = salaryMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = today.getDate();
    
    // Kiểm tra xem tháng được chọn có phải tháng hiện tại không
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    const daysToCalculate = isCurrentMonth ? currentDay : daysInMonth;

    // Lương 1 ngày = Tổng lương / Tổng ngày trong tháng
    const dailySalary = totalSalary / daysInMonth;

    // Tính số tiền đã ứng trong tháng
    const advanceAmount = getAdvanceAmount(employeeId);

    // Tính số ngày nghỉ trong tháng (chỉ tính đến hôm nay nếu là tháng hiện tại)
    const monthStart = new Date(year, month - 1, 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0);
    monthEnd.setHours(23, 59, 59, 999);
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const endDate = isCurrentMonth ? todayStart : monthEnd;

    let leaveShifts = 0; // Tổng số ca nghỉ
    (leaveRequests || []).forEach(req => {
      if (!req || req.status !== 'approved' || !req.date || req.userId !== employeeId) return;
      
      const dateStr = req.date;
      const [reqYear, reqMonth, reqDay] = dateStr.split('-').map(Number);
      const leaveDate = new Date(reqYear, reqMonth - 1, reqDay);
      leaveDate.setHours(0, 0, 0, 0);
      
      // Chỉ tính các ngày nghỉ trong tháng được chọn và <= endDate
      if (leaveDate >= monthStart && leaveDate <= endDate) {
        const timePeriod = (req.timePeriod || 'cả ngày').toLowerCase();
        if (timePeriod === 'cả ngày') {
          leaveShifts += 2; // Nghỉ cả ngày = 2 ca
        } else if (timePeriod === 'sáng' || timePeriod === 'chiều' || 
                   timePeriod === 'ca sáng' || timePeriod === 'ca chiều') {
          leaveShifts += 1; // Nghỉ 1 ca = 1 ca
        }
      }
    });
    
    // Tính số ngày nghỉ: 2 ca = 1 ngày, 1 ca = 0.5 ngày
    const leaveDays = leaveShifts / 2;

    // Lương hiện tại = ((Tổng lương / Tổng ngày trong tháng) × Số ngày từ đầu tháng đến hôm nay) - Số tiền ứng - (Số ngày nghỉ × Lương 1 ngày)
    const leaveDeduction = leaveDays * dailySalary;
    const currentSalary = (dailySalary * daysToCalculate) - advanceAmount - leaveDeduction;

    return Math.ceil(Math.max(0, currentSalary));
  };

  if (loading) {
    return <p className="empty-message">Đang tải...</p>;
  }

  if (employees.length === 0) {
    return <p className="empty-message">Chưa có nhân viên nào</p>;
  }

  return (
    <table className="employees-table">
      <thead>
        <tr>
          <th>Họ tên</th>
          <th>Tên đăng nhập</th>
          <th>Tổng lương</th>
          <th>Số tiền đã ứng</th>
          <th>Thực còn</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee) => {
          const salary = salaries[employee.id] || 0;
          const advanceAmount = getAdvanceAmount(employee.id);
          const remaining = calculateRemainingSalary(employee.id, salary);
          
          return (
            <tr key={employee.id}>
              <td>{employee.name}</td>
              <td>{employee.username}</td>
              <td>
                {salary > 0 ? (
                  <span style={{ color: '#4caf50', fontWeight: '600' }}>
                    {new Intl.NumberFormat('vi-VN').format(salary)} VNĐ
                  </span>
                ) : (
                  <span style={{ color: '#999', fontStyle: 'italic' }}>Chưa đặt lương</span>
                )}
              </td>
              <td>
                <span style={{ color: '#ff9800', fontWeight: '600' }}>
                  {new Intl.NumberFormat('vi-VN').format(advanceAmount)} VNĐ
                </span>
              </td>
              <td>
                <span style={{ 
                  color: remaining >= 0 ? '#2196F3' : '#f44336', 
                  fontWeight: '600' 
                }}>
                  {new Intl.NumberFormat('vi-VN').format(remaining)} VNĐ
                </span>
              </td>
              <td>
                <button
                  onClick={() => onEditSalary(employee)}
                  className="edit-button"
                >
                  {salary > 0 ? 'Sửa lương' : 'Đặt lương'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default ManagerDashboard;

