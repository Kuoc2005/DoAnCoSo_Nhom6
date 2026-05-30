<<<<<<< HEAD
# Player Duo — Nền tảng tìm đồng chơi / thuê duo

Dự án full-stack: **React (Vite + TypeScript)** + **Node.js (Express 5, ESM)** + **MongoDB (Mongoose)**. Giao diện lấy cảm hứng hub game / thuê người chơi kèm rank, có **đăng ký đăng nhập**, **ví demo**, **đơn trở thành người cho thuê**, **admin duyệt**, **trang công khai `/players/:username`**, **tin nhắn hỗ trợ realtime (WebSocket)** và **bảng điều khiển admin** (thống kê, doanh thu, duyệt đơn, …).

---

## Mục lục

1. [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)  
2. [Yêu cầu môi trường](#yêu-cầu-môi-trường)  
3. [Cài đặt & chạy local](#cài-đặt--chạy-local)  
4. [Biến môi trường](#biến-môi-trường)  
5. [Cấu trúc thư mục](#cấu-trúc-thư-mục)  
6. [API backend (tóm tắt)](#api-backend-tóm-tắt)  
7. [WebSocket — chat hỗ trợ](#websocket--chat-hỗ-trợ)  
8. [Luồng xác thực](#luồng-xác-thực)  
9. [Quy tắc hiển thị hub (người cho thuê)](#quy-tắc-hiển-thị-hub-người-cho-thuê)  
10. [Phân trang danh sách Khám phá](#phân-trang-danh-sách-khám-phá)  
11. [Admin & bootstrap tài khoản admin](#admin--bootstrap-tài-khoản-admin)  
12. [Build production & triển khai](#build-production--triển-khai)  
13. [Xử lý sự cố thường gặp](#xử-lý-sự-cố-thường-gặp)

---

## Kiến trúc tổng quan

| Thành phần | Công nghệ | Vai trò |
|------------|-----------|---------|
| **Frontend** | Vite 8, React 18, TypeScript, Tailwind CSS 4, React Router 7 | SPA, proxy `/api` và `/ws` tới backend khi `npm run dev` |
| **Backend** | Express 5, Mongoose 9, JWT, cookie refresh, `ws` | REST API + WebSocket trên cùng cổng HTTP |
| **CSDL** | MongoDB | User, session refresh, booking, review, tin nhắn hỗ trợ, … |

Luồng dev điển hình:

- Frontend: `http://localhost:5173` — gọi API qua đường dẫn tương đối `/api/...` (Vite proxy → `5001`).
- Backend: `http://localhost:5001` — REST + nâng cấp WebSocket tại path `/ws/chat`.

---

## Yêu cầu môi trường

- **Node.js** 18+ (khuyến nghị 20+ hoặc LTS hiện tại; dự án đã kiểm tra với Node 22).
- **MongoDB** chạy local hoặc **MongoDB Atlas** (chuỗi kết nối URI).
- Hai terminal (hoặc tmux): một chạy backend, một chạy frontend.

---

## Cài đặt & chạy local

### 1. MongoDB

Đảm bảo instance MongoDB lắng nghe (ví dụ `mongodb://127.0.0.1:27017`) và tạo database tùy ý (ví dụ `playerduo`) — sẽ tự tạo collection khi ứng dụng ghi dữ liệu.

### 2. Backend

```bash
cd back-end
copy .env.example .env
# Chỉnh MONGODB_CONNECTION_STRING, ACCESS_TOKEN_SECRET trong .env
npm install
npm run dev
```

Khi thành công, console hiển thị dạng: `MongoDB connected successfully`, `Server is running on port 5001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt: **http://localhost:5173** (Vite mặc định).

> **Lưu ý:** Nếu mở front bằng `http://127.0.0.1:5173`, hãy đảm bảo `CORS_ORIGIN` trong `.env` backend có origin tương ứng (mặc định `.env.example` đã gợi ý cả `localhost` và `127.0.0.1`).

---

## Biến môi trường

### Backend — `back-end/.env`

| Biến | Bắt buộc | Mô tả |
|------|-----------|--------|
| `MONGODB_CONNECTION_STRING` | Có | URI kết nối MongoDB |
| `ACCESS_TOKEN_SECRET` | Có | Chuỗi bí mật ký JWT access token |
| `PORT` | Không | Mặc định `5001` |
| `NODE_ENV` | Không | `development` / `production` |
| `CORS_ORIGIN` | Không | Danh sách origin cách nhau bởi dấu phẩy (CORS + cookie cross-site) |
| `BOOTSTRAP_ADMIN_EMAIL` | Không | Email user được nâng **admin** mỗi lần start (hoặc tạo admin mới — xem `.env.example`) |
| `BOOTSTRAP_ADMIN_USERNAME` / `PASSWORD` / `DISPLAY_NAME` | Tuỳ chọn | Dùng khi tạo admin lần đầu (chi tiết trong `.env.example`) |

File mẫu đầy đủ: **`back-end/.env.example`**.

### Frontend — tùy chọn

| Biến | Khi nào cần | Mô tả |
|------|-------------|--------|
| `VITE_API_URL` | Build/preview trỏ API tuyệt đối | Ví dụ `https://api.example.com` — khi đó fetch và WebSocket dùng host của biến này |
| *(mặc định trống)* | `npm run dev` | Dùng relative `/api` và `/ws` qua proxy Vite |

---

## Cấu trúc thư mục

```
doancoso/
├── README.md                 # Tài liệu dự án (file này)
├── back-end/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js         # HTTP server + mount routes + WebSocket
│       ├── Controllers/      # Xử lý nghiệp vụ theo domain
│       ├── routes/           # Định tuyến Express
│       ├── models/           # Schema Mongoose
│       ├── middlewares/      # JWT bảo vệ route, requireAdmin
│       └── lib/              # DB, match engine, taxonomy, chat WS, …
└── frontend/
    ├── package.json
    ├── vite.config.js        # Proxy /api, /ws → backend
    └── src/
        ├── App.tsx           # Định tuyến trang
        ├── layouts/          # HubLayout, AdminLayout, ProfileLayout, …
        ├── pages/            # Trang theo feature
        ├── components/       # UI tái sử dụng
        ├── contexts/         # AuthContext
        ├── hooks/            # Ví dụ useSupportWebSocket
        ├── lib/              # apiFetch, getApiUrl, getWsChatUrl
        └── types/            # TypeScript types
```

*(Ở root có thể có `package.json` phụ — chủ yếu dùng `back-end/` và `frontend/`.)*

---

## API backend (tóm tắt)

Base path: **`/api`**. Dưới đây là nhóm endpoint chính (một số cần `Authorization: Bearer <accessToken>`).

### Auth — `/api/auth`

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/signup` | Đăng ký |
| POST | `/signin` | Đăng nhập — trả `accessToken`, set cookie refresh |
| POST | `/refresh` | Lấy access token mới từ cookie refresh |
| POST | `/signout` | Đăng xuất (xóa session refresh) |

### User (đã đăng nhập) — `/api/user`

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/me` | Thông tin user hiện tại |
| PATCH | `/profile`, `/gaming-profile`, `/player-listing`, `/provider-studio` | Cập nhật hồ sơ / game / listing / studio |
| POST | `/wallet/top-up` | Nạp ví (demo) |
| POST | `/provider-application` | Gửi đơn trở thành người cho thuê |

### Catalog & listing (công khai / một phần công khai)

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/catalog/home` | Trang chủ: thống kê, danh mục game, nổi bật |
| GET | `/api/listings` | Danh sách người cho thuê trên hub — query: `game`, `q`, **`page`**, **`pageSize`** |
| GET | `/api/listings/leaderboard` | Bảng xếp hạng listing (theo điểm cấu hình sẵn) |
| GET | `/api/listings/leaderboards` | Bảng xã hội: nạp tiền, chi tiêu thuê, thu nhập provider |
| GET | `/api/players/:username` | JSON hồ sơ công khai (ẩn email, phone, password) |

### Review — `/api/reviews`

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/player/:username` | Danh sách review công khai |
| POST | `/` | Tạo review (cần đăng nhập) |

### Thuê nhanh — `/api/rentals`

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/quick` | Thuê nhanh (cần đăng nhập) — chi tiết trong `rentalController` |

### Match / trợ lý — `/api/match`

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/taxonomy` | Danh mục game |
| GET | `/suggestions` | Gợi ý ghép (đăng nhập) |
| POST | `/assistant` | Trợ lý match (đăng nhập) |

### Tin nhắn hỗ trợ — `/api/messages`

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/support` | Lịch sử thread của user hiện tại |
| POST | `/support` | Gửi tin (user) |

### Admin — `/api/admin` (Bearer + role `admin`)

Ví dụ: `dashboard-stats`, `revenue-report`, `bookings`, `providers`, `users`, `seekers`, `hub-listings`, `provider-applications`, `support-threads`, `support-messages`, … — xem file `back-end/src/routes/adminRoute.js` để biết đầy đủ method/path.

---

## WebSocket — chat hỗ trợ

- **URL (dev):** `ws://localhost:5173/ws/chat?token=<JWT_access>` (Vite proxy `/ws` → backend).  
- **URL (trực tiếp backend):** `ws://localhost:5001/ws/chat?token=...`  
- Server xác thực JWT, gắn socket với `userId` và cờ `isAdmin`; tin mới được **broadcast** tới mọi admin và tới user thuộc đúng `threadUserId`.

Chi tiết triển khai: `back-end/src/lib/chatWs.js`, `supportMessageController.js`, hook `frontend/src/hooks/useSupportWebSocket.ts`.

---

## Luồng xác thực

1. **Đăng nhập:** nhận `accessToken` (JSON) + cookie **httpOnly** chứa refresh token.  
2. **Gọi API:** frontend lưu `accessToken` trong `localStorage` và gửi header `Authorization: Bearer ...` (hàm `apiFetch` trong `frontend/src/lib/api.ts`).  
3. **401:** `apiFetch` thử `POST /api/auth/refresh` một lần; thành công thì cập nhật token và gọi lại request.  
4. **Đăng xuất:** xóa token client + gọi `POST /api/auth/signout`.

---

## Quy tắc hiển thị hub (người cho thuê)

Trên **trang chủ**, **Khám phá**, **leaderboard listing**, API chỉ trả về user thỏa:

- `accountType === "provider"` (đã được quy trình duyệt đơn / cấp vai trò người cho thuê), **và**
- `role !== "admin"` (tài khoản admin không xuất hiện trên hub công khai).

Logic tập query: `back-end/src/lib/listingMappers.js` — hàm `hubProviderAccountQuery()`.

Thống kê admin **số người cho thuê (hub)** cũng dùng cùng tinh thần (không đếm admin làm provider công khai) — xem `getDashboardStats` trong `adminController.js`.

---

## Phân trang danh sách Khám phá

`GET /api/listings` hỗ trợ:

| Query | Mặc định | Giới hạn gợi ý |
|-------|----------|----------------|
| `page` | `1` | Tối đa 500 (server clamp) |
| `pageSize` | `12` | Tối đa 36 |

Response gồm: `listings`, `total`, `page`, `pageSize`, `totalPages`.

---

## Admin & bootstrap tài khoản admin

- User có `role: "admin"` mới vào được layout `/admin` và gọi API `/api/admin/*`.  
- File **`back-end/src/lib/bootstrapAdmin.js`**: khi server start, đọc biến môi trường bootstrap để **gán role admin** cho email đã tồn tại hoặc **tạo user admin** lần đầu (xem `.env.example`).

Trên UI: menu **Quản trị** (khi đăng nhập admin), các trang như **Tổng quan**, **Dashboard thống kê** (`/admin/dashboard`), Doanh thu, Duyệt người cho thuê, Tin nhắn hỗ trợ, …

---

## Build production & triển khai

### Frontend

```bash
cd frontend
npm run build
```

Thư mục output: `frontend/dist/`. Phục vụ tĩnh bằng nginx, S3+CloudFront, hoặc `npm run preview` (nhớ cấu hình `VITE_API_URL` và proxy nếu cần).

### Backend

```bash
cd back-end
npm start
```

Cần biến môi trường production: `MONGODB_CONNECTION_STRING`, `ACCESS_TOKEN_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN` trỏ đúng domain front.

### WebSocket & HTTPS

Khi front chạy **HTTPS**, WebSocket client phải dùng **`wss://`**. Hàm `getWsChatUrl` trong `frontend/src/lib/api.ts` đã xử lý theo `window.location.protocol` và/hoặc `VITE_API_URL`.

Reverse proxy (nginx) cần:

- Proxy `location /api/` → backend.  
- Proxy `location /ws` (hoặc path bạn chọn) với **Upgrade** và **Connection** cho WebSocket.

---

## Xử lý sự cố thường gặp

| Hiện tượng | Hướng xử lý |
|------------|-------------|
| Front báo không kết nối API | Kiểm tra backend đã chạy cổng **5001**; dev phải dùng **`npm run dev`** ở frontend để có proxy `/api`. |
| CORS / cookie không vào | Đồng bộ origin trong `CORS_ORIGIN`; không lẫn `localhost` vs `127.0.0.1` nếu cookie `SameSite` strict. |
| MongoDB lỗi kết nối | Kiểm tra URI, firewall, IP whitelist (Atlas), tên DB. |
| `npm run dev` backend crash ngay | Xem log — thường thiếu `.env` hoặc lỗi cú pháp/import; chạy `node --check src/server.js`. |
| WebSocket không nhận tin | Kiểm tra proxy `/ws` trong Vite; token còn hạn; backend log lỗi JWT. |
| Không thấy user trên Khám phá | User phải `accountType: provider"` và đã qua duyệt; admin không hiện trên hub. |

---

## License & đóng góp

Dự án mang tính học tập / đồ án (`doancoso`). Bạn có thể chỉnh sửa README này theo tên nhóm, giảng viên hướng dẫn và phiên bản báo cáo của mình.

Nếu cần bổ sung: sơ đồ ERD, sequence diagram luồng booking, hoặc checklist nộp bài — có thể thêm mục phụ lục vào cuối file.
=======

