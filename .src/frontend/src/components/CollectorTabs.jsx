import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/collector', label: 'Lịch làm việc', icon: 'calendar_month' },
  { path: '/collector/reports', label: 'Phản ánh chỉ định', icon: 'assignment' },
];

export default function CollectorTabs() {
  const location = useLocation();

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-emerald-600'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
