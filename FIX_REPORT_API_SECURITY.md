# Báo cáo fix API + bảo mật + kiến trúc

## Đã sửa API
- Thêm đăng nhập qua Apps Script (`action: login`) thay vì kiểm tra mật khẩu trực tiếp ở frontend.
- Thêm session token 6 giờ bằng `CacheService`.
- Tự gắn `authToken` vào mọi API quản trị từ `js/config.js`.
- Chặn các API quản trị nếu chưa đăng nhập hoặc hết phiên:
  - `list`
  - `getDashboard`
  - `updateStatus` / `quickStatus`
  - `updateCost`
  - `createTechWork`
  - `createSentRepair`
  - `updateSentRepair`
  - `backfillOldDataToCT`
  - `unlockRepair`
  - `fixMoneyDateColumns`
- Public vẫn dùng được:
  - tải danh mục
  - tạo phiếu tiếp nhận
  - tra cứu phiếu
  - xem chi tiết phiếu dạng public
- Public API không còn trả chi phí nội bộ/lợi nhuận/vật tư/NCC/log.
- Thêm chống submit trùng phiếu trong ngày và chống double-click bằng `clientRequestId`.
- Sửa lỗi normalize so sánh text trong Apps Script (`normCompare_`) trước đó có đoạn `.replace('t', ' ')` dễ làm sai dữ liệu.
- Bổ sung cột `Ngày nhận lại` cho sheet `MAY_GUI_XU_LY` để khớp dữ liệu thực tế.

## Đã siết bảo mật
- Xóa mật khẩu khỏi `js/config.js` để không public trên Netlify/GitHub frontend.
- Mật khẩu chuyển sang `USER_ACCOUNTS` trong `appscript/Code.gs`.
- API không còn tin `userRole` tự gửi từ trình duyệt; server lấy role từ session và ghi đè vào payload.
- Store/Tech khi gọi `list/getDashboard` chỉ nhận dữ liệu đã ẩn tiền, chi phí, lợi nhuận.
- Các tác vụ nguy hiểm như backfill/fix format chỉ cho `admin`.

## Việc cần làm trước khi deploy thật
1. Mở `appscript/Code.gs`.
2. Thay `PASTE_SPREADSHEET_ID_HERE` bằng ID Google Sheet thật.
3. Đổi toàn bộ mật khẩu trong `USER_ACCOUNTS`.
4. Deploy Apps Script Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy Web App URL mới dán vào `js/config.js` tại `API_URL`.
6. Upload lại frontend lên Netlify/GitHub.

## Đánh giá kiến trúc hiện tại
- Frontend tách khá rõ: public (`public.js`), dashboard (`dashboard.js`), auth/config (`auth.js`, `config.js`).
- Apps Script đang làm cả API, setup sheet, validate, logging, báo cáo. Với quy mô hiện tại dùng được, nhưng file `Code.gs` đã khá lớn.
- Nên tách Apps Script thành nhiều file khi phát triển tiếp:
  - `Auth.gs`
  - `RepairApi.gs`
  - `SheetUtils.gs`
  - `DashboardApi.gs`
  - `MastersApi.gs`
- Điểm yếu còn lại: Web App Apps Script vẫn là backend đơn giản; nếu cần bảo mật cấp cao hơn nên chuyển sang backend riêng hoặc dùng Google Identity/OAuth.
