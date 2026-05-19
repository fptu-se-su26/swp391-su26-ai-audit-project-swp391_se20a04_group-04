import { Link } from 'react-router-dom';

export default function Notifications() {
  return (
    <main className="max-w-container-max-width mx-auto px-margin-desktop py-12">
      {/* Page Header & Breadcrumb */}
      <div className="flex flex-col gap-6 mb-10">
        <nav className="flex items-center gap-2 text-label-md text-on-surface-variant">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface font-semibold">Trung tâm thông báo</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Trung tâm thông báo</h1>
            <p className="text-body-md text-on-surface-variant">Cập nhật những tin tức mới nhất về lịch trình và dịch vụ của bạn.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm">
            <span className="material-symbols-outlined">done_all</span>
            Đánh dấu đã đọc tất cả
          </button>
        </div>
        {/* Horizontal Tabs Filter */}
        <div className="flex border-b border-outline-variant overflow-x-auto whitespace-nowrap">
          <button className="px-6 py-3 border-b-2 border-primary text-primary font-bold transition-all">Tất cả</button>
          <button className="px-6 py-3 border-b-2 border-transparent text-on-surface-variant hover:text-primary font-medium transition-all">Lịch thu gom</button>
          <button className="px-6 py-3 border-b-2 border-transparent text-on-surface-variant hover:text-primary font-medium transition-all">Thanh toán</button>
          <button className="px-6 py-3 border-b-2 border-transparent text-on-surface-variant hover:text-primary font-medium transition-all">Hệ thống</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-10 gap-gutter">
        {/* Left Column: Notification List */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {/* Notification Card (Unread) */}
          <div className="relative bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_20px_rgba(0,109,55,0.05)] border border-outline-variant/30 flex gap-5 group hover:border-primary/30 transition-all">
            <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-12 h-12 flex-shrink-0 bg-primary-container/10 rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-label-md text-on-surface group-hover:text-primary transition-colors">Ngày mai xe rác đến thu gom lúc 8h</h3>
                <span className="text-label-sm text-outline font-medium">2 giờ trước</span>
              </div>
              <p className="text-body-md text-on-surface-variant leading-relaxed">Vui lòng chuẩn bị rác hữu cơ vào thùng xanh lá và đặt trước cổng nhà trước 7:30 sáng mai.</p>
              <div className="mt-4 flex gap-3">
                <button className="px-4 py-1.5 bg-primary/10 text-primary rounded-lg text-label-sm font-semibold hover:bg-primary/20 transition-colors">Xem lịch chi tiết</button>
              </div>
            </div>
          </div>
          {/* Notification Card */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 flex gap-5 group hover:border-primary/30 transition-all opacity-80 hover:opacity-100">
            <div className="w-12 h-12 flex-shrink-0 bg-secondary-container/10 rounded-full flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-label-md text-on-surface">Thanh toán phí vệ sinh định kỳ tháng 12</h3>
                <span className="text-label-sm text-outline font-medium">1 ngày trước</span>
              </div>
              <p className="text-body-md text-on-surface-variant leading-relaxed">Hóa đơn số #INV-202412 cho khu vực Quận 1 đã được phát hành. Hạn chót thanh toán là ngày 05/12/2024.</p>
            </div>
          </div>
          {/* Notification Card (Unread) */}
          <div className="relative bg-surface-container-lowest p-6 rounded-xl shadow-[0_4px_20px_rgba(0,109,55,0.05)] border border-outline-variant/30 flex gap-5 group hover:border-primary/30 transition-all">
            <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-12 h-12 flex-shrink-0 bg-tertiary-container/10 rounded-full flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-label-md text-on-surface group-hover:text-primary transition-colors">Cập nhật chính sách phân loại nhựa mới</h3>
                <span className="text-label-sm text-outline font-medium">3 ngày trước</span>
              </div>
              <p className="text-body-md text-on-surface-variant leading-relaxed">Hệ thống vừa cập nhật danh mục các loại nhựa được phép tái chế. Vui lòng xem hướng dẫn mới để tránh bị từ chối thu gom.</p>
              <div className="mt-4">
                <button className="px-4 py-1.5 bg-primary/10 text-primary rounded-lg text-label-sm font-semibold hover:bg-primary/20 transition-colors">Xem hướng dẫn</button>
              </div>
            </div>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-8 py-4">
            <button className="p-2 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 bg-primary text-on-primary rounded-lg font-label-md">1</button>
            <button className="w-10 h-10 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors font-label-md">2</button>
            <button className="w-10 h-10 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors font-label-md">3</button>
            <span className="px-2 text-outline">...</span>
            <button className="w-10 h-10 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors font-label-md">12</button>
            <button className="p-2 border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
        {/* Right Column: Settings */}
        <aside className="md:col-span-3">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 sticky top-24 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">settings_suggest</span>
              <h2 className="font-headline-md text-headline-md text-on-surface">Tùy chọn nhận thông báo</h2>
            </div>
            <div className="flex flex-col gap-6">
              {/* Email Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-on-surface">Nhận qua Email</span>
                  <span className="text-label-sm text-on-surface-variant">Bản tin hàng tuần &amp; hóa đơn</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox"/>
                  <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {/* SMS Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-on-surface">Nhận qua SMS</span>
                  <span className="text-label-sm text-on-surface-variant">Thông báo khẩn cấp &amp; nhắc lịch</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only peer" type="checkbox"/>
                  <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              {/* Push Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-on-surface">Nhận Push Notification</span>
                  <span className="text-label-sm text-on-surface-variant">Cảnh báo trực tiếp trên ứng dụng</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox"/>
                  <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="pt-4 border-t border-outline-variant">
                <button className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm">
                  Lưu cài đặt
                </button>
              </div>
            </div>
            {/* Promo/Help Card in Sidebar */}
            <div className="mt-8 p-4 bg-primary-container/10 border border-primary-container/20 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">help_outline</span>
                <div>
                  <h4 className="text-label-md text-on-primary-container font-bold mb-1">Cần hỗ trợ?</h4>
                  <p className="text-label-sm text-on-surface-variant">Nếu bạn không nhận được thông báo, hãy kiểm tra phần cài đặt hệ thống trên điện thoại.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
