import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import authService from '../services/authService';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authService.getCurrentUser());
    };
    window.addEventListener('authChange', handleAuthChange);
    // Periodically sync user status as well (just in case)
    const interval = setInterval(handleAuthChange, 2000);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      clearInterval(interval);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `font-label-md text-label-md transition-colors ${
      isActive(path)
        ? 'text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed pb-1'
        : 'text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed'
    }`;

  const getDashboardPath = () => {
    return user ? '/dashboard' : '/login';
  };

  const handleAccountClick = () => {
    navigate(getDashboardPath());
  };

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
          <button 
            onClick={handleAccountClick} 
            className={`material-symbols-outlined header__icon transition-colors ${
              user ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-primary dark:text-primary-fixed'
            }`}
            title={user ? `Tài khoản: ${user.fullName}` : 'Đăng nhập'}
          >
            account_circle
          </button>
          
          {user ? (
            <button 
              onClick={() => navigate(getDashboardPath())}
              className="header__cta bg-emerald-600 text-white px-6 py-2.5 rounded-full font-label-md text-label-md hover:bg-emerald-500 active:opacity-80 transition-all hidden md:block"
            >
              Bảng điều khiển
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="header__cta bg-primary text-on-primary px-6 py-2.5 rounded-full font-label-md text-label-md hover:opacity-90 active:opacity-80 transition-all hidden md:block"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

