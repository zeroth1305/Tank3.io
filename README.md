# DIEP.IO ENHANCED - NEXT-GEN MULTIPLAYER TANK BATTLE

Bản nâng cấp toàn diện của Diep.io với đồ họa hiện đại, cơ chế điều khiển mượt mà, hệ sinh thái thời tiết, các vùng đất (Biomes), cây tiến hóa đa dạng nhiều tầng lớp xe tăng, bot đấu trường thông minh và bảng xếp hạng thời gian thực qua WebSocket.

---

## 🚀 Các Tính Năng Đã Được Cải Tiến Theo Trình Tự

### 1. Cơ Chế Điều Khiển Mượt Mà (Smooth Controls)
- **Quán tính & Gia tốc (Inertia & Smooth Acceleration):** Xe tăng chuyển động êm ái, phanh mượt không giật khựng.
- **Kỹ năng Lướt Tốc Độ (Dash / Thruster Burst):** Bấm phím **Space** hoặc **Chuột Phải** để phóng phản lực tức thì (có thanh năng lượng hồi phục).
- **Tự động Bắn & Tự Xoay:** 
  - Phím **`E`**: Bật / Tắt Tự động bắn (Auto-Fire).
  - Phím **`C`**: Bật / Tắt Tự động xoay nòng (Auto-Spin).
- **Độ giật nòng (Recoil Animation):** Khi bắn, nòng súng thụt lùi và nảy lò xo chân thực, tạo phản lực đẩy ngược xe tăng về phía sau.
- **Camera Lerp:** Camera bám đuổi xe tăng siêu mượt với hiệu ứng rung màn hình (Screen Shake) khi bắn đại bác hoặc va chạm mạnh.

### 2. Đồ Họa Cải Tiến & Hiệu Ứng (Upgraded Graphics & VFX)
- **Lưới tọa độ sắc nét (Dynamic Grid):** Lưới không gian công nghệ cao, tự động điều chỉnh theo góc nhìn camera.
- **Hệ thống hạt (Particle System):** Hiệu ứng nổ mảnh vụn khi phá vỡ khối hoặc tiêu diệt kẻ địch, tia lửa khi đạn va chạm.
- **Chỉ số sát thương bay (Floating Combat Numbers):** Hiển thị sát thương thời gian thực (-22, -150 CRIT, +130 XP).
- **Âm thanh tổng hợp (Web Audio API Synthesizer):** Tích hợp sẵn âm thanh bắn đạn, va đập, nổ khối, thăng cấp và âm thanh thời tiết mà không cần tải bất kỳ file MP3 ngoài nào.

### 3. Môi Trường & Thời Tiết Động (Environment & Weather)
Chu kỳ thời tiết thay đổi luân phiên mỗi 60-90 giây:
- **Trời Quang Đãng (Clear Sky):** Tầm nhìn hoàn hảo, tốc độ tiêu chuẩn.
- **Mưa Giông Sấm Sét (Rain & Thunderstorm):** Hiệu ứng giọt mưa, chớp sấm chớp, tăng +15% tốc độ bay của đạn.
- **Bão Cát Sa Mạc (Sandstorm):** Bụi cát vàng cuộn xoáy, tăng +10% uy lực sát thương phát bắn.
- **Bình Minh Cực Quang (Neon Aurora):** Ánh sáng tím thần bí, tăng +25% điểm kinh nghiệm (XP) nhận được.

### 4. Hệ Thống Bản Đồ & Vùng Đất (Biomes - 4000x4000)
- **Tổ Ngũ Giác Trung Tâm (Pentagon Nest):** Vùng ánh sáng tím tập trung vô số Pentagon, Alpha Pentagon khổng lồ và đàn Crasher hung dữ bảo vệ.
- **Băng Nguyên Giá Lạnh (Glacier Tundra - Tây Bắc):** Bề mặt trơn trượt giảm ma sát, lướt siêu tốc.
- **Hầm Dung Nham (Obsidian Magma - Đông Nam):** Chiến trường rực lửa; nếu ở trong dung nham sẽ bị đốt máu từ từ.
- **Ốc Đảo Phồn Vinh (Emerald Oasis - Đông Bắc):** Tăng gấp 3 lần tốc độ hồi máu tự nhiên.

### 5. Cây Tiến Hóa Chiến Xa (Classes Upgrade Tree)
- **Tier 1 (Cấp 1):** Basic Tank.
- **Tier 2 (Cấp 15):** Twin, Sniper, Machine Gun, Flank Guard, Smasher (bọc thép gai nghiền nát mục tiêu), Overseer (chỉ huy đàn Drone minion).
- **Tier 3 (Cấp 30):** Triple Shot, Assassin, Destroyer (đại pháo phản lực khổng lồ), Quad Tank, Tri-Angle, Overlord, Trapper (rải bẫy chông gai cố định).
- **Tier 4 (Cấp 45):** Triplet, Penta Shot, Annihilator, Booster, Fighter, Hybrid, Streamliner, Battleship.

### 6. Hệ Thống Nâng Cấp 8 Kỹ Năng Chuyên Sâu (Stat Upgrades)
Nâng cấp nhanh bằng phím tắt **[1] - [8]** hoặc click chuột:
1. **Hồi Máu (Health Regen)**
2. **Máu Tối Đa (Max Health)**
3. **Sát Thương Thân (Body Damage)**
4. **Tốc Độ Đạn (Bullet Speed)**
5. **Độ Xuyên Thấu (Bullet Penetration)**
6. **Uy Lực Đạn (Bullet Damage)**
7. **Tốc Độ Nạp Đạn (Reload)**
8. **Tốc Độ Di Chuyển (Movement Speed)**

### 7. Đặt Tên Nhân Vật, Tùy Chỉnh Màu Sắc & Bot Đấu Trường
- **Sảnh chờ (Lobby Modal):** Cho phép đặt tên tùy ý, chọn 8 bảng màu Neon rực rỡ, xem trước mô hình xe tăng 360 độ.
- **Đấu trường AI Bots:** Tự động duy trì 10+ bot chiến đấu thông minh, tự săn khối, tự nâng cấp kỹ năng và tiến hóa class, đảm bảo trận đấu luôn sôi động ngay cả khi chơi 1 mình.
- **Bảng Xếp Hạng & Báo Tiêu Diệt Thời Gian Thực:** Top 10 người chơi dẫn đầu, kèm Kill Feed hiển thị ai vừa hạ gục ai.

---

## 🛠️ Hướng Dẫn Deploy Lên Render.com (Chuẩn 100%)

Render.com hỗ trợ WebSockets (Socket.IO) tự nhiên trên cùng 1 cổng HTTP:

1. **Khởi tạo Git & Đẩy code lên GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Diep.io Enhanced"
   git remote add origin <URL_REPO_GITHUB_CUA_BAN>
   git branch -M main
   git push -u origin main
   ```

2. **Tạo Web Service trên Render:**
   - Truy cập: [https://dashboard.render.com/](https://dashboard.render.com/)
   - Chọn **New +** ➔ **Web Service**
   - Chọn kho chứa GitHub vừa tạo
   - Điền các thông số:
     - **Name:** `diepio-enhanced` (hoặc tùy chọn)
     - **Language / Runtime:** `Node`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Plan:** `Free`
   - Bấm **Create Web Service**.

> **Lưu ý:**
> - Máy chủ tự động nhận cổng qua biến môi trường `process.env.PORT` của Render.
> - Không cần cài thêm bất kỳ ứng dụng hoặc cơ sở dữ liệu ngoài nào.
