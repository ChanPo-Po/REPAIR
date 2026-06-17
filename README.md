# POPOPHONE Repair Center V8

## Cấu trúc chốt

### Public không đăng nhập
- Tiếp nhận sửa chữa
- Tra cứu sửa chữa

### Đăng nhập quản trị
- Kỹ thuật: Cập nhật trạng thái
- QL cửa hàng: Tổng quan, Danh sách sửa chữa, Cập nhật trạng thái. Không thấy chi phí, giá vốn, lợi nhuận, NCC.
- QL kỹ thuật: Tổng quan, Danh sách sửa chữa, Cập nhật trạng thái, Cập nhật chi phí, Vật tư.
- Admin: Full quyền.

## Dữ liệu
Sheet chính: DATA

Cột DATA:
Mã sửa chữa, IMEI, Ngày nhận, Chi nhánh nhận, Sản phẩm, Tên khách hàng, Số điện thoại, Loại dịch vụ, Tình trạng khi nhận máy, Yêu cầu sửa chữa, Ghi chú tiếp nhận, Hẹn trả, FaceID, Màn hình, Camera/Mic, Loa, Giá dự kiến, Nhân viên tiếp nhận, Tình trạng thực tế, Nơi xử lý, Kỹ thuật xử lý, Trạng thái máy, Ngày hoàn thành, Ngày bàn giao, Trễ hẹn, Ghi chú kỹ thuật, Tổng tiền dịch vụ, Tổng giá vốn vật tư, Tổng công thợ, Chi phí phát sinh, Tổng chi phí, Thực thu, Lợi nhuận, Trạng thái thanh toán, Nội dung phát sinh, Năm, Tháng, Tuần, Ngày tạo, Ngày cập nhật.

Sheet timeline: LOG_SUA_CHUA
ID, Mã sửa chữa, Thời gian, Người thực hiện, Hành động, Nội dung.

## Cách chạy demo
Mở index.html hoặc login.html. Mặc định DEMO_MODE = true nên chạy bằng localStorage, chưa cần Google Sheet.

Tài khoản mẫu:
- kythuat / 123456
- qlcuahang / 123456
- qlkythuat / 123456
- admin / 123456

## Kết nối Google Sheet
1. Mở appscript/Code.gs.
2. Dán Spreadsheet ID vào SHEET_ID.
3. Deploy Web App: Execute as Me, Anyone.
4. Copy Web App URL dán vào js/config.js tại API_URL.
5. Đổi DEMO_MODE = false.

## Ghi chú quyền
Báo giá khách được hiển thị cho QL cửa hàng qua cột Giá dự kiến / Tổng tiền dịch vụ.
Giá vốn, chi phí, lợi nhuận và NCC chỉ hiển thị với QL kỹ thuật và Admin.
