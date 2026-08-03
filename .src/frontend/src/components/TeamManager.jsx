import React, { useState } from 'react';
import teamService from '../services/teamService';

export default function TeamManager({ teams, collectors, refreshTeams, managerLoading, setManagerLoading, setManagerError }) {
  const [newTeam, setNewTeam] = useState({ teamName: '' });
  const [selectedCollectorIds, setSelectedCollectorIds] = useState([]);

  const toggleCollector = (uid) => {
    setSelectedCollectorIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTeam.teamName || selectedCollectorIds.length === 0) {
      setManagerError('Vui lòng nhập tên đội và chọn ít nhất 1 thành viên.');
      return;
    }
    setManagerLoading(true);
    setManagerError('');
    try {
      const members = collectors
        .filter(c => selectedCollectorIds.includes(c.uid))
        .map(c => ({ id: c.uid, name: c.fullName }));
      
      await teamService.createTeam({ teamName: newTeam.teamName, members });
      setNewTeam({ teamName: '' });
      setSelectedCollectorIds([]);
      await refreshTeams();
    } catch (err) {
      setManagerError(err.message || 'Lỗi khi tạo đội nhóm.');
    } finally {
      setManagerLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đội nhóm này?')) return;
    setManagerLoading(true);
    setManagerError('');
    try {
      await teamService.deleteTeam(id);
      await refreshTeams();
    } catch (err) {
      setManagerError(err.message || 'Lỗi khi xóa đội nhóm.');
    } finally {
      setManagerLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quản lý</p>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Đội Nhóm (Teams)</h2>
      </div>

      <form onSubmit={handleCreate} className="mb-6">
        <div className="grid gap-6 md:grid-cols-3 items-start">
          {/* Cột trái: Tên đội nhóm & Nút Tạo đội mới */}
          <div className="space-y-3 md:col-span-1">
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5">Tên đội nhóm</span>
              <input
                value={newTeam.teamName}
                onChange={e => setNewTeam(prev => ({ ...prev, teamName: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="VD: Đội Q.Hải Châu"
              />
            </label>
            <button
              type="submit"
              disabled={managerLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-sm font-semibold text-white transition shadow-sm disabled:opacity-50"
            >
              {managerLoading ? 'Đang tạo...' : 'Tạo đội mới'}
            </button>
          </div>

          {/* Cột phải: Chọn thành viên */}
          <div className="md:col-span-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5">Chọn thành viên</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {collectors.length === 0 ? (
                <p className="text-xs text-slate-400 col-span-full">Không có nhân viên thu gom nào.</p>
              ) : (
                collectors.map(c => (
                  <label key={c.uid} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-sky-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedCollectorIds.includes(c.uid)}
                      onChange={() => toggleCollector(c.uid)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="truncate text-xs font-medium">{c.fullName}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Danh sách các Đội nhóm */}
      <div className="space-y-3">
        {teams.length === 0 ? (
          <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-400">
            Chưa có đội nhóm nào được tạo.
          </div>
        ) : (
          teams.map(t => (
            <div key={t.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{t.team_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.members?.length || 0} thành viên: {t.members?.map(m => m.name).join(', ') || 'Không có thành viên'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl transition-colors ml-4 shrink-0"
              >
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
