# Bàn giao UI khách hàng

Ngày kiểm tra: 23/10/2026, múi giờ Asia/Bangkok.

Đã triển khai năm giai đoạn trong `docs/user-ui-plan.md`, tiếp tục trên các thay đổi chưa commit có sẵn của Menu, chi tiết món và các component liên quan. Giữ design system, React/JSX và lớp API hiện tại; không sửa backend hoặc file env.

## Thay đổi theo luồng

| Luồng | File chính | Kết quả |
|---|---|---|
| Chọn món | `frontend/src/pages/Menu.jsx`, `components/CategoryTabs.jsx`, `components/ProductCard.jsx` | Bộ lọc có nhãn/chip, bỏ từng điều kiện hoặc reset toàn bộ, hủy debounce đang chờ, lỗi danh mục/sản phẩm có thử lại. Card có fallback ảnh và trạng thái thêm. Bộ lọc dùng button có `aria-pressed`, hỗ trợ Tab/Enter/Space. |
| Chi tiết món | `frontend/src/pages/ProductDetail.jsx`, `components/QuantityStepper.jsx` | Pending/success/error khi thêm, khóa mua món ngừng bán, phân biệt 404 và lỗi server, fallback ảnh, thanh mua mobile nằm trên tabbar. Đổi ID tạo state số lượng mới; timer được dọn khi rời trang. |
| Giỏ hàng | `frontend/src/context/CartProvider.jsx`, `pages/Cart.jsx`, `pages/Home.jsx` | Loading/error/empty riêng; thử lại khi tải lỗi; khóa chung cho sửa/xóa/thêm/checkout. Không xếp hàng các request có thể chạy với token khác sau đổi tài khoản. Lỗi mutation giữ số lượng/tổng tiền đã xác nhận, có Toast. Home cũng khóa thêm món khi mutation đang chạy. |
| Checkout | `frontend/src/pages/Checkout.jsx`, `utils/validation.js`, `api/errors.js` | `noValidate`, lỗi dưới field, focus field lỗi sau khi form được mở khóa, trim dữ liệu và giữ nội dung khi API lỗi. Ánh xạ validation theo field từ backend. Tạo đơn và cập nhật giỏ local về rỗng dưới cùng khóa; không gọi DELETE/GET lần hai để quyết định thành công. Màn hình xác nhận có mã đơn, người nhận, tổng tiền và điều hướng; tự cuộn lên đầu/focus tiêu đề. |
| Lịch sử đơn | `frontend/src/pages/MyOrders.jsx`, `content/orders.js` được tái sử dụng | Phân trang 10 đơn qua API, tải lại/thử lại, card tóm tắt và chi tiết bằng native details/summary. Timeline chỉ rõ hiện tại/đã qua/chưa tới, có `aria-current`; đơn hủy hiển thị riêng. |
| Dùng chung | `frontend/src/hooks/useAsyncData.js`, `index.css`, `styles/pages.css` | Response đọc cũ không ghi đè mutation mới; hook giữ HTTP status để phân biệt 404. Token chiều cao tabbar, safe area, vùng chạm và bố cục trên màn hình hẹp. |
| Kiểm thử/tài liệu | `frontend/src/pages/UserOrdering.test.jsx`, `AGENTS.md` | Thêm 18 test hành vi; cập nhật quy ước UI và số lượng test. |

## Kết quả lệnh kiểm tra

Chạy tại `frontend/`:

| Lệnh | Kết quả |
|---|---|
| `npm run lint` | PASS, không có warning/error ESLint |
| `npm run test` | PASS: 6 file, 37 test, gồm 18 test mới |
| `npm run build` | PASS: 138 module được build, bundle production tạo thành công |

Vitest ban đầu bị sandbox Windows chặn `realpath` của dependency; đã chạy lại ngoài sandbox và toàn bộ test thành công. Không sửa dependency hay bỏ qua test để xử lý lỗi môi trường.

Các test mới kiểm tra reset khi debounce còn chờ; kết hợp bộ lọc và reset trang; thử lại khi tải lỗi; loading/error giỏ; mutation bị trùng/thất bại; response đọc cũ; khóa chung checkout/giỏ; validation/focus form; trường lỗi từ server; tạo đơn không phụ thuộc request đồng bộ tiếp theo; phân trang/tải lại đơn; timeline đơn hủy; ảnh lỗi; món ngừng bán; phân biệt 404 và lỗi server; danh sách món liên quan tải lỗi.

## Kiểm tra browser thực tế

