import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer bg-surface-container-highest dark:bg-inverse-surface border-t border-outline-variant dark:border-outline py-12 mt-auto">
      <div className="max-w-container-max-width mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-3xl">recycling</span>
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">EcoSchedule</span>
          </div>
          <div className="space-y-4 text-on-surface-variant font-body-md text-body-md">
            <p className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary">location_on</span>
              123 Đường Môi Trường, Quận 1, TP. HCM
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">call</span>
              1900 123 456
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">mail</span>
              contact@ecoschedule.vn
            </p>
          </div>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-primary dark:text-primary-fixed mb-6 uppercase tracking-wider">Về chúng tôi</h4>
          <ul className="space-y-4 font-body-md text-body-md text-on-surface-variant">
            <li><a className="footer__link hover:text-primary transition-colors" href="#">Giới thiệu</a></li>
            <li><a className="footer__link hover:text-primary transition-colors" href="#">Đối tác</a></li>
            <li><a className="footer__link hover:text-primary transition-colors" href="#">Dự án cộng đồng</a></li>
            <li><a className="footer__link hover:text-primary transition-colors" href="#">Tuyển dụng</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-primary dark:text-primary-fixed mb-6 uppercase tracking-wider">Hệ thống Quản lý</h4>
          <ul className="space-y-4 font-body-md text-body-md text-on-surface-variant">
            <li><a className="hover:text-primary transition-colors" href="/dashboard">Bảng điều khiển</a></li>
            <li><a className="hover:text-primary transition-colors" href="/thong-bao">Thông báo</a></li>
            <li><a className="hover:text-primary transition-colors" href="/hoa-don">Quản lý hóa đơn</a></li>
            <li><a className="hover:text-primary transition-colors" href="/quan-ly">Quản trị viên</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-primary dark:text-primary-fixed mb-6 uppercase tracking-wider">Kết nối</h4>
          <div className="flex gap-4 mb-8">
            <a className="footer__social-button w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all" href="#">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a className="footer__social-button w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all" href="#">
              <span className="material-symbols-outlined">video_library</span>
            </a>
            <a className="footer__social-button w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all" href="#">
              <span className="material-symbols-outlined">chat_bubble</span>
            </a>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant italic">Cài đặt ứng dụng trên điện thoại để nhận thông báo thời gian thực.</p>
        </div>
      </div>
      <div className="max-w-container-max-width mx-auto px-margin-desktop pt-8 border-t border-outline-variant">
        <p className="footer__copy font-body-md text-body-md text-on-surface-variant text-center">
          © 2024 EcoSchedule. Cleanliness and order for our community.
        </p>
      </div>
    </footer>
  );
}
