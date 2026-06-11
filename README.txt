POPOPHONE REPAIR CENTER V3 FULL

1. Up toàn bộ folder lên GitHub.
2. Deploy Netlify.
3. Vào Netlify > Site settings > Environment variables:
   GAS_REPAIR_URL = link Apps Script /exec
4. Dán file apps-script/Code.gs vào Google Apps Script.
5. Deploy Apps Script:
   Execute as: Me
   Access: Anyone

TÀI KHOẢN MẪU:
- tiepnhan / 123456: chỉ thấy Tiếp nhận máy
- kythuat / 123456: chỉ thấy Xử lý sửa chữa
- quanly / 123456: Chi phí + Tra cứu
- admin / 123456: Full quyền

Lưu ý:
- Phân quyền frontend giúp nhân viên không thấy tab không liên quan.
- Muốn bảo mật cứng tuyệt đối cần thêm kiểm tra auth ở Apps Script bằng token/server-side.