- Đã xem năm trang và xác nhận đặt hàng ở 375×812, 768×1024 và 1440×1000. Chiều rộng nội dung không vượt chiều rộng viewport trong các lần đo.
- Luồng guest: bấm thêm món nhận thông báo cần đăng nhập.
- Luồng customer demo: đăng nhập → thêm món → sửa số lượng → checkout thiếu địa chỉ báo lỗi đúng field → nhập hợp lệ → tạo đơn → giỏ/header đồng bộ → xem đơn mới.
- Tạo ba đơn demo, đưa lịch sử lên 11 đơn và chuyển sang trang 2 thành công; test tự động còn dùng fixture 21 đơn để kiểm tra dữ liệu phân trang.
- Mở chi tiết đơn bằng Enter trên summary, kiểm tra địa chỉ/ghi chú và trạng thái hiện tại.
- Thử tên người nhận và địa chỉ dài trên mobile; nội dung xuống dòng, không gây tràn ngang.
- Đo thanh mua mobile: cạnh dưới khoảng 747px, cạnh trên tabbar khoảng 747.2px ở viewport cao 812px; hai vùng không chồng nhau.
- Dùng một Vite process riêng với `VITE_USE_MOCK=false` trong môi trường của process để thử API mất kết nối: Menu và chi tiết món hiển thị lỗi với nút thử lại. Không sửa `.env`.
- Console bản demo sau các luồng kiểm tra: không có error/warn được ghi nhận.

## Ảnh chụp

Ảnh trong `docs/ui-screenshots/`. Dữ liệu tài khoản/địa chỉ trong ảnh là dữ liệu demo kiểm thử.

| Màn hình | Desktop 1440px | Tablet 768px | Mobile 375px |
|---|---|---|---|
| Menu | [Desktop](ui-screenshots/menu-desktop.jpg) | [Tablet](ui-screenshots/menu-tablet.jpg) | [Mobile](ui-screenshots/menu-mobile.jpg) |
| Chi tiết món | [Desktop](ui-screenshots/detail-desktop.jpg) | [Tablet](ui-screenshots/detail-tablet.jpg) | [Mobile](ui-screenshots/detail-mobile.jpg) |
| Giỏ hàng | [Desktop](ui-screenshots/cart-desktop.jpg) | [Tablet](ui-screenshots/cart-tablet.jpg) | [Mobile](ui-screenshots/cart-mobile.jpg) |
| Checkout | [Desktop](ui-screenshots/checkout-desktop.jpg) | [Tablet](ui-screenshots/checkout-tablet.jpg) | [Mobile](ui-screenshots/checkout-mobile.jpg) |
| Đặt thành công | [Desktop](ui-screenshots/success-desktop.jpg) | [Tablet](ui-screenshots/success-tablet.jpg) | [Mobile](ui-screenshots/success-mobile.jpg) |
| Đơn của tôi | [Desktop](ui-screenshots/orders-desktop.jpg) | [Tablet](ui-screenshots/orders-tablet.jpg) | [Mobile](ui-screenshots/orders-mobile.jpg) |

Ảnh bổ sung: [bộ lọc đang áp dụng](ui-screenshots/menu-filters-mobile.jpg), [không có kết quả](ui-screenshots/menu-empty-mobile.jpg), [lỗi kết nối Menu](ui-screenshots/menu-error-mobile.jpg), [lỗi chi tiết món](ui-screenshots/detail-error-mobile.jpg), [validation checkout](ui-screenshots/checkout-validation-mobile.jpg), [trang đơn thứ hai](ui-screenshots/orders-page-2-mobile.jpg), [nội dung dài](ui-screenshots/success-long-content-mobile.jpg), [reflow 720px](ui-screenshots/checkout-reflow-720.jpg).

## Giới hạn xác minh

- Backend tại `127.0.0.1:8000/api/health` từ chối kết nối. Chưa kiểm tra luồng đăng nhập/đặt hàng với backend/PostgreSQL thật; kiểm tra UI thành công sử dụng mock. Không chạy test backend vì không sửa backend và không có server sẵn.
- Đã thử phím zoom của browser tích hợp nhưng CSS viewport/devicePixelRatio không thay đổi, nên chưa xác nhận zoom browser 200% thực tế. Đã kiểm tra thêm reflow ở 720px; đây không phải chứng nhận zoom 200%.
- Test fallback ảnh bằng sự kiện lỗi ảnh trong Testing Library. Chưa chặn mạng tải ảnh trong browser; không tuyên bố đã kiểm tra ảnh lỗi bằng browser.
- Các component dùng chung có smoke test trang chủ/auth và bộ test hiện có. Không thực hiện một vòng kiểm tra thủ công đầy đủ cho admin.
- Mock giữ dữ liệu trong bộ nhớ module và reset khi reload; việc này là hành vi demo hiện có. Phân trang trạng thái toàn bộ lịch sử, lỗi đăng ký khác response giữa mock/backend, thanh toán online và tồn kho vẫn ngoài phạm vi đợt UI này.

Để xem lại bản demo, chạy `npm run dev -- --host 127.0.0.1 --port 5174` trong `frontend/`, rồi mở `http://127.0.0.1:5174/menu`.
