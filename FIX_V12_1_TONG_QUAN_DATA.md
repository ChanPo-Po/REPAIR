# V12.1 – Sửa Tổng quan trắng và thêm lọc thời gian

- Đã đổi `SHEET_ID` sang file DATA chính: `1ZsLoZF4hVBpSrbna0sZQ-lg9KNI-TkwuUYmiJP885mo`.
- Tổng quan mặc định hiển thị **tất cả dữ liệu**, không khóa cứng vào tháng hiện tại.
- Thêm bộ lọc: tất cả dữ liệu, theo tháng, theo ngày, khoảng ngày và chi nhánh.
- API đọc được cả header cũ như `CN nhận`, `Kỹ thuật`, `Trạng thái` và header chuẩn mới.
- Frontend dùng `getDashboard.rows` làm nguồn dự phòng nếu action `list` bị lỗi/rỗng.
- Hiển thị số phiếu DATA đã tải hoặc thông báo lỗi cụ thể.

## Khi đưa lên chạy
1. Dán lại toàn bộ `appscript/Code.gs` vào Apps Script và **Deploy phiên bản mới**.
2. Nếu URL Web App mới thay đổi, cập nhật `API_URL` trong `js/config.js`.
3. Đẩy lại toàn bộ thư mục web lên Netlify.
4. Đăng xuất/đăng nhập lại để lấy session mới.
