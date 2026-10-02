import React, { useState } from 'react';
import { X, Check, Copy, Server, ExternalLink, ShieldCheck, Terminal } from 'lucide-react';

interface DeployGuideModalProps {
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({ onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 mb-4">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-cyan-300">
              HƯỚNG DẪN DEPLOY LÊN RENDER.COM
            </h2>
            <p className="text-xs text-slate-400">
              Game WebSocket chuẩn Node.js Express + Socket.IO, tương thích 100%
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Step 1 */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-amber-400 mb-1.5 text-sm">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">1</span>
              Đẩy mã nguồn lên GitHub
            </div>
            <p className="text-slate-400 mb-2">
              Khởi tạo kho chứa Git và đẩy toàn bộ thư mục dự án lên repository của bạn trên GitHub.
            </p>
            <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-cyan-300 flex items-center justify-between border border-slate-800">
              <code>git init && git add . && git commit -m "Diep.io Enhanced"</code>
              <button
                onClick={() => copyToClipboard('git init && git add . && git commit -m "Diep.io Enhanced"', 1)}
                className="p-1 hover:text-white"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-amber-400 mb-1.5 text-sm">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">2</span>
              Tạo Web Service trên Render.com
            </div>
            <p className="text-slate-400 mb-2">
              Vào <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">Render Dashboard <ExternalLink className="w-3 h-3" /></a>, bấm <b>New +</b> &rarr; chọn <b>Web Service</b> &rarr; kết nối repository GitHub vừa tạo.
            </p>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Build Command:</span>
                <div className="bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-emerald-400 flex items-center justify-between border border-slate-800">
                  <code>npm install && npm run build</code>
                  <button
                    onClick={() => copyToClipboard('npm install && npm run build', 2)}
                    className="p-1 hover:text-white"
                  >
                    {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Start Command:</span>
                <div className="bg-slate-900 p-2 rounded-xl font-mono text-[11px] text-emerald-400 flex items-center justify-between border border-slate-800">
                  <code>npm start</code>
                  <button
                    onClick={() => copyToClipboard('npm start', 3)}
                    className="p-1 hover:text-white"
                  >
                    {copiedIndex === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1.5 text-sm">
              <ShieldCheck className="w-4 h-4" />
              Lưu Ý Về Ngôn Ngữ & Môi Trường
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
              <li><b>Cổng kết nối (Port):</b> Máy chủ tự động nhận <code>process.env.PORT</code> theo chuẩn của Render.com.</li>
              <li><b>WebSockets (Socket.IO):</b> Render hỗ trợ kết nối WebSocket liên tục trên cùng cổng HTTP mà không cần proxy riêng biệt.</li>
              <li><b>Node runtime:</b> Đã tối ưu cho Node.js 18, 20 hoặc 22 mới nhất.</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
