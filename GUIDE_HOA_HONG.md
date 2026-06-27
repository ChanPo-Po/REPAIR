# Hướng dẫn bật module Hoa hồng kỹ thuật

1. Upload toàn bộ thư mục web lên Netlify như bình thường.
2. Mở `appscript/Code.gs`, copy toàn bộ nội dung file mới trong thư mục `appscript/Code.gs` đè lên Apps Script hiện tại.
3. Trong Apps Script nhớ thay `SHEET_ID` đúng file Google Sheet đang dùng.
4. Bấm Run hàm `setupSheets()` một lần để tự tạo sheet `DM_HOA_HONG_THO`.
5. Mở Google Sheet, vào sheet `DM_HOA_HONG_THO`, chỉnh lại bảng hoa hồng riêng cho từng kỹ thuật: Thanh, Trường, Phong, Thành, Hà.
6. Deploy Apps Script: Deploy > Manage deployments > Edit > New version > Deploy.
7. Vào web dashboard, bấm Làm mới, mở tab `💵 Hoa hồng kỹ thuật`.

Quy tắc đã set:
- Pin DLC Maxe / DLC Gold / KSC DLC / Pisen DLC / Gold / Bison / Energizer = `THAY PIN KHÔNG SÀN CỔ`.
- Tất cả kỹ thuật trong `DM_KY_THUAT` đều hiện trong báo cáo. Ai chưa có bảng hoặc model/dịch vụ chưa khớp thì hoa hồng = 0.
