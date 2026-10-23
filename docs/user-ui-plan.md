# Kế hoạch nâng cấp UI khách hàng — bàn giao cho Anti

## 1. Nhiệm vụ

Nâng cấp trải nghiệm chọn món → giỏ hàng → đặt hàng → xem đơn trên frontend hiện có. Đọc `AGENTS.md` trước khi sửa. Thực hiện lần lượt các giai đoạn bên dưới, kiểm tra từng luồng và báo cáo kết quả cuối cùng.

Đã triển khai UI theo các giai đoạn bên dưới. Xem `docs/user-ui-handoff.md` để biết kết quả kiểm tra, ảnh chụp và giới hạn xác minh. Các đường dẫn bên dưới tính từ thư mục gốc repository.

## 2. Phạm vi và hướng thiết kế

- Tập trung năm trang: Menu, ProductDetail, Cart, Checkout, MyOrders.
- Giữ nhận diện Highlands hiện có: nền porcelain, chữ roast/ink, đỏ highland cho hành động chính. Đọc token thực tế trong `frontend/src/index.css`.
- Desktop: khoảng trắng thoáng, phân cấp tiêu đề/giá rõ; phần tổng tiền dễ theo dõi. Mobile: nội dung gọn, nút chính dễ chạm, không tràn ngang.
- Dùng lại `.page-head`, `.section-head`, `.panel`, `.summary`, `.product-card` và component hiện có. CSS cấp trang đặt trong `frontend/src/styles/pages.css`; chỉ sửa `index.css` khi cần primitive/token dùng chung.
- Không redesign trang chủ, auth hay admin. Không thêm thư viện UI, thay stack, thay backend/schema hoặc tạo API mới trong đợt này.
- Dùng trường dữ liệu và endpoint sẵn có. Không thêm size/topping, voucher, thanh toán online, tồn kho, đánh giá hay thời gian giao hàng giả định.
- Mock vẫn là chế độ mặc định. Mọi lời gọi dữ liệu đi qua `frontend/src/api/index.js`; không import dữ liệu mock trực tiếp vào trang.

## 3. Hiện trạng đã xác nhận

| Trang | Đã có | Phần cần hoàn thiện |
|---|---|---|
| Menu | Tìm kiếm debounce 300 ms, lọc nhóm/giá, phân trang, số kết quả, loading và empty state | Lọc dễ nhận biết, reset ổn định, lỗi danh mục/thử lại, responsive |
| Chi tiết món | Ảnh, breadcrumb, số lượng, tổng giá, món cùng nhóm | Pending/error khi thêm, món ngừng bán, lỗi ảnh, thanh mua trên mobile |
| Giỏ hàng | Sửa số lượng, xác nhận xóa, tổng tiền | Loading thật, lỗi tải/thao tác, khóa thao tác khi chờ, tránh response ghi đè |
| Checkout | Thông tin người nhận, tóm tắt đơn, gửi đơn | Validation dưới field, focus lỗi, thành công tách khỏi lỗi đồng bộ giỏ |
| Đơn của tôi | Timeline, chi tiết món/người nhận, thông báo đặt thành công | Phân trang thật, xem chi tiết gọn hơn, tải lại, trạng thái lỗi riêng |

Lưu ý: `MyOrders` hiện chỉ lấy trang 1 với 20 đơn. `GET /orders` hỗ trợ `page`/`size`, chưa hỗ trợ lọc trạng thái. Không làm bộ lọc trông như lọc toàn bộ lịch sử nhưng chỉ lọc 20 đơn đang tải. Bộ lọc trạng thái toàn lịch sử để đợt mở rộng API sau.

## 4. Thứ tự triển khai

### Giai đoạn 1 — Menu và card món

File chính: `frontend/src/pages/Menu.jsx`, `components/CategoryTabs.jsx`, `components/ProductCard.jsx`.

1. Làm rõ thanh tìm kiếm, nhãn lọc giá và trạng thái nhóm đang chọn; bổ sung vùng điều kiện đang áp dụng và nút xóa lọc khi cần.
2. Giữ tìm kiếm debounce và reset trang về 1 khi đổi điều kiện. Hủy timer khi unmount và khi reset để từ khóa cũ không tự quay lại sau khi người dùng xóa lọc.
3. Giữ lưới card đều, ảnh có tỷ lệ ổn định; tên dài xuống dòng không làm lệch nút mua. Xử lý ảnh thiếu/hỏng bằng fallback phù hợp, tránh vòng lặp lỗi ảnh.
4. Hiển thị lỗi tải danh mục và sản phẩm riêng, có thao tác thử lại. Không đồng thời báo lỗi tải và “không có món”.
5. Trên mobile, nhóm món cuộn ngang trong vùng riêng; tìm kiếm và bộ lọc không ép chiều rộng trang.
6. Dùng button với trạng thái chọn rõ cho bộ lọc; nếu giữ semantics tab thì bổ sung hành vi bàn phím tương ứng.

