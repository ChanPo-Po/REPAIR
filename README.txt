POPOPHONE REPAIR CENTER V4 FINAL

CÓ GÌ TRONG BẢN NÀY:
- Phân quyền 5 tài khoản:
  sale / 123456
  kythuat / 123456
  qlcuahang / 123456
  qlkythuat / 123456
  admin / 123456

- Sale: chỉ tiếp nhận.
- Kỹ thuật: tiếp nhận + xử lý sửa chữa + thêm dịch vụ.
- QL cửa hàng: xem tiến độ, số đơn, doanh thu, tra cứu; không thấy lợi nhuận/chi phí.
- QL kỹ thuật: xử lý, nhập chi phí, vật tư, tra cứu, xem lợi nhuận.
- Admin: full quyền.

- Dropdown/datalist lấy từ các sheet:
  DM_TRANG_THAI
  DM_DICH_VU
  DM_VAT_TU
  DM_KY_THUAT

- In phiếu nhận sửa chữa:
  Vào Tiếp nhận máy -> Lưu + In phiếu nhận

- Apps Script V4:
  apps-script/Code.gs

CÁCH DEPLOY:
1. Up toàn bộ folder lên GitHub.
2. Netlify deploy.
3. Netlify > Site settings > Environment variables:
   GAS_REPAIR_URL = link Apps Script /exec
4. Dán apps-script/Code.gs vào Google Apps Script.
5. Deploy Apps Script:
   Execute as: Me
   Access: Anyone
6. Trigger deploy lại Netlify.

SHEET CẦN CÓ:
DATA_SUA_CHUA
CT_DICH_VU
CT_VAT_TU
LOG_SUA_CHUA
DM_TRANG_THAI
DM_DICH_VU
DM_VAT_TU
DM_KY_THUAT
BAO_CAO_NGAY
KPI_KY_THUAT

GHI CHÚ:
- Phiếu in dùng HTML print, không cần thư viện PDF.
- Nếu muốn in chuẩn A5 sau này, chỉnh CSS @page size:A5.
