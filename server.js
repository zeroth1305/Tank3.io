import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Phục vụ các file tĩnh trong thư mục public
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Endpoint kiểm tra sức khỏe server cho Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Trả về index.html từ thư mục public cho trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Fallback: Nếu không tìm thấy đường dẫn, trả về index.html trong public
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Lắng nghe kết nối Socket.IO từ người chơi
io.on('connection', (socket) => {
  console.log(`[+] Người chơi kết nối: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[-] Người chơi ngắt kết nối: ${socket.id}`);
  });
});

// Khởi chạy server bằng http wrapper để Socket.IO hoạt động
server.listen(PORT, HOST, () => {
  console.log(`🚀 Diep.io Server running on http://${HOST}:${PORT}`);
});
