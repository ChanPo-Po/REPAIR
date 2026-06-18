# POPOPHONE Repair V8.2 Final UX 2026

Bản này đã tối ưu lại toàn bộ UI theo vai trò:

- Sale/Public: 100% mobile, chỉ Tiếp nhận + Tra cứu, không banner thừa.
- Kỹ thuật: 100% mobile, đăng nhập vào thẳng Máy cần xử lý + Cập nhật trạng thái.
- QL cửa hàng / QL kỹ thuật / Admin: PC-first, vẫn xem được trên điện thoại bằng compact mode.
- Chi tiết phiếu làm lại gọn kiểu hồ sơ sửa chữa, có In phiếu nhận / In phiếu trả.
- Phân tích dòng máy sửa đúng logic: Dịch vụ sửa chữa → Dòng máy → Số lượng.

## Kết nối Google Sheet

1. Mở `appscript/Code.gs`.
2. Dán Spreadsheet ID vào `SHEET_ID`.
3. Deploy Web App: Execute as Me, Anyone.
4. Dán URL `/exec` vào `js/config.js` tại `API_URL`.
5. Đổi `DEMO_MODE = false`.

## File cần thay nếu đang chạy bản cũ

Nên thay nguyên source để tránh lệch UI/JS. Nếu muốn thay nhanh: `index.html`, `dashboard.html`, `css/style.css`, `js/public.js`, `js/dashboard.js`, `appscript/Code.gs`.

## V8.2 Popup & Print update
- Nút tiếp nhận đổi thành **Lưu & In phiếu nhận**.
- Sau khi lưu thành công sẽ hiện popup đẹp và tự mở/in phiếu nhận.
- Khi cập nhật trạng thái sang **8. Đã trả khách** sẽ hỏi in phiếu trả.
- Các thao tác tìm kiếm/cập nhật/lỗi API đều hiện popup rõ ràng để nhân viên biết xử lý.


## Bản schema10 all-fix
- DATA chuẩn theo header mới: Mã sửa chữa đứng cột đầu, NCC đứng trước Trạng thái thanh toán.
- Cập nhật trạng thái lưu đủ: Dịch vụ sửa chữa, Giá dự kiến, Nơi xử lý, Kỹ thuật xử lý, Trạng thái máy, Ghi chú kỹ thuật.
- Cập nhật chi phí lưu đủ: Mã bill vật tư, Tên vật tư, Giá vật tư, Công thợ, Tổng chi phí, Thực thu, Lợi nhuận, NCC, Trạng thái thanh toán.
- addService/addMaterial cũng cập nhật ngược về DATA để dashboard đo lường đúng.
