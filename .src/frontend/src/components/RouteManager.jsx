import React, { useState } from 'react';
import routeService from '../services/routeService';
import CollectionRouteMap from './CollectionRouteMap';

export default function RouteManager({ routes, refreshRoutes, managerLoading, setManagerLoading, setManagerError }) {
  const [newRoute, setNewRoute] = useState({ routeName: '', routePoints: [] });
  const [viewRouteMap, setViewRouteMap] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newRoute.routeName) {
      setManagerError('Vui lòng nhập tên tuyến.');
      return;
    }
    setManagerLoading(true);
    setManagerError('');
    try {
      await routeService.createRoute(newRoute);
      setNewRoute({ routeName: '', routePoints: [] });
      await refreshRoutes();
    } catch (err) {
      setManagerError(err.message || 'Lỗi khi tạo tuyến mẫu.');
    } finally {
      setManagerLoading(false);
    }
  };

  const [routeToDelete, setRouteToDelete] = useState(null);

  const handleDelete = async () => {
    if (!routeToDelete) return;
    const { id } = routeToDelete;
    setRouteToDelete(null);
    setManagerLoading(true);
    setManagerError('');
    try {
      await routeService.deleteRoute(id);
      await refreshRoutes();
    } catch (err) {
      setManagerError(err.message || 'Lỗi khi xóa tuyến mẫu.');
    } finally {
      setManagerLoading(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quản lý</p>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tuyến thu gom (Routes)</h2>
      </div>

      <form onSubmit={handleCreate} className="mb-6 space-y-4">
        <div>
          <label className="block">
            <span className="text-xs text-slate-600 dark:text-slate-300">Tên tuyến</span>
            <input
              value={newRoute.routeName}
              onChange={e => setNewRoute(prev => ({ ...prev, routeName: e.target.value }))}
              className="mt-1 w-full md:w-1/3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="VD: Route A"
            />
          </label>
        </div>
        
        <div className="border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden">
          <CollectionRouteMap
            title="Vẽ lộ trình tuyến"
            collectorName="Chưa gắn"
            routePoints={newRoute.routePoints}
            setRoutePoints={(points) => setNewRoute(prev => ({ ...prev, routePoints: points }))}
            readOnly={false}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={managerLoading}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            Thêm tuyến
          </button>
        </div>
      </form>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {routes.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có tuyến mẫu nào.</p>
        ) : (
          routes.map(r => (
            <div key={r.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-white">{r.route_name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {r.route_points ? `${r.route_points.length} điểm` : 'Chưa có điểm'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewRouteMap(r)}
                  className="text-emerald-600 hover:text-emerald-700 text-xs font-bold px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg transition-colors"
                >
                  Xem bản đồ
                </button>
                <button
                  type="button"
                  onClick={() => setRouteToDelete(r)}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {routeToDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setRouteToDelete(null)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-700 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xl shrink-0">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Xác nhận xóa tuyến mẫu</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-sm text-slate-700 dark:text-slate-200">
              Bạn có chắc chắn muốn xóa tuyến mẫu <span className="font-bold text-rose-700 dark:text-rose-400">"{routeToDelete.route_name || routeToDelete.id}"</span> không?
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRouteToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={managerLoading}
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md hover:shadow-rose-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {managerLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-base">delete</span>
                )}
                Xóa tuyến mẫu
              </button>
            </div>
          </div>
        </div>
      )}

      {viewRouteMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Bản đồ tuyến: {viewRouteMap.route_name}</h3>
              <button
                onClick={() => setViewRouteMap(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900/50">
              <CollectionRouteMap
                title={`Lộ trình: ${viewRouteMap.route_name}`}
                collectorName="Xem trước tuyến mẫu"
                routePoints={viewRouteMap.route_points || []}
                readOnly={true}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
