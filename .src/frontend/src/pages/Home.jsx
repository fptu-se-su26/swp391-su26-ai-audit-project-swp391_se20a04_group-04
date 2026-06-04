import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  return (
    <main>
      {/* Hero Section */}
      <section className="home-hero">
        <div className="max-w-container-max-width mx-auto px-margin-desktop grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display-hero text-display-hero text-on-surface mb-6 leading-tight">
              Tra cứu lịch thu gom rác nhanh, <span className="text-primary">nhận nhắc lịch</span> đúng ngày
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-lg">
              Theo dõi lịch theo khu vực, nhận thông báo tự động và thanh toán phí vệ sinh trực tuyến trong một nền tảng duy nhất.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/tra-cuu')}
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-label-md text-label-md hover:opacity-90 transition-all shadow-lg cursor-pointer"
              >
                Kiểm tra lịch
              </button>
              <button 
                onClick={() => navigate('/thanh-toan')}
                className="border-2 border-primary text-primary px-8 py-4 rounded-xl font-label-md text-label-md hover:bg-primary/5 transition-all cursor-pointer"
              >
                Thanh toán phí
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-surface-container-lowest">
              <img alt="Dashboard interface" className="w-full h-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvi_jaX7OIemLEPWedKwTNGyTqsPK8fQivVPoyuUdfRAHF-q1b55YT6bjzTQwjIfWMKk8OiGSHU3o3NO6DxMpe5NEey3lESENYacaG94JMXXWxizGF6TStjLZvadn0PZY-_BeACEHw_hZJAmAncOgA8NWJleDBjmQGNudtSOz9n4nZfhGpDIQvb9Hjb1QLrAn83SxthRhcrjzpebfw3mzSAPdb1UHf2j7vOZBTuQHEQs9sR-3TY0OQICHYnSi8cj9_Msvlefc2MqQ"/>
            </div>
            {/* Floating Widget */}
            <div className="absolute -bottom-6 -left-6 bg-surface-container-lowest p-6 rounded-2xl shadow-xl border border-outline-variant hidden lg:block">
              <div className="flex items-center gap-4 mb-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                <span className="font-label-md text-label-md">Nhắc nhở ngày mai</span>
              </div>
              <p className="font-body-md text-body-md font-semibold">Rác hữu cơ - 07:30 sáng</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search Bar */}
      <section className="relative -mt-16 z-20">
        <div className="max-w-container-max-width mx-auto px-margin-desktop">
          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-xl flex flex-col md:flex-row gap-6 items-end border border-outline-variant">
            <div className="flex-1 w-full">
              <label className="font-label-md text-label-md block mb-3 text-on-surface-variant">Phường/Xã</label>
              <div className="relative">
                <select className="w-full h-14 bg-surface-container-low border border-outline-variant rounded-xl px-4 appearance-none focus:border-primary outline-none">
                  <option>Chọn Phường/Xã</option>
                  <option>Phường Bến Nghé</option>
                  <option>Phường Đa Kao</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-4 pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="flex-1 w-full">
              <label className="font-label-md text-label-md block mb-3 text-on-surface-variant">Tổ/Dân phố</label>
              <div className="relative">
                <select className="w-full h-14 bg-surface-container-low border border-outline-variant rounded-xl px-4 appearance-none focus:border-primary outline-none">
                  <option>Chọn Tổ/Khu phố</option>
                  <option>Tổ dân phố 12</option>
                  <option>Khu phố 4</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-4 pointer-events-none">expand_more</span>
              </div>
            </div>
            <button 
              onClick={() => navigate('/tra-cuu')}
              className="bg-primary text-on-primary h-14 px-12 rounded-xl font-label-md text-label-md hover:opacity-90 transition-all flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer"
            >
              <span className="material-symbols-outlined">search</span>
              Tra cứu
            </button>
          </div>
        </div>
      </section>

      {/* Upcoming Schedule */}
      <section className="py-24">
        <div className="max-w-container-max-width mx-auto px-margin-desktop">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Lịch thu gom sắp tới</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Khu vực: Phường Bến Nghé, Quận 1</p>
            </div>
            <a className="text-primary font-label-md text-label-md flex items-center gap-1 hover:underline" href="#">
              Xem lịch tháng
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {/* Card 1 */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant card-shadow flex flex-col">
              <div className="h-2 bg-primary"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-xs font-bold">Ngày mai</div>
                  <span className="material-symbols-outlined text-on-surface-variant">event</span>
                </div>
                <div className="mb-6">
                  <p className="text-on-surface-variant font-label-sm text-label-sm mb-1">Thứ Ba, 24/10</p>
                  <h3 className="font-headline-md text-headline-md text-primary">Rác Hữu Cơ</h3>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-8">
                  <span className="material-symbols-outlined">schedule</span>
                  07:00 - 08:30
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-secondary font-label-md text-label-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Đúng hạn
                  </span>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant card-shadow flex flex-col">
              <div className="h-2 bg-secondary"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-xs font-bold">2 ngày tới</div>
                  <span className="material-symbols-outlined text-on-surface-variant">event</span>
                </div>
                <div className="mb-6">
                  <p className="text-on-surface-variant font-label-sm text-label-sm mb-1">Thứ Năm, 26/10</p>
                  <h3 className="font-headline-md text-headline-md text-secondary">Rác Tái Chế</h3>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-8">
                  <span className="material-symbols-outlined">schedule</span>
                  08:00 - 09:30
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-on-surface-variant font-label-md text-label-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">pending</span>
                    Sắp tới
                  </span>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant card-shadow flex flex-col">
              <div className="h-2 bg-primary"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold">4 ngày tới</div>
                  <span className="material-symbols-outlined text-on-surface-variant">event</span>
                </div>
                <div className="mb-6">
                  <p className="text-on-surface-variant font-label-sm text-label-sm mb-1">Thứ Bảy, 28/10</p>
                  <h3 className="font-headline-md text-headline-md text-primary">Rác Hữu Cơ</h3>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-8">
                  <span className="material-symbols-outlined">schedule</span>
                  07:00 - 08:30
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-on-surface-variant font-label-md text-label-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">pending</span>
                    Sắp tới
                  </span>
                </div>
              </div>
            </div>
            {/* Card 4 */}
            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant card-shadow flex flex-col">
              <div className="h-2 bg-error"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-xs font-bold">Hàng tháng</div>
                  <span class="material-symbols-outlined text-on-surface-variant">event</span>
                </div>
                <div className="mb-6">
                  <p className="text-on-surface-variant font-label-sm text-label-sm mb-1">Thứ Hai, 30/10</p>
                  <h3 className="font-headline-md text-headline-md text-error">Rác Nguy Hại</h3>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-8">
                  <span className="material-symbols-outlined">schedule</span>
                  09:00 - 11:00
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-on-surface-variant font-label-md text-label-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Định kỳ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Block */}
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
