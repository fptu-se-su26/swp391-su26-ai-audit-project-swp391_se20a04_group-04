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
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm mt-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quản lý</p>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Đội Nhóm (Teams)</h2>
      </div>

      <form onSubmit={handleCreate} className="mb-6">
        <div className="grid gap-4 md:grid-cols-4 items-start">
          <label className="block md:col-span-1">
            <span className="text-xs text-slate-600 dark:text-slate-300">Tên đội nhóm</span>
            <input
              value={newTeam.teamName}
              onChange={e => setNewTeam(prev => ({ ...prev, teamName: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="VD: Đội Q.Hải Châu"
            />
            <button
              type="submit"
              disabled={managerLoading}
              className="mt-3 w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
            >
              Tạo đội mới
            </button>
          </label>
          <div className="md:col-span-3">
            <span className="text-xs text-slate-600 dark:text-slate-300 block mb-2">Chọn thành viên</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
              {collectors.length === 0 ? (
                <p className="text-xs text-slate-400">Không có nhân viên.</p>
              ) : (
                collectors.map(c => (
                  <label key={c.uid} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-sky-300">
                    <input
                      type="checkbox"
                      checked={selectedCollectorIds.includes(c.uid)}
                      onChange={() => toggleCollector(c.uid)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="truncate">{c.fullName}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {teams.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có đội nhóm nào.</p>
        ) : (
          teams.map(t => (
            <div key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-white">{t.team_name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.members?.length || 0} thành viên: {t.members?.map(m => m.name).join(', ') || ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 bg-rose-50 dark:bg-rose-900/20 rounded-lg transition-colors ml-4 shrink-0"
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
