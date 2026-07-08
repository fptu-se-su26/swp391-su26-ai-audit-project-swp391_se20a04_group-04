import { useState } from 'react';
import authService from '../services/authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const PRIORITY_COLORS = ['bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700', 'bg-sky-100 text-sky-700', 'bg-slate-100 text-slate-600'];

export default function AIComplaintSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchSummary() {
    setLoading(true);
    setError('');
    try {
      const token = await authService.getFreshToken();
      const res = await fetch(`${API_BASE}/api/ai/complaints/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Phân tích AI</p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tóm tắt phản ánh</h2>
        </div>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-slate-300 transition"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Đang phân tích...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Phân tích bằng AI
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {!summary && !loading && !error && (
        <p className="text-sm text-slate-400 dark:text-slate-500">Nhấn "Phân tích bằng AI" để nhận tóm tắt và mức độ ưu tiên của các phản ánh.</p>
      )}

      {summary && (
        <>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            {summary.totalComplaints} phản ánh · Cập nhật lúc {new Date(summary.generatedAt).toLocaleTimeString('vi-VN')}
          </p>
          <div className="space-y-3">
            {summary.summary.map((item, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[Math.min(i, 3)]}`}>
                      Ưu tiên #{item.priority}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{item.type}</span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <span>{item.count} phản ánh</span>
                    <span>·</span>
                    <span className="text-emerald-600">{item.resolvedCount} đã xử lý</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{item.summary}</p>
                {item.recommendation && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.344.346A3.999 3.999 0 0112 16.003a4 4 0 01-2.829-1.174l-.344-.346z" />
                    </svg>
                    <p className="text-xs text-amber-700 dark:text-amber-300">{item.recommendation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
