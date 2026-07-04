# V11.5 – Executive Report PDF

Đợt này viết lại phần **Xuất PDF / In báo cáo** theo hướng “Tạp chí điều hành”.

## Mục tiêu

PDF không còn là bảng dữ liệu kéo dài như Excel. Mỗi trang chỉ trả lời một câu hỏi vận hành:

1. Tuần này kinh doanh thế nào?
2. Kỹ thuật hoạt động ra sao?
3. Vật tư nào cần nhập?
4. Có vấn đề gì cần sếp quyết định?

## Đã thay đổi

- Viết lại hàm sinh báo cáo tuần trong `js/dashboard.js`.
- Thay các bảng dài bằng KPI card, ranking, progress bar, donut, alert card và nhận định ngắn.
- Thêm cover page theo phong cách báo cáo nội bộ POPOPHONE.
- Tối ưu in A4: mỗi trang là một section riêng, có số trang, footer và page break.
- Giữ nguyên dữ liệu nguồn/API/backend hiện tại, không đổi cấu trúc sheet.

## Lưu ý

Báo cáo này dùng dữ liệu thật từ hệ thống hiện tại. Nếu dữ liệu đầu vào thiếu doanh thu, chi phí, vật tư hoặc kỹ thuật thì phần tương ứng sẽ hiển thị trạng thái chưa đủ dữ liệu.
