# Hướng dẫn bật module Hoa hồng kỹ thuật

1. Upload toàn bộ thư mục web lên Netlify như bình thường.
2. Mở `appscript/Code.gs`, copy toàn bộ nội dung file mới trong thư mục `appscript/Code.gs` đè lên Apps Script hiện tại nếu có thay đổi API.
3. Trong Apps Script nhớ thay `SHEET_ID` đúng file Google Sheet đang dùng.
4. Tạo/cập nhật sheet `DM_HOA_HONG_THO` theo đúng format mới:

```text
Kỹ thuật | Model | Thay pin sàn cổ | Thay pin KSC | Thay pin KSC DLC | Thay pin Energizer | Thay pin Bison | Thay pin Pisen | Thay pin Pisen DLC | Thay pin DLC Maxe | Thay pin thường | Thay phản quang | Fix ảo | Ép kính | Ép cảm | Thay vỏ | Thay lưng mắt to | Thay lưng mắt nhỏ
```

5. Tên kỹ thuật trong `DM_HOA_HONG_THO` nên khớp `DM_KY_THUAT`: `Thanh`, `Trường`, `Phong`, `Thành`, `Hà`.
6. Hoa hồng được tính từ `CT_DICH_VU` làm nguồn chính, không lấy từ `CT_VAT_TU`.
7. Nếu một phiếu có nhiều dịch vụ trong `CT_DICH_VU`, hệ thống cộng hoa hồng từng dịch vụ.
8. Deploy Apps Script nếu có cập nhật `Code.gs`: Deploy > Manage deployments > Edit > New version > Deploy.
9. Vào dashboard, bấm Làm mới, mở tab `💵 Hoa hồng kỹ thuật`.

Ví dụ test:

```text
KTV: Phong
Model: 13PROMAX
Dịch vụ:
- Thay pin DLC Maxe = 30.000
- Ép kính = 230.000
- Thay vỏ = 90.000
Tổng = 350.000
```

Nếu dòng nào hiện 0 hoặc báo thiếu bảng, kiểm tra 3 điểm:
- Tên kỹ thuật có khớp không.
- Model có khớp không.
- Tên dịch vụ trong `CT_DICH_VU` có map được vào cột hoa hồng không.
