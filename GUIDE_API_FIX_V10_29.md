# POPOPHONE Repair V10.29 - API Clean

## Đã dọn lỗi API
- `doPost()` dùng `setupSheetsLite_()` để không format nguyên cột mỗi lần gọi API, giảm treo Apps Script.
- API lỗi trả rõ: `Lỗi API [action]: ...` để toast đỏ hiện đúng nguyên nhân.
- `getDashboard()` trả đủ alias:
  - `techWork` / `thoNhapCong`
  - `sentRepairs` / `mayGuiXuLy`
- `readObjects()` chịu được sheet chưa tồn tại/trống, không làm sập dashboard.
- `ensureSheet()` tự bổ sung cột thiếu khi nâng version.
- `createRepair()` đã validate lại IMEI/SĐT/dòng máy/form ở backend.
- `createTechWork`, `createSentRepair`, `updateSentRepair` dùng API nhẹ.

## Đã fix hoa hồng máy gửi xử lý
Tab Hoa hồng kỹ thuật gộp:
- Máy khách hệ thống: `DATA + CT_DICH_VU`
- Máy gửi xử lý: `THO_NHAP_CONG + MAY_GUI_XU_LY`

Điều kiện tính máy gửi xử lý:
- Thợ đã kê công trong `THO_NHAP_CONG`
- IMEI có trong `MAY_GUI_XU_LY`
- Cùng tháng đang lọc
- Hoa hồng lấy từ số đã lưu trong `THO_NHAP_CONG`, nếu trống thì lookup từ `DM_HOA_HONG_THO`

## Lưu ý deploy
1. Copy `appscript/Code.gs` lên Apps Script.
2. Deploy New Version.
3. Cập nhật lại API URL trong `js/config.js` nếu link deploy đổi.
4. Upload toàn bộ web lên Netlify.
5. Refresh trình duyệt bằng Ctrl+F5.
