# USE CASE SPECIFICATION

# Dự án: EcoSchedule – Hệ thống hỗ trợ quản lý lịch thu gom rác

---

# 1. Danh sách Actor

## 1.1 Resident (Người dân)

Người sử dụng hệ thống để theo dõi lịch thu gom rác và nhận thông báo.

## 1.2 Administrator (Quản trị viên)

Người quản lý dữ liệu, lịch thu gom và hoạt động của hệ thống.

---

# 2. Danh sách Use Case

| ID    | Use Case                   | Actor         |
| ----- | -------------------------- | ------------- |
| UC-01 | Đăng ký tài khoản          | Resident      |
| UC-02 | Đăng nhập hệ thống         | Resident      |
| UC-03 | Xem lịch thu gom           | Resident      |
| UC-04 | Xem thông báo              | Resident      |
| UC-05 | Cập nhật thông tin cá nhân | Resident      |
| UC-06 | Quản lý người dùng         | Administrator |
| UC-07 | Tạo lịch thu gom           | Administrator |
| UC-08 | Chỉnh sửa lịch thu gom     | Administrator |
| UC-09 | Xóa lịch thu gom           | Administrator |
| UC-10 | Gửi thông báo              | Administrator |

---

# UC-01: Đăng ký tài khoản

### Mục đích

Cho phép người dân tạo tài khoản mới để sử dụng hệ thống.

### Actor

Resident

### Điều kiện tiên quyết

Người dùng chưa có tài khoản.

### Luồng chính

1. Người dùng chọn chức năng "Đăng ký".
2. Hệ thống hiển thị biểu mẫu đăng ký.
3. Người dùng nhập thông tin cá nhân.
4. Người dùng nhấn nút "Đăng ký".
5. Hệ thống kiểm tra dữ liệu.
6. Hệ thống tạo tài khoản mới.
7. Hệ thống thông báo đăng ký thành công.

### Luồng ngoại lệ

* Email đã tồn tại.
* Thiếu thông tin bắt buộc.
* Mật khẩu không hợp lệ.

### Điều kiện sau

Tài khoản mới được tạo thành công.

---

# UC-02: Đăng nhập hệ thống

### Mục đích

Cho phép người dùng truy cập hệ thống.

### Actor

Resident

### Điều kiện tiên quyết

Người dùng đã có tài khoản.

### Luồng chính

1. Người dùng nhập email.
2. Người dùng nhập mật khẩu.
3. Người dùng nhấn "Đăng nhập".
4. Hệ thống xác thực thông tin.
5. Hệ thống chuyển đến trang chủ.

### Luồng ngoại lệ

* Sai email.
* Sai mật khẩu.
* Tài khoản bị khóa.

### Điều kiện sau

Người dùng đăng nhập thành công.

---

# UC-03: Xem lịch thu gom

### Mục đích

Cho phép người dân tra cứu lịch thu gom rác.

### Actor

Resident

### Điều kiện tiên quyết

Người dùng đã đăng nhập.

### Luồng chính

1. Người dùng truy cập mục "Lịch thu gom".
2. Hệ thống lấy dữ liệu lịch thu gom.
3. Hệ thống hiển thị lịch theo ngày hoặc khu vực.
4. Người dùng xem thông tin chi tiết.

### Luồng ngoại lệ

* Không có dữ liệu lịch thu gom.
* Lỗi kết nối hệ thống.

### Điều kiện sau

Người dùng xem được lịch thu gom hiện hành.

---

# UC-04: Xem thông báo

### Mục đích

Cho phép người dùng nhận các thông báo từ hệ thống.

### Actor

Resident

### Điều kiện tiên quyết

Người dùng đã đăng nhập.

### Luồng chính

1. Người dùng mở mục "Thông báo".
2. Hệ thống hiển thị danh sách thông báo.
3. Người dùng xem nội dung chi tiết.

### Luồng ngoại lệ

* Không có thông báo mới.

### Điều kiện sau

Người dùng nhận được thông tin cập nhật từ hệ thống.

---

# UC-07: Tạo lịch thu gom

### Mục đích

Cho phép quản trị viên tạo lịch thu gom mới.

### Actor

Administrator

### Điều kiện tiên quyết

Quản trị viên đã đăng nhập.

### Luồng chính

1. Quản trị viên chọn "Thêm lịch thu gom".
2. Hệ thống hiển thị biểu mẫu tạo lịch.
3. Quản trị viên nhập thông tin lịch.
4. Quản trị viên lưu dữ liệu.
5. Hệ thống xác nhận thành công.
6. Hệ thống cập nhật lịch mới.

### Luồng ngoại lệ

* Thiếu dữ liệu bắt buộc.
* Ngày giờ không hợp lệ.

### Điều kiện sau

Lịch thu gom mới được tạo thành công.

---

# UC-08: Chỉnh sửa lịch thu gom

### Mục đích

Cho phép quản trị viên cập nhật lịch thu gom.

### Actor

Administrator

### Điều kiện tiên quyết

Lịch thu gom đã tồn tại.

### Luồng chính

1. Quản trị viên chọn lịch cần chỉnh sửa.
2. Hệ thống hiển thị thông tin hiện tại.
3. Quản trị viên cập nhật dữ liệu.
4. Hệ thống lưu thay đổi.
5. Hệ thống thông báo thành công.

### Điều kiện sau

Thông tin lịch thu gom được cập nhật.

---

# UC-10: Gửi thông báo

### Mục đích

Cho phép quản trị viên gửi thông báo đến cư dân.

### Actor

Administrator

### Điều kiện tiên quyết

Quản trị viên đã đăng nhập.

### Luồng chính

1. Quản trị viên tạo nội dung thông báo.
2. Chọn nhóm người nhận.
3. Nhấn gửi thông báo.
4. Hệ thống lưu và phân phối thông báo.
5. Người dùng nhận được thông báo.

### Điều kiện sau

Thông báo được gửi thành công đến người dân.


