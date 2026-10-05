POPOPHONE REPAIR 17.10
Cơ sở: REPAIR-main (14).zip. Frontend và QuanLy.gs cùng 17.10; Sale.gs giữ nguyên.
- KT nhận dùng dữ liệu snapshot, không gọi API để mở form.
- Chi tiết hiện thông tin đơn ngay; lịch sử tải nền, không chặn mở cửa sổ.
- Tối đa 3 chi tiết mỗi batch tải trước. Tránh đọc cả sheet khi các đơn nằm rải rác.
- getDetail quản lý dùng luồng đọc chi tiết vận hành, không đọc vật tư/doanh thu.
- Lưu nhận máy chỉ ghi cache một đơn, không giải nén/nén toàn bộ danh sách dưới khóa ghi. Cache thiếu sẽ đọc lại DATA để bảo đảm đúng.
- Bỏ Code.gs cũ trùng router và các file preview/mock/backup không dùng.
Đọc HUONG_DAN_DEPLOY.txt trước khi cập nhật.
