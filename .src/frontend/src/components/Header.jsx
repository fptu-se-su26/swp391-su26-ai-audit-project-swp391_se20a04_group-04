import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `font-label-md text-label-md transition-colors ${
      isActive(path)
        ? 'text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed pb-1'
        : 'text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed'
    }`;

  return (
    <header className="header bg-surface dark:bg-inverse-surface shadow-sm docked full-width">
      <div className="flex justify-between items-center px-margin-desktop w-full max-w-container-max-width mx-auto h-20">
        <Link to="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-primary-fixed" style={{ fontSize: '32px' }}>
            recycling
          </span>
          <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">
            EcoSchedule
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link className={navLinkClass('/')} to="/">Tra cứu lịch</Link>
          <Link className={navLinkClass('/thong-bao')} to="/thong-bao">Thông báo</Link>
          <Link className={navLinkClass('/thanh-toan')} to="/thanh-toan">Thanh toán</Link>
          <Link className={navLinkClass('/huong-dan')} to="/huong-dan">Hướng dẫn phân loại</Link>
          <a className="font-label-md text-label-md text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#">Hỗ trợ</a>
        </nav>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary dark:text-primary-fixed header__icon">
            notifications
          </button>
          <button className="material-symbols-outlined text-primary dark:text-primary-fixed header__icon">
            account_circle
          </button>
          <button className="header__cta bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-md text-label-md hover:opacity-90 active:opacity-80 transition-all hidden md:block">
            Tra cứu ngay
          </button>
        </div>
      </div>
    </header>
  );
}
