import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import api from '../services/auth';
import './Dashboard.css';

function EmployeeDashboard({ user, setUser }) {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    timePeriod: 'cả ngày',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [salaryInfo, setSalaryInfo] = useState(null);
  const [advanceRequests, setAdvanceRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaveRequests();
    fetchSalaryInfo();
    fetchAdvanceRequests();
  }, []);

  // Không cần useEffect riêng vì calculateCurrentSalary được gọi trong render

  const fetchLeaveRequests = async () => {
    try {
      const response = await api.get('/leave-requests');
      setLeaveRequests(response.data);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
    }
  };

  const fetchSalaryInfo = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      console.log('Fetching salary for month:', currentMonth);
      const response = await api.get(`/users/me/salary/${currentMonth}`);
      console.log('Salary API response:', response.data);
      const salary = response.data?.salary;
      console.log('Parsed salary:', salary);
      setSalaryInfo({
        month: currentMonth,
        totalSalary: salary && salary > 0 ? salary : 0
      });
    } catch (err) {
      console.error('Error fetching salary info:', err);
      console.error('Error response:', err.response?.data);
      const currentMonth = new Date().toISOString().slice(0, 7);
      setSalaryInfo({
        month: currentMonth,
        totalSalary: 0
      });
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

  const calculateCurrentSalary = () => {
    if (!salaryInfo || !salaryInfo.totalSalary || salaryInfo.totalSalary <= 0) {
      return null;
    }

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate(); // Số ngày từ đầu tháng đến hôm nay

    // Lương 1 ngày = Tổng lương / Tổng ngày trong tháng
    const dailySalary = salaryInfo.totalSalary / daysInMonth;

    // Tính số tiền đã ứng trong tháng
    const currentMonthStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    const monthStart = new Date(currentMonthStr + '-01');
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const advanceAmount = (advanceRequests || [])
      .filter(req => {
        if (!req || req.status !== 'approved') return false;
        const reqDate = new Date(req.submittedAt);
        reqDate.setHours(0, 0, 0, 0);
        return reqDate >= monthStart && reqDate <= monthEnd;
      })
      .reduce((sum, req) => sum + (req.amount || 0), 0);

    // Tính số ngày nghỉ trong tháng (chỉ tính đến hôm nay)
    // Logic: Đếm tổng số ca nghỉ, 2 ca = 1 ngày, 1 ca = 0.5 ngày
    let leaveShifts = 0; // Tổng số ca nghỉ
    (leaveRequests || []).forEach(req => {
      if (!req || req.status !== 'approved' || !req.date) return;
      
      // Parse date string (format: YYYY-MM-DD) thành Date object
      const dateStr = req.date;
      const [year, month, day] = dateStr.split('-').map(Number);
      const leaveDate = new Date(year, month - 1, day);
      leaveDate.setHours(0, 0, 0, 0);
      
      // Chỉ tính các ngày nghỉ trong tháng hiện tại và <= hôm nay
      if (leaveDate >= monthStart && leaveDate <= todayStart) {
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
    // Ví dụ: 1 ca = 0.5 ngày, 2 ca = 1 ngày, 3 ca = 1.5 ngày, 4 ca = 2 ngày
    // Công thức: số ngày = số ca / 2
    const leaveDays = leaveShifts / 2;

    // Lương hiện tại = ((Tổng lương / Tổng ngày trong tháng) × Số ngày từ đầu tháng đến hôm nay) - Số tiền ứng - (Số ngày nghỉ × Lương 1 ngày)
    const leaveDeduction = leaveDays * dailySalary;
    const currentSalary = (dailySalary * currentDay) - advanceAmount - leaveDeduction;

    // Lương ứng tối đa = Lương hiện tại - (4 ngày lương)
    // Lưu ý: Có thể là số âm
    const fourDaysSalary = 4 * dailySalary;
    const maxAdvanceAmount = currentSalary - fourDaysSalary;

    return {
      totalSalary: salaryInfo.totalSalary,
      daysInMonth,
      currentDay,
      dailySalary: Math.ceil(dailySalary),
      advanceAmount: Math.ceil(advanceAmount),
      leaveDays,
      leaveDeduction: Math.ceil(leaveDeduction),
      currentSalary: Math.ceil(currentSalary), // Có thể âm
      fourDaysSalary: Math.ceil(fourDaysSalary),
      maxAdvanceAmount: Math.ceil(maxAdvanceAmount) // Có thể âm
    };
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/leave-requests', formData);
      setShowForm(false);
      setFormData({ date: '', timePeriod: 'cả ngày', reason: '' });
      fetchLeaveRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Nhân viên không thể xóa đơn
  const handleDelete = async (id) => {
    alert('Bạn không có quyền xóa đơn nghỉ phép. Vui lòng liên hệ quản lý.');
  };


  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Có lỗi xảy ra');
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Xin chào, {user.name}</h1>
          <p>Nhân viên</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowChangePassword(!showChangePassword)} 
            className="primary-button"
            style={{ background: '#2196F3' }}
          >
            Đổi mật khẩu
          </button>
          <button onClick={handleLogout} className="logout-button">
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 style={{ color: 'white', margin: 0 }}>Lương tháng hiện tại</h2>
          </div>
          <div style={{ padding: '20px' }}>
            {(() => {
              const salaryCalc = calculateCurrentSalary();
              if (!salaryCalc) {
                return (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '18px', opacity: 0.9 }}>
                      Chưa có thông tin lương cho tháng này. Vui lòng liên hệ quản lý để được đặt lương.
                    </div>
                  </div>
                );
              }
              
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Tổng lương tháng</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {new Intl.NumberFormat('vi-VN').format(salaryCalc.totalSalary)} VNĐ
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Lương 1 ngày</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {new Intl.NumberFormat('vi-VN').format(Math.round(salaryCalc.dailySalary))} VNĐ
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Số ngày trong tháng (tính từ đầu tháng)</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {salaryCalc.currentDay} / {salaryCalc.daysInMonth} ngày
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Số ngày nghỉ</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                      {salaryCalc.leaveDays} ngày
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Số tiền đã ứng</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffd700' }}>
                      {new Intl.NumberFormat('vi-VN').format(salaryCalc.advanceAmount)} VNĐ
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Trừ do nghỉ</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                      -{new Intl.NumberFormat('vi-VN').format(Math.round(salaryCalc.leaveDeduction))} VNĐ
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Lương hiện tại (tính đến ngày {salaryCalc.currentDay}/{new Date().getMonth() + 1})</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: salaryCalc.currentSalary >= 0 ? '#ffd700' : '#ff6b6b' }}>
                      {new Intl.NumberFormat('vi-VN').format(Math.round(salaryCalc.currentSalary))} VNĐ
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '15px' }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>Lương ứng tối đa (Lương hiện tại - 4 ngày lương)</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: salaryCalc.maxAdvanceAmount >= 0 ? '#4ade80' : '#ff6b6b' }}>
                      {new Intl.NumberFormat('vi-VN').format(Math.round(salaryCalc.maxAdvanceAmount))} VNĐ
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
                      (Lương hiện tại: {new Intl.NumberFormat('vi-VN').format(Math.round(salaryCalc.currentSalary))} VNĐ - 
                      4 ngày lương: {new Intl.NumberFormat('vi-VN').format(Math.round(salaryCalc.fourDaysSalary))} VNĐ)
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {showChangePassword && (
          <div className="dashboard-card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h2>Đổi mật khẩu</h2>
              <button 
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setPasswordSuccess('');
                }} 
                className="logout-button"
              >
                Đóng
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="leave-form">
              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSuccess && <div style={{ background: '#d4edda', color: '#155724', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{passwordSuccess}</div>}
              
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <button type="submit" disabled={loading} className="primary-button">
                {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </form>
          </div>
        )}

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Đơn xin nghỉ phép của tôi</h2>
            <button onClick={() => setShowForm(!showForm)} className="primary-button">
              {showForm ? 'Hủy' : '+ Tạo đơn mới'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="leave-form">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày nghỉ</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ca nghỉ</label>
                  <select
                    value={formData.timePeriod}
                    onChange={(e) => setFormData({ ...formData, timePeriod: e.target.value })}
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
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="4"
                  placeholder="Nhập lý do nghỉ phép (không bắt buộc)..."
                />
              </div>

              <button type="submit" disabled={loading} className="primary-button">
                {loading ? 'Đang gửi...' : 'Gửi đơn'}
              </button>
            </form>
          )}

          <div className="requests-list">
            {leaveRequests.length === 0 ? (
              <p className="empty-message">Chưa có đơn nghỉ phép nào</p>
            ) : (
              leaveRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <div>
                      <h3>Đơn nghỉ phép</h3>
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
                    <span className="locked-badge">Đã duyệt</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;