Nghiệm thu: kết hợp tìm kiếm + nhóm + giá đúng; đổi điều kiện về trang 1; reset khi debounce còn chờ không khôi phục từ khóa cũ; thêm giỏ chỉ gửi một request trong lúc pending; người chưa đăng nhập nhận thông báo rõ.

### Giai đoạn 2 — Chi tiết món

File chính: `frontend/src/pages/ProductDetail.jsx`, `components/QuantityStepper.jsx`.

1. Hoàn thiện bố cục ảnh và thông tin mua: tên → mô tả → đơn giá → số lượng → thành tiền → CTA.
2. Thêm trạng thái đang thêm, thành công và lỗi; catch lỗi async, hiển thị bằng Toast. Khóa nút và số lượng trong lúc gửi để tránh thao tác trùng.
3. `is_available=false`: báo tạm ngừng bán và khóa thêm giỏ, kể cả khi truy cập URL trực tiếp.
4. Phân biệt không tìm thấy món với lỗi mạng/server; lỗi tải có nút thử lại. Món chính vẫn xem/mua được nếu riêng danh sách món liên quan tải lỗi.
5. Mobile có thanh mua cố định chứa thành tiền và CTA, dùng chung state/handler với nút trong trang. Bố trí phía trên `MobileTabBar`, tính safe area và padding cuối trang để không che nội dung.
6. Khi đổi `:id`, số lượng và trạng thái thêm thuộc đúng món mới; dọn timer phản hồi thành công khi chuyển trang.

Nghiệm thu: không gửi trùng khi bấm nhanh; món ngừng bán không mua được; lỗi ảnh/mạng có UI rõ; thanh mua không đè tabbar, footer hoặc nút khác.

### Giai đoạn 3 — Giỏ hàng và trạng thái dữ liệu

File chính: `frontend/src/context/CartProvider.jsx`, `pages/Cart.jsx`, `components/QuantityStepper.jsx`, `hooks/useAsyncData.js` nếu thật sự cần.

1. Truyền loading/error thật từ loader thay cho `loading: false`. Không biến lỗi tải giỏ thành giỏ trống; có thông báo và nút thử lại.
2. Bổ sung khả năng disable cho QuantityStepper và phản hồi đang cập nhật/xóa.
3. Tuần tự hóa các mutation giỏ hàng vì mỗi response trả toàn bộ giỏ. Trong lúc một mutation chờ, khóa thao tác sửa/xóa/clear và chuyển checkout; guard ở tầng context để cả thao tác ngoài trang Cart cũng không tạo race.
4. Cập nhật số lượng/tổng tiền từ response thành công. Nếu request lỗi, giữ dữ liệu xác nhận gần nhất và hiển thị lỗi, cho thao tác lại.
5. Giữ ConfirmProvider cho xóa món/xóa giỏ. Summary rõ số lượng và tổng tiền; mobile bố cục không che điều hướng dưới.

Nghiệm thu: cập nhật/xóa thất bại không làm mất món; thao tác nhanh không khiến tổng tiền hoặc badge lùi về response cũ; loading, error, empty và có dữ liệu là các trạng thái phân biệt.

### Giai đoạn 4 — Checkout và xác nhận thành công

File chính: `frontend/src/pages/Checkout.jsx`, `utils/validation.js`.

1. Dùng `noValidate`, bỏ attribute `required`; thêm `aria-required`, `aria-invalid`, `aria-describedby` và lỗi dưới từng field theo `AGENTS.md`.
2. Thêm validator checkout dùng chung: trim dữ liệu, tên không trống, điện thoại theo quy ước hiện có, địa chỉ ít nhất 3 ký tự; giữ giới hạn độ dài phù hợp `backend/app/schemas/order.py`.
3. Submit lỗi validation không gọi API; focus field lỗi đầu tiên. Lỗi request giữ nguyên nội dung form; lỗi theo field từ API được trình bày khi có thể ánh xạ.
4. Chỉ cho một request tạo đơn trong lúc chờ; khóa CTA khi giỏ chưa tải xong, tải lỗi hoặc đang cập nhật. Tổng tiền lấy từ CartProvider, không tự tạo phí mới.
5. Backend đã xóa giỏ trong transaction tạo đơn. Khi `orders.create` thành công, đồng bộ giỏ local về rỗng và refresh khi cần; không gọi clear giỏ lần hai như điều kiện xác định đặt hàng thành công.
6. Lỗi refresh giỏ sau khi tạo đơn không được báo “tạo đơn thất bại” hoặc khuyến khích gửi lại. Hiển thị xác nhận với mã đơn, số tiền, người nhận và nút xem đơn/tiếp tục chọn món, dùng response thật.

