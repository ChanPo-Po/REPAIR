# POPOPHONE REPAIR — BẢN ỔN ĐỊNH NHIỀU NGƯỜI DÙNG V2

## Đã nâng cấp

- Khóa nút khi đang lưu ở form tiếp nhận, cập nhật trạng thái, chi phí, công thợ và máy gửi xử lý.
- Apps Script dùng `LockService` để các thao tác ghi không chạy chồng nhau.
- Mỗi bill tiếp nhận có thêm `Mã yêu cầu web` trong DATA, giúp lần gửi lại sau timeout vẫn trả đúng bill cũ.
- Mã yêu cầu đang lưu được giữ trên trình duyệt tối đa 6 giờ, kể cả tải lại trang.
- Phiên đăng nhập lưu bằng Script Properties và cache, tránh bị mất phiên ngẫu nhiên khi cache bị giải phóng.
- Public API chỉ trả danh mục cần cho form; không trả NCC, vật tư hoặc bảng hoa hồng.
- Mở chi tiết một bill chỉ đọc đúng dòng bill đó, không đọc lại toàn bộ DATA.
- Cập nhật một bill ghi cả dòng trong một lần thay vì gọi Google Sheet nhiều lần.
- Dashboard theo từng quyền chỉ tải các bảng thực sự cần.
- Health-check `/exec` không mở Google Sheet nên phản hồi nhanh hơn.

## Đã loại bỏ

- Bỏ tự động kiểm tra/tạo toàn bộ sheet trong mỗi request.
- Bỏ `SpreadsheetApp.flush()` sau khi tạo bill.
- Bỏ dữ liệu mẫu mặc định trong Apps Script để tránh tự chèn tên nhân viên/NCC/danh mục giả khi sheet trống.
- Bỏ các tài liệu hướng dẫn phiên bản cũ khỏi gói deploy.

## Cách cập nhật

1. Mở `appscript/Code.gs` và giữ lại `SHEET_ID` thật đang dùng.
2. Dán toàn bộ Code.gs vào dự án Apps Script.
3. Chạy thủ công hàm `setupSheets` **một lần** trong Apps Script Editor để bổ sung cột `Mã yêu cầu web` và cấp quyền nếu được hỏi.
4. Deploy > Manage deployments > Edit > New version > Deploy.
5. Mở URL `/exec`, phải thấy build `2026.08.05-multiuser-stable-v2`.
6. Upload toàn bộ thư mục web lên Netlify.
7. Trên các máy nhân viên, tải lại trang. HTML đã được đặt no-cache; trường hợp còn giao diện cũ thì nhấn Ctrl + F5 một lần.

## Lưu ý

- Không đổi tên các header đang có trong sheet DATA.
- Không xóa cột `Mã yêu cầu web`; cột này chỉ dùng chống tạo trùng.
- Không bấm deploy thành deployment mới nếu website vẫn dùng URL deployment cũ; nên sửa deployment hiện tại và chọn New version.
