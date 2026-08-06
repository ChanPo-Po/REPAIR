# V12.4 CLEAN

- Bộ lọc thời gian nằm gọn trên thanh đầu, cạnh bộ lọc chi nhánh.
- Chỉ hiện đúng ô tháng/ngày/khoảng ngày đang chọn.
- Không thay đổi cấu trúc topbar gốc nên không bị bung giao diện.
- `mapHeader()` ưu tiên cột đầu tiên khi DATA có header trùng.
- `ensureSheet()` so khớp header không phân biệt hoa thường/dấu/ký tự, tránh tự tạo thêm cột trùng ở cuối.
- API vẫn đọc được header cũ qua alias và hiển thị số phiếu đã tải.
