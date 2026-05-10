import React, { useState } from 'react';
import { callAI } from '../services/aiService';
import { SYSTEM_PROMPT_MARKET_ANALYST } from '../data/prompts';
import { showToast } from '../components/Toast';

interface Props { initialTopic?: string; }

const MarketModule: React.FC<Props> = ({ initialTopic = '' }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  React.useEffect(() => { if (initialTopic) setTopic(initialTopic); }, [initialTopic]);

  const handleAnalyze = async () => {
    if (!topic) return showToast('Nhập chủ đề Market!');
    setLoading(true);
    try {
      const json = await callAI(`TOPIC: "${topic}"\nGENERATE JSON.`, SYSTEM_PROMPT_MARKET_ANALYST);
      setResult(json);
    } catch (e: any) { showToast(e.message); }
    finally { setLoading(false); }
  };

  const persona = result?.customer_persona || {};
  const potential = result?.market_potential || {};
  const products = Array.isArray(result?.product_recommendations) ? result.product_recommendations : [];
  const strategy = result?.sales_strategy || {};
  const calculator = result?.profit_calculator || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-[slideIn_0.4s_ease-out]">
      <div className="bg-[#0f0f11] border border-white/10 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><i className="fa-solid fa-shopping-bag text-yellow-500" /> Kinh Tế Tri Thức</h2>
        <div className="flex gap-2 md:gap-4 mb-6 flex-col sm:flex-row">
          <input value={topic} onChange={e => setTopic(e.target.value)} className="flex-1 bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-yellow-500/50 placeholder-white/20" placeholder="Nhập chủ đề (VD: Coaching, Khóa học quản trị cảm xúc)..." />
          <button onClick={handleAnalyze} disabled={loading} className="px-6 py-3 bg-yellow-900/40 hover:bg-yellow-800/40 border border-yellow-500/30 text-yellow-100 font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 shrink-0">
            {loading ? <><i className="fa-solid fa-sync animate-spin" /> ĐANG PHÂN TÍCH...</> : <><i className="fa-solid fa-chart-line" /> Phân Tích</>}
          </button>
        </div>

        {!result ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-white/10 border-dashed rounded-xl bg-white/5">
            <i className="fa-solid fa-shopping-bag mb-2 opacity-50" /><p className="text-sm">Nhập chủ đề để AI xây dựng phễu sản phẩm</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Persona + Potential Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-pink-900/10 to-purple-900/10 border border-pink-500/20 rounded-xl p-5">
                <h3 className="text-sm font-bold text-pink-400 mb-4 uppercase flex items-center gap-2"><i className="fa-solid fa-user-astronaut" /> CHÂN DUNG KHÁCH HÀNG</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Demographics</div>
                    <div><b className="text-pink-300/70">Tuổi:</b> {persona.demographics?.age_range || 'N/A'}</div>
                    <div><b className="text-pink-300/70">Giới tính:</b> {persona.demographics?.gender_split || 'N/A'}</div>
                    <div><b className="text-pink-300/70">Thu nhập:</b> {persona.demographics?.income_level || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Interests</div>
                    <div className="flex flex-wrap gap-1">{(persona.psychographics?.interests || []).slice(0, 4).map((i: string, x: number) => <span key={x} className="px-1.5 py-0.5 bg-pink-500/10 border border-pink-500/20 rounded text-[10px] text-slate-300">{i}</span>)}</div>
                  </div>
                </div>
                {persona.psychographics?.pain_points && (
                  <div className="mt-4 p-3 bg-black/40 rounded border border-white/5">
                    <div className="text-[10px] text-pink-300 font-bold mb-1 italic">Nỗi đau:</div>
                    <p className="text-[11px] text-slate-400">{persona.psychographics.pain_points.join(', ')}</p>
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-br from-blue-900/10 to-cyan-900/10 border border-blue-500/20 rounded-xl p-5">
                <h3 className="text-sm font-bold text-blue-400 mb-4 uppercase flex items-center gap-2"><i className="fa-solid fa-chart-line" /> TIỀM NĂNG THỊ TRƯỜNG</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/40 rounded border border-white/5"><div className="text-[10px] text-slate-500 uppercase mb-1">Quy mô</div><div className="text-sm text-white font-black font-mono">{potential.market_size || 'N/A'}</div></div>
                  <div className="p-3 bg-black/40 rounded border border-white/5"><div className="text-[10px] text-slate-500 uppercase mb-1">Tăng trưởng</div><div className="text-sm text-green-400 font-black font-mono">{potential.growth_rate || 'N/A'}</div></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1"><i className="fa-solid fa-shield-halved text-blue-500" /> Cạnh tranh: {potential.competition_level || 'N/A'}</div>
                  <div className="flex items-center gap-1"><i className="fa-solid fa-money-bill-trend-up text-green-500" /> Margin: {potential.profit_margin || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Products */}
            {products.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><i className="fa-solid fa-boxes-packing text-green-400" /> GỢI Ý SẢN PHẨM</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {products.map((cat: any, ci: number) => (
                    <div key={ci} className="bg-[#1a1a1a] border border-white/5 rounded-xl overflow-hidden hover:border-green-500/20 transition-colors">
                      <div className="p-3 bg-white/5 border-b border-white/5"><div className="text-[10px] text-green-400 font-bold uppercase">{cat.category}</div></div>
                      <div className="p-3 space-y-3">
                        <div className="space-y-2">{(cat.products || []).map((p: any, pi: number) => (
                          <div key={pi} className="flex justify-between items-start gap-2">
                            <div className="text-xs text-slate-300 font-medium">{p.name}</div>
                            <div className="text-[10px] text-right"><div className="text-slate-500">{p.price_range}</div><div className="text-green-500/70 font-bold">M: {p.margin}</div></div>
                          </div>
                        ))}</div>
                        {Array.isArray(cat.sourcing_links) && (
                          <div className="pt-2 border-t border-white/5 space-y-1">
                            <div className="text-[9px] text-slate-600 font-bold">NGUỒN HÀNG:</div>
                            {cat.sourcing_links.map((link: any, li: number) => (
                              <a key={li} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-1.5 rounded bg-black/40 hover:bg-green-900/20 border border-transparent hover:border-green-500/30 transition-all">
                                <span className="text-[10px] text-slate-400 hover:text-green-400 font-bold">{link.platform}</span>
                                <i className="fa-solid fa-external-link text-[8px] text-slate-600" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy + Profit */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#151515] border border-white/5 rounded-xl p-5">
                <h3 className="text-sm font-bold text-orange-400 mb-4 uppercase flex items-center gap-2"><i className="fa-solid fa-bullseye" /> CHIẾN LƯỢC</h3>
                <div className="space-y-3">
                  {['content_marketing', 'affiliate_approach', 'digital_products'].map(k => strategy[k] && (
                    <div key={k} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-orange-900/20 border border-orange-500/20 flex items-center justify-center shrink-0"><i className="fa-solid fa-bolt text-orange-400 text-xs" /></div>
                      <div><div className="text-[10px] text-slate-500 font-bold uppercase">{k.replace(/_/g, ' ')}</div><div className="text-xs text-slate-300">{strategy[k]}</div></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-900/10 to-emerald-900/10 border border-green-500/20 rounded-xl p-5">
                <h3 className="text-sm font-bold text-green-400 mb-4 uppercase flex items-center gap-2"><i className="fa-solid fa-calculator" /> DỰ TOÁN LỢI NHUẬN</h3>
                <div className="space-y-3">
                  {Object.values(calculator).map((scen: any, i: number) => (
                    <div key={i} className="bg-black/50 p-3 rounded-lg border border-white/5 flex justify-between items-center">
                      <div><div className="text-xs text-white font-bold">{scen.model}</div><div className="text-[10px] text-slate-500">{scen.monthly_sales}</div></div>
                      <div className="text-right"><div className="text-sm text-green-400 font-black font-mono">{scen.profit}</div><div className="text-[9px] text-slate-600">net/mo</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketModule;
