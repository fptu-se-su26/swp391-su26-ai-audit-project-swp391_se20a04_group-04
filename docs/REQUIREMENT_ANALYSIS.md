# REQUIREMENT ANALYSIS

# EcoSchedule – Hệ thống hỗ trợ quản lý lịch thu gom rác tại khu đô thị

## 1. Giới thiệu dự án

### 1.1 Tổng quan

EcoSchedule là một hệ thống web được xây dựng nhằm hỗ trợ việc quản lý và theo dõi lịch thu gom rác trong các khu đô thị, khu dân cư và khu chung cư. Hệ thống đóng vai trò là cầu nối giữa người dân và đơn vị quản lý môi trường thông qua việc cung cấp thông tin lịch thu gom, gửi thông báo nhắc nhở và hỗ trợ quản lý dữ liệu tập trung.

Trong bối cảnh đô thị hóa ngày càng phát triển, việc quản lý rác thải sinh hoạt hiệu quả là một trong những yếu tố quan trọng góp phần xây dựng môi trường sống xanh, sạch và bền vững. Tuy nhiên, nhiều khu dân cư hiện nay vẫn gặp tình trạng người dân không nắm rõ lịch thu gom hoặc không được thông báo kịp thời khi có thay đổi về thời gian thu gom.

EcoSchedule được phát triển nhằm giải quyết các vấn đề trên bằng cách số hóa quy trình quản lý lịch thu gom rác và tăng cường khả năng tiếp cận thông tin của người dân.

---

## 2. Bài toán thực tế

### 2.1 Thực trạng

Hiện nay tại nhiều khu đô thị và khu dân cư:

* Người dân thường không nhớ chính xác lịch thu gom rác.
* Thông tin thay đổi lịch thu gom chưa được truyền tải kịp thời.
* Rác thải bị đặt ngoài khu vực quy định trong thời gian dài.
* Công tác quản lý lịch thu gom còn thực hiện thủ công.
* Việc liên lạc giữa người dân và đơn vị quản lý còn hạn chế.

Những vấn đề trên gây ảnh hưởng đến mỹ quan đô thị, vệ sinh môi trường và hiệu quả vận hành của đơn vị thu gom.

### 2.2 Giải pháp đề xuất

EcoSchedule cung cấp một nền tảng trực tuyến cho phép:

* Người dân tra cứu lịch thu gom mọi lúc mọi nơi.
* Nhận thông báo trước thời gian thu gom.
* Theo dõi các thay đổi về lịch trình.
* Quản trị viên quản lý lịch thu gom tập trung trên hệ thống.
* Cập nhật thông tin nhanh chóng và chính xác đến toàn bộ người dùng.

---

## 3. Mục tiêu dự án

Dự án được xây dựng nhằm đạt được các mục tiêu sau:

### Đối với người dân

* Dễ dàng tiếp cận thông tin lịch thu gom.
* Giảm tình trạng bỏ rác sai thời điểm.
* Chủ động chuẩn bị rác trước giờ thu gom.
* Nâng cao ý thức bảo vệ môi trường.

### Đối với đơn vị quản lý

* Quản lý lịch thu gom hiệu quả hơn.
* Giảm khối lượng công việc thủ công.
* Cải thiện khả năng truyền đạt thông tin.
* Theo dõi và cập nhật lịch trình nhanh chóng.

### Đối với cộng đồng

* Giảm thiểu ô nhiễm môi trường.
* Tăng tính văn minh trong sinh hoạt đô thị.
* Xây dựng cộng đồng xanh và bền vững.

---

## 4. Đối tượng sử dụng

### 4.1 Người dân (Resident)

Là đối tượng sử dụng chính của hệ thống.

Người dân có thể:

* Đăng ký tài khoản.
* Đăng nhập hệ thống.
* Xem lịch thu gom rác.
* Nhận thông báo nhắc nhở.
* Quản lý thông tin cá nhân.

### 4.2 Quản trị viên (Administrator)

Là người quản lý và vận hành hệ thống.

Quản trị viên có thể:

* Quản lý tài khoản người dùng.
* Tạo lịch thu gom mới.
* Chỉnh sửa lịch thu gom.
* Xóa lịch thu gom.
* Gửi thông báo đến người dân.
* Theo dõi hoạt động của hệ thống.

---

## 5. Yêu cầu chức năng

### FR-01: Quản lý tài khoản

Hệ thống phải cho phép:

* Đăng ký tài khoản.
* Đăng nhập.
* Đăng xuất.
* Đổi mật khẩu.
* Cập nhật thông tin cá nhân.

### FR-02: Quản lý lịch thu gom

Hệ thống phải cho phép:

* Xem danh sách lịch thu gom.
* Tìm kiếm lịch thu gom.
* Thêm lịch thu gom mới.
* Chỉnh sửa lịch thu gom.
* Xóa lịch thu gom.

### FR-03: Quản lý thông báo

Hệ thống phải cho phép:

* Gửi thông báo nhắc lịch thu gom.
* Gửi thông báo thay đổi lịch.
* Hiển thị thông báo cho người dùng.

### FR-04: Quản lý người dùng

Quản trị viên có thể:

* Xem danh sách người dùng.
* Cập nhật thông tin người dùng.
* Khóa hoặc mở khóa tài khoản.

### FR-05: Quản trị hệ thống

Quản trị viên có thể:

* Theo dõi dữ liệu hệ thống.
* Quản lý các hoạt động thu gom.
* Quản lý thông tin liên quan đến môi trường.

---

## 6. Yêu cầu phi chức năng

### 6.1 Hiệu năng

* Hệ thống phải phản hồi các yêu cầu thông thường trong thời gian dưới 3 giây.
* Hỗ trợ nhiều người dùng truy cập đồng thời.

### 6.2 Bảo mật

* Người dùng phải được xác thực trước khi truy cập các chức năng riêng tư.
* Mật khẩu phải được mã hóa trước khi lưu trữ.
* Chỉ quản trị viên mới có quyền thực hiện các chức năng quản trị.

### 6.3 Khả năng sử dụng

* Giao diện đơn giản và thân thiện.
* Dễ sử dụng đối với mọi đối tượng người dùng.
* Hỗ trợ trên cả máy tính và thiết bị di động.

### 6.4 Độ tin cậy

* Hệ thống hoạt động ổn định.
* Dữ liệu được lưu trữ an toàn.
* Hạn chế tối đa mất mát dữ liệu.

---

## 7. Lợi ích kỳ vọng

Sau khi triển khai, hệ thống EcoSchedule được kỳ vọng sẽ:

* Nâng cao hiệu quả quản lý lịch thu gom rác.
* Tăng khả năng tiếp cận thông tin của người dân.
* Giảm tỷ lệ bỏ rác sai thời gian.
* Góp phần cải thiện vệ sinh môi trường đô thị.
* Tạo nền tảng cho các giải pháp đô thị thông minh trong tương lai.

---

## 8. Kết luận

EcoSchedule là một giải pháp ứng dụng công nghệ thông tin vào công tác quản lý môi trường đô thị. Hệ thống giúp kết nối người dân với đơn vị quản lý thông qua nền tảng web hiện đại, hỗ trợ quản lý lịch thu gom rác một cách hiệu quả, minh bạch và thuận tiện. Việc triển khai EcoSchedule không chỉ nâng cao chất lượng dịch vụ thu gom rác mà còn góp phần xây dựng môi trường sống văn minh, xanh và bền vững.
