import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { ROLES, normalizeRole } from '../constants/roles';
import './Home.css';

// Danh sách tính năng nổi bật — mỗi card liên kết đến tính năng thật
const FEATURES = [
  {
    icon: 'calendar_today',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-100 dark:border-emerald-900/40',
    accent: 'bg-emerald-600',
    title: 'Tra cứu lịch thu gom',
    desc: 'Tìm chính xác lịch xe thu gom rác tại phường, xã, tổ dân phố của bạn theo thời gian thực.',
    cta: 'Tra cứu ngay',
    route: '/tra-cuu',
  },
  {
    icon: 'notifications_active',
    color: 'text-sky-600',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-100 dark:border-sky-900/40',
    accent: 'bg-sky-600',
    title: 'Nhận thông báo tự động',
    desc: 'Hệ thống tự động gửi nhắc nhở qua email và ứng dụng trước khi xe thu gom đến khu vực bạn.',
    cta: 'Bật thông báo',
    route: '/thong-bao',
  },
  {
    icon: 'receipt_long',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-100 dark:border-amber-900/40',
    accent: 'bg-amber-500',
    title: 'Quản lý hóa đơn',
    desc: 'Xem lịch sử và thanh toán phí vệ sinh môi trường trực tuyến nhanh chóng, an toàn.',
    cta: 'Xem hóa đơn',
    route: '/thanh-toan',
  },
  {
    icon: 'rate_review',
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-100 dark:border-rose-900/40',
    accent: 'bg-rose-600',
    title: 'Gửi phản ánh',
    desc: 'Báo cáo sự cố liên quan đến thu gom rác trực tiếp đến đúng bộ phận xử lý có thẩm quyền.',
    cta: 'Gửi phản ánh',
    route: '/phan-anh',
  },
];

