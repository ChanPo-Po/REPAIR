# POPO OS V11 - UI/UX Upgrade

Bản này giữ nguyên backend/API hiện tại, tập trung nâng giao diện vận hành thực tế.

## Đã nâng cấp
- Dashboard Executive Hero: hiển thị điểm vận hành, đơn hôm nay, đang sửa, quá hẹn, doanh thu/lợi nhuận theo quyền.
- Command Center: gom các cảnh báo quan trọng như quá hẹn, chờ linh kiện, tồn lâu, bảo hành lại.
- Insight Cards: trả lời nhanh các câu hỏi sếp hay hỏi: dịch vụ top, dòng máy top, KTV nổi bật, loại dịch vụ chính.
- UI Foundation: sidebar POPO OS, card bo lớn, shadow mềm, gradient navy, badge trạng thái rõ màu.
- Danh sách sửa chữa: thêm layout card CRM khi màn hình nhỏ, vẫn giữ bảng cho PC.
- Máy cần xử lý: chuyển sang board card ưu tiên quá hẹn/chờ linh kiện/đang sửa.
- Public tiếp nhận: thêm hero vận hành, checklist quy trình, giao diện mobile đẹp hơn.
- Login: làm lại màn hình đăng nhập theo phong cách phần mềm thương mại.
- Dark mode: có nút chuyển giao diện sáng/tối trên dashboard, lưu lựa chọn trên trình duyệt.

## Lưu ý
- Không đổi cấu trúc sheet.
- Không đổi tên action API.
- Không đụng logic bảo mật API đã fix ở bản trước.
- Có thể deploy thay thế frontend hiện tại, Apps Script giữ nguyên nếu đang dùng bản fixed-api-security.
