# Hệ thống quản lý nghỉ phép

Website quản lý nghỉ phép với phân quyền nhân viên và quản lý.

## Tính năng

### Nhân viên
- Đăng nhập vào hệ thống
- Tạo đơn xin nghỉ phép (nghỉ phép, nghỉ ốm, nghỉ việc riêng, nghỉ không lương)
- Xem danh sách đơn nghỉ phép của mình
- **Không thể sửa hoặc xóa đơn đã gửi** (đã được khóa)

### Quản lý
- Đăng nhập vào hệ thống
- Tạo tài khoản cho nhân viên mới
- Xem danh sách tất cả nhân viên
- Xóa nhân viên
- Xem tất cả đơn nghỉ phép
- Duyệt hoặc từ chối đơn nghỉ phép

## Công nghệ sử dụng

- **Frontend**: React 18, React Router
- **Backend**: Node.js, Express
- **Authentication**: JWT (JSON Web Token)
- **Database**: JSON file (đơn giản, dễ sử dụng)

## Cài đặt

### Yêu cầu
- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn

### Các bước cài đặt

1. **Cài đặt tất cả dependencies:**
   ```bash
   npm run install-all
   ```

   Hoặc cài đặt từng phần:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Chạy ứng dụng:**

   Chạy cả frontend và backend cùng lúc:
   ```bash
   npm run dev
   ```

   Hoặc chạy riêng biệt:
   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

3. **Truy cập ứng dụng:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:5000
   
   **Lưu ý:** Nếu port 3001 cũng bị chiếm, bạn có thể:
   - Đóng ứng dụng đang chạy trên port 3000/3001
   - Hoặc thay đổi port trong file `client/.env` (PORT=3002, 3003, ...)

## Tài khoản mặc định

- **Quản lý:**
  - Tên đăng nhập: `admin`
  - Mật khẩu: `admin123`

## Cấu trúc dự án

```
HTTDD/
├── client/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Các component React
│   │   ├── services/       # API services
│   │   └── App.js
│   └── package.json
├── server/                 # Backend Express
│   ├── index.js           # Server chính
│   ├── database.json      # Database (tự động tạo)
│   └── package.json
└── package.json           # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/login` - Đăng nhập
- `GET /api/me` - Lấy thông tin user hiện tại

### Users (Manager only)
- `GET /api/users` - Lấy danh sách users
- `POST /api/users` - Tạo user mới
- `DELETE /api/users/:id` - Xóa user

### Leave Requests
- `GET /api/leave-requests` - Lấy danh sách đơn nghỉ phép
- `POST /api/leave-requests` - Tạo đơn nghỉ phép mới
- `GET /api/leave-requests/:id` - Lấy chi tiết đơn
- `PUT /api/leave-requests/:id` - Cập nhật đơn (chỉ khi canEdit = true)
- `DELETE /api/leave-requests/:id` - Xóa đơn (chỉ khi canEdit = true)
- `PATCH /api/leave-requests/:id/status` - Duyệt/từ chối đơn (Manager only)

## Lưu ý

- Database được lưu trong file `server/database.json` (tự động tạo khi chạy lần đầu)
- JWT secret key mặc định là `'your-secret-key-change-in-production'` - nên thay đổi trong môi trường production
- Đơn nghỉ phép sẽ tự động bị khóa (canEdit = false) sau khi được duyệt/từ chối

## Phát triển thêm

Có thể mở rộng thêm các tính năng:
- Phân quyền chi tiết hơn
- Thống kê và báo cáo
- Gửi email thông báo
- Lịch nghỉ phép
- Export dữ liệu ra Excel/PDF

