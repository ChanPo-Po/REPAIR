# V10.31 - Hoa hồng dùng nguồn chuẩn hệ thống

## Logic đã chốt

Hoa hồng kỹ thuật lấy từ nguồn chuẩn của hệ thống:

1. Máy khách hệ thống
   - DATA + CT_DICH_VU
   - Chi tiết hoa hồng lấy IMEI, không phụ thuộc mã SC khi hiển thị.

2. Máy nhà / máy gửi xử lý
   - MAY_GUI_XU_LY
   - Tính trực tiếp từ: IMEI + Dòng máy + Xử lý 1 + Xử lý 2 + Kỹ thuật.
   - Không cần mã SC.
   - Không phụ thuộc THO_NHAP_CONG.

THO_NHAP_CONG chỉ dùng để đối chiếu thợ nhập thiếu/dư/sai, không dùng làm nguồn chuẩn tính hoa hồng.

## Bảng Chi tiết hoa hồng

Cột hiển thị:

- Ngày
- Nguồn
- IMEI
- KTV
- Dòng máy
- Dịch vụ
- Hoa hồng

Nguồn gồm:

- Khách hệ thống
- Máy gửi xử lý

## Lưu ý dịch vụ máy gửi xử lý

Các dịch vụ trong Xử lý 1 / Xử lý 2 sẽ được tách theo dấu phẩy, chấm phẩy hoặc xuống dòng.

Ví dụ:

`Thay pin fix , Rửa đốm`

sẽ tách thành:

- Thay pin fix
- Rửa đốm

Muốn có tiền hoa hồng, DM_HOA_HONG_THO phải có đúng các cột tương ứng:

- Thay pin fix
- Rửa đốm

Nếu chưa có cột thì dòng vẫn hiện nhưng hoa hồng = 0đ để Admin biết thiếu bảng.