// Hướng dẫn 3 bước sử dụng hệ thống
const STEPS = [
  {
    step: '01',
    icon: 'person_add',
    title: 'Tạo tài khoản',
    desc: 'Đăng ký miễn phí với email và thông tin cư dân. Xác nhận email để kích hoạt tài khoản.',
  },
  {
    step: '02',
    icon: 'location_on',
    title: 'Chọn khu vực',
    desc: 'Tra cứu lịch theo Tỉnh/Thành phố, Phường/Xã và Tổ dân cư của bạn.',
  },
  {
    step: '03',
    icon: 'notifications_active',
    title: 'Nhận nhắc nhở',
    desc: 'Hệ thống tự động gửi thông báo đúng lịch — không bao giờ bỏ lỡ ngày thu gom rác.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser && normalizeRole(currentUser.role) === ROLES.ADMIN;

  return (
    <main>
      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="home-hero">
        <div className="max-w-container-max-width mx-auto px-margin-desktop grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold mb-6 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Quận Sơn Trà, Đà Nẵng
            </div>
            <h1 className="font-display-hero text-display-hero text-on-surface mb-6 leading-tight">
              {isAdmin ? (
                <>Quản trị hệ thống <span className="text-primary">nhanh chóng</span>, toàn diện</>
              ) : (
                <>Tra cứu lịch thu gom rác, <span className="text-primary">nhận nhắc lịch</span> đúng ngày</>
              )}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-lg">
              {isAdmin
                ? 'Quản lý thông tin tài khoản người dùng, theo dõi và xử lý các phản ánh, góp ý từ cư dân hiệu quả.'
                : 'Theo dõi lịch theo khu vực, nhận thông báo tự động và thanh toán phí vệ sinh trực tuyến trong một nền tảng duy nhất.'}
            </p>
            <div className="flex flex-wrap gap-4">
              {isAdmin ? (
                <button
                  onClick={() => navigate('/quan-ly')}
                  className="bg-primary text-on-primary px-8 py-4 rounded-xl font-label-md text-label-md hover:opacity-90 transition-all shadow-lg cursor-pointer"
                >
                  Quản lý ngay
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/tra-cuu')}
                    className="bg-primary text-on-primary px-8 py-4 rounded-xl font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all shadow-lg cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">search</span>
                    Tra cứu lịch ngay
                  </button>
                  {!currentUser && (
                    <button
                      onClick={() => navigate('/register')}
                      className="border-2 border-primary text-primary px-8 py-4 rounded-xl font-label-md text-label-md hover:bg-primary/5 active:scale-95 transition-all cursor-pointer"
                    >
                      Đăng ký miễn phí
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-surface-container-lowest">
              <img
                alt="Giao diện EcoSchedule"
                className="w-full h-auto"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvi_jaX7OIemLEPWedKwTNGyTqsPK8fQivVPoyuUdfRAHF-q1b55YT6bjzTQwjIfWMKk8OiGSHU3o3NO6DxMpe5NEey3lESENYacaG94JMXXWxizGF6TStjLZvadn0PZY-_BeACEHw_hZJAmAncOgA8NWJleDBjmQGNudtSOz9n4nZfhGpDIQvb9Hjb1QLrAn83SxthRhcrjzpebfw3mzSAPdb1UHf2j7vOZBTuQHEQs9sR-3TY0OQICHYnSi8cj9_Msvlefc2MqQ"
              />
            </div>
            {/* Floating notification widget */}
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hidden lg:block">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Nhắc nhở ngày mai</p>
                  <p className="text-xs text-slate-500">Rác hữu cơ · 07:30 sáng</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1">
                <div className="bg-emerald-500 h-1 rounded-full w-4/5"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      {!isAdmin && (
        <section className="relative -mt-10 z-20 pb-4">
          <div className="max-w-container-max-width mx-auto px-margin-desktop">
            <div
              className="bg-emerald-700 rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-2xl">location_searching</span>
                </div>
                <div>
                  <p className="text-white font-bold text-base">Tra cứu lịch thu gom ngay tại khu vực của bạn</p>
                  <p className="text-emerald-200 text-sm">Nhập phường/xã để xem lịch chính xác theo địa chỉ nhà bạn</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/tra-cuu')}
                className="bg-white text-emerald-700 font-bold px-7 py-3 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-2 flex-shrink-0 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined">search</span>
                Tra cứu ngay
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Feature Highlights ────────────────────────────────── */}
      {!isAdmin && (
        <section className="py-24">
          <div className="max-w-container-max-width mx-auto px-margin-desktop">
            {/* Section header */}
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold mb-4 border border-emerald-200 dark:border-emerald-800">
                <span className="material-symbols-outlined text-sm">star</span>
                Tính năng nổi bật
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-3">
                Tất cả những gì bạn cần
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">
                EcoSchedule cung cấp đầy đủ công cụ giúp cư dân quản lý lịch thu gom rác, hóa đơn và phản ánh một cách dễ dàng.
              </p>
            </div>

            {/* Feature cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.route}
                  className={`group relative bg-white dark:bg-slate-800 rounded-2xl border ${f.border} p-6 flex flex-col card-shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden`}
                >
                  {/* Top accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${f.accent}`}></div>

                  {/* Icon */}
                  <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-5 mt-2`}>
                    <span className={`material-symbols-outlined ${f.color} text-2xl`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {f.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-headline-md text-base font-bold text-on-surface mb-2">{f.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed flex-grow">{f.desc}</p>

                  {/* CTA */}
                  <button
                    onClick={() => navigate(f.route)}
                    className={`mt-5 w-full py-2.5 rounded-xl text-sm font-bold ${f.bg} ${f.color} border ${f.border} hover:opacity-80 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer`}
                  >
                    {f.cta}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ──────────────────────────────────────── */}
      {!isAdmin && (
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-outline-variant">
          <div className="max-w-container-max-width mx-auto px-margin-desktop">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold mb-4 border border-emerald-200 dark:border-emerald-800">
                <span className="material-symbols-outlined text-sm">help_outline</span>
                Cách sử dụng
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-3">
                Bắt đầu chỉ trong 3 bước
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto">
                Đăng ký và thiết lập tài khoản chỉ mất 2 phút — hoàn toàn miễn phí.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line on desktop */}
              <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-emerald-200 dark:bg-emerald-900/60 -z-0"></div>

              {STEPS.map((s, idx) => (
                <div key={s.step} className="flex flex-col items-center text-center relative z-10">
                  {/* Step bubble */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-200 dark:border-emerald-800 shadow-md flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {s.icon}
                      </span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-black">{idx + 1}</span>
                    </div>
                  </div>
                  <h3 className="font-headline-md font-bold text-on-surface mb-2">{s.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA button */}
            {!currentUser && (
              <div className="text-center mt-14">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-primary text-on-primary px-10 py-4 rounded-xl font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all shadow-lg cursor-pointer inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">app_registration</span>
                  Đăng ký miễn phí ngay
                </button>
                <p className="text-on-surface-variant text-sm mt-3">
                  Đã có tài khoản?{' '}
                  <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline cursor-pointer">
                    Đăng nhập tại đây
                  </button>
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Stats Block ───────────────────────────────────────── */}
      <section className="py-16 border-y border-outline-variant">
        <div className="max-w-container-max-width mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <p className="font-display-hero text-display-hero text-primary mb-2">10,000+</p>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Hộ dân tin dùng</p>
          </div>
          <div>
            <p className="font-display-hero text-display-hero text-primary mb-2">98%</p>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Thu gom đúng hạn</p>
          </div>
          <div>
            <p className="font-display-hero text-display-hero text-primary mb-2">50+</p>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Khu vực phủ sóng</p>
          </div>
        </div>
      </section>
    </main>
  );
}
