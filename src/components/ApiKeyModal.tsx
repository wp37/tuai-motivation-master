import React, { useState, useEffect } from 'react';
import { loadApiConfig, saveApiConfig } from '../services/aiService';

interface Props { isOpen: boolean; onClose: () => void; }

const ApiKeyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<string[]>(['']);

  useEffect(() => {
    if (isOpen) {
      const cfg = loadApiConfig();
      setKeys(cfg.keyPool.length > 0 ? cfg.keyPool : ['']);
    }
  }, [isOpen]);

  const updateKey = (i: number, v: string) => {
    const k = [...keys]; k[i] = v; setKeys(k);
    saveApiConfig({ keyPool: k });
  };

  const addKey = () => setKeys([...keys, '']);
  const removeKey = (i: number) => {
    const k = keys.filter((_, x) => x !== i);
    const next = k.length ? k : [''];
    setKeys(next);
    saveApiConfig({ keyPool: next });
  };

  const validCount = keys.filter(k => k.trim().startsWith('AIza')).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0f0f11] border border-orange-900/30 w-full max-w-md rounded-2xl p-6 shadow-[0_0_60px_rgba(249,115,22,0.15)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-900/30 p-2 rounded-lg border border-orange-500/20">
            <i className="fa-solid fa-key text-orange-400"></i>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Gemini API Key</h3>
            <p className="text-[11px] text-slate-500">Nhập key để sử dụng AI</p>
          </div>
        </div>

        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
          className="block mb-4 text-center py-2 px-4 bg-orange-900/10 border border-orange-500/20 rounded-lg text-xs text-orange-400 font-bold hover:bg-orange-900/20 transition-all">
          🔑 Lấy API tại đây
        </a>

        <div className="space-y-2 mb-4">
          {keys.map((k, i) => (
            <div key={i} className="flex gap-2">
              <input type="password" value={k} onChange={e => updateKey(i, e.target.value)}
                className="flex-1 bg-black border border-white/10 rounded-lg p-3 text-sm font-mono text-orange-200 placeholder-white/20 outline-none focus:border-orange-500/40"
                placeholder="AIza..." />
              {keys.length > 1 && (
                <button onClick={() => removeKey(i)} className="text-orange-500/50 hover:text-orange-300 p-2"><i className="fa-solid fa-trash"></i></button>
              )}
            </div>
          ))}
        </div>

        <button onClick={addKey} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 mb-4 hover:underline">
          <i className="fa-solid fa-plus"></i> Thêm Key (Gmail khác)
        </button>

        {validCount === 0 && (
          <div className="text-[11px] text-yellow-500 bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-2 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            Cần ít nhất 1 API Key bắt đầu bằng "AIza..."
          </div>
        )}

        <button onClick={onClose} disabled={validCount === 0}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${validCount > 0 ? 'bg-orange-900/40 text-orange-100 border border-orange-500/30 hover:bg-orange-800/50' : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'}`}>
          <i className="fa-solid fa-lock"></i> NHẬP API KEY ĐỂ TIẾP TỤC
        </button>

        <p className="text-[10px] text-slate-600 mt-3 text-center">🔒 Keys lưu an toàn trong trình duyệt</p>
      </div>
    </div>
  );
};

export default ApiKeyModal;