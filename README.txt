GIAO DIỆN 17.5 – THANH CHUYỂN MÀN HÌNH VÀ BỘ LỌC
Chỉ deploy Netlify. API giữ 17.5. Admin và Theo dõi đơn dùng chung thanh chuyển.
Bộ lọc Admin: năm/tháng đều nhau, chi nhánh toàn chiều ngang, khoảng ngày mở
khi cần. Bỏ input tháng của iOS và nút reset nổi.

GIAO DIỆN ADMIN 17.2 – API giữ 17.5
Chỉ cần deploy lại source Netlify nếu Apps Script 17.5 đang chạy.
Bỏ các khối trùng vận hành: việc cần xử lý, nổi bật, top dòng máy, KPI KTV,
tồn vận hành, điểm vận hành và các bộ đếm trạng thái lặp lại.
Admin dùng operations.css giống màn hình sửa chữa; không nạp style giao diện
source tham khảo. Nhu cầu vật tư chuyển về tab Vật tư.

POPOPHONE V17.5 – ADMIN RIÊNG VÀ TẢI NHẸ

TRIỂN KHAI
Thay Code.gs rồi Manage deployments > Edit > New version > Deploy.
Deploy toàn bộ thư mục source Netlify; giữ URL /exec hiện tại. Đăng nhập lại.
kt / 123456; ql / pocn113; admin / pocn113. Script properties có thể ghi đè
REPAIR_KT_PASSWORD, REPAIR_QL_PASSWORD, REPAIR_ADMIN_PASSWORD.

ADMIN
Đăng nhập admin mở admin.html. KT/QL tiếp tục dùng dashboard.html.
Admin chỉ có 4 mục: Tổng quan, Chi phí lợi nhuận, Vật tư và Báo cáo.
Dữ liệu/nội dung theo REPAIR-main (11), giao diện theo bản mobile vận hành.
Không dùng sidebar hay giao diện desktop của source tham khảo.
Chi phí hiển thị thẻ đơn với chi nhánh, IMEI, tên khách, dòng máy, dịch vụ,
báo giá, chi phí, thực thu và lợi nhuận. Có chọn tất cả đơn/chưa nhập chi phí.
Báo cáo hiện theo kỳ đang chọn, xem trên mobile hoặc in/PDF qua trình duyệt.
Admin có link quay lại màn hình tiến độ để KT nhận/CH nhận và cập nhật trạng thái
theo luồng 7 -> CH nhận -> 8–11, cùng lịch sử IMEI/SĐT và nhiều dịch vụ.
Dữ liệu tiền chỉ trả qua API Admin có kiểm tra quyền, không thêm vào API KT/QL.
Tổng quan/chi phí lấy kỳ hoặc khoảng ngày đã chọn, chi nhánh từ DATA.
Chi phí ghi DATA/CT_VAT_TU, tính tổng chi phí = vật tư + công thợ,
lợi nhuận = thực thu - tổng chi phí; ghi một block DATA, không nhiều setCell.
Chỉ trạng thái 8 ghi ngày trả thực tế; 8–11 kết thúc, 1–7 còn tồn.
Các con số tài chính theo ngày nhận đơn trong kỳ, không phải ngày thu tiền.

TỐC ĐỘ
Vận hành mở màn hình bằng operationsStart: phiên bản + danh mục nhẹ + tổng quan
trong một lượt API, không phải chờ hai lượt nối tiếp rồi tải nền ba danh sách.
Danh mục vận hành cache 5 phút; snapshot DATA cache 60 giây; frontend 2 phút.
Các lần cập nhật app xóa cache; Sale nhập ngoài app có thể chậm xuất hiện do cache DATA 60 giây và cache giao diện 2 phút.
Nút Làm mới lấy DATA mới ngay.
Form KT nhận/cập nhật chỉ tải một đơn và dịch vụ; không quét lịch sử máy/khách
và LOG trước khi mở form. Chi tiết đầy đủ vẫn tải khi bấm Chi tiết.
Admin chỉ trả đơn trong kỳ, không tải toàn bộ 2022–nay xuống trình duyệt.
Vật tư và báo cáo tải chi tiết khi mở mục tương ứng.
Admin và thao tác ngoài app vẫn chịu thời gian kết nối Apps Script/Netlify.

SHEETS
Giữ 8 sheet vận hành DATA, CT_DICH_VU, LOG_SUA_CHUA, THEO_DOI_DON,
DM_DICH_VU, DM_KY_THUAT, DM_LOAI_DICH_VU, DM_DONG_MAY.
4 mục Admin dùng thêm CT_VAT_TU, DM_VAT_TU, DM_NCC.
Sheet hoa hồng/công bổ sung/máy gửi cũ không dùng trong 4 mục này; giữ lại
nếu có ứng dụng hoặc source khác còn sử dụng. Không tự xóa dữ liệu cũ.
Không thêm chấm công/lương. Không xóa/đổi cấu trúc DATA hoặc luồng Sale.

KIỂM TRA
Kiểm tra cục bộ/mô phỏng; chưa đo trên deployment thật hoặc dữ liệu thật của bạn.

Kiểm tra V17.5: tài khoản chung và quy tắc bàn giao, ẩn nút theo quyền,
Admin kỳ/chi nhánh và quyền API tài chính, chi phí/giá vốn/lợi nhuận,
lưu/xem lại vật tư, tổng quan Admin, kỳ không có đơn, tải module theo nhu cầu,
startup vận hành một request, form sửa không đọc lịch sử. Chưa đo deployment thật.