Nghiệm thu: form rỗng/sai số điện thoại hiện lỗi dưới field; submit hợp lệ tạo một đơn; tạo đơn thành công nhưng refresh giỏ lỗi vẫn đi đến trạng thái thành công; giỏ/header đồng bộ sau đặt hàng.

### Giai đoạn 5 — Đơn của tôi

File chính: `frontend/src/pages/MyOrders.jsx`, `content/orders.js`; dùng `components/Modal.jsx` nếu mở chi tiết trong modal.

1. Bổ sung phân trang dùng `orders.list({ page, size })`, hiển thị tổng số đơn và trang hiện tại; chuyển trang tải đúng dữ liệu từ API.
2. Card tóm tắt có mã đơn, ngày, trạng thái, tổng tiền và vài dòng món. Cho mở chi tiết bằng vùng mở rộng hoặc modal, dùng nội dung sẵn có trong response.
3. Dùng `orderFlow` và `orderStatusLabels` làm nguồn chung. Timeline phân biệt bước hiện tại/đã qua/chưa tới, có `aria-current="step"` và nhãn chữ; đơn hủy có nội dung riêng.
4. Thêm nút tải lại danh sách. Lỗi tải có thử lại, không đi kèm thông báo “chưa có đơn”. Không cần polling thời gian thực.
5. Giữ xác nhận đơn vừa đặt qua router state hiện có. Khi tải lại browser hoặc mở trực tiếp `/my-orders`, trang vẫn dùng được mà không cần state này.

Nghiệm thu: xem được đơn ngoài 20 đơn đầu; phân trang và tải lại đúng; timeline terminal chính xác; mở/đóng chi tiết bằng bàn phím, focus được xử lý nếu dùng modal.

## 5. Quy tắc kỹ thuật xuyên suốt

- JavaScript/JSX; loader bọc `useCallback` và dùng `useAsyncData`. Không setState đồng bộ trong effect để lách luồng tải dữ liệu.
- Giữ thứ tự provider hiện tại. Dùng `useToast`/`useConfirm`, không dùng alert/confirm của browser.
- Mọi handler async có xử lý lỗi và pending thích hợp; không để promise rejection không được xử lý.
- Nút tương tác có focus rõ, label dễ hiểu, mục tiêu chạm khoảng 44 px. Trạng thái không chỉ phân biệt bằng màu.
- Tôn trọng reduced motion; dùng token motion hiện có, không thêm fade-up lặp lại vào từng section.
- Component dùng chung có thể ảnh hưởng Home/admin: kiểm tra hồi quy những nơi đang sử dụng khi thay props/style.
- Không đổi `.env`, không reset database, không push/merge. Lỗi đăng ký mock/backend trả khác shape là backlog riêng, ngoài phạm vi UI này.

## 6. Kiểm tra và bàn giao

Sau khi hoàn thiện, chạy trong `frontend/`:

```powershell
npm run lint
npm run test
npm run build
```

Thêm test hành vi cần thiết cho: reset trong lúc debounce còn chờ; mutation giỏ bị lỗi/trùng; checkout validation; tạo đơn thành công nhưng đồng bộ giỏ thất bại; phân trang đơn. Dùng mock service có thể điều khiển response/pending, không viết test chỉ kiểm tra tên class CSS.

Kiểm tra giao diện bằng browser ở ít nhất 375 px, 768 px và 1440 px. Xem trạng thái đang tải, không có dữ liệu, lỗi, đang gửi và thành công. Kiểm tra luồng khách chưa đăng nhập và customer demo; thử thao tác bàn phím, zoom 200%, ảnh lỗi và nội dung dài. Nếu có môi trường backend sẵn, kiểm tra thêm luồng với API thật và nêu rõ giới hạn nếu chưa làm được.

Bàn giao:

- Danh sách file thay đổi và giải thích ngắn cho từng luồng.
- Kết quả lint/test/build thực tế, ghi rõ lỗi hoặc kiểm tra chưa chạy.
- Ảnh chụp desktop/mobile của năm trang và màn hình xác nhận đặt hàng.
- Ghi rõ phần còn tồn tại; không tuyên bố đã test API thật khi mới chạy mock.
- Chỉ cập nhật `AGENTS.md` khi hành vi, quy ước hoặc thông tin dự án đã thay đổi thực tế.

## 7. Cách chia việc

Thực hiện lần lượt Menu → Chi tiết món → Giỏ hàng → Checkout → Đơn của tôi. Mỗi giai đoạn phải đạt tiêu chí nghiệm thu trước khi chuyển tiếp; không cần dừng chờ xác nhận giữa các giai đoạn. Có thể chia commit theo từng giai đoạn nếu được yêu cầu commit.
