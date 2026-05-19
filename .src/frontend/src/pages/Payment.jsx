import { Link } from 'react-router-dom';

export default function Payment() {
  return (
    <main className="max-w-container-max-width mx-auto px-margin-desktop py-8">
      {/* Breadcrumb & Title */}
      <section className="mb-8">
        <nav className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-2">
          <Link to="/">Trang chủ</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-semibold">Thanh toán</span>
        </nav>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Thanh toán phí vệ sinh môi trường</h1>
      </section>
      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Left Column: Invoice & Payment */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Current Invoice Card */}
          <div className="bg-surface-container-lowest rounded-xl p-8 card-shadow border border-surface-container">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-headline-md text-headline-md mb-1 text-on-surface">Hóa đơn hiện tại</h2>
                <p className="text-on-surface-variant">Kỳ thanh toán: <span className="font-semibold text-on-surface">Tháng 10/2024</span></p>
              </div>
              <span className="bg-error-container text-on-error-container px-4 py-1 rounded-full font-label-md text-label-md">
                Chưa thanh toán
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 border-t border-b border-surface-container py-6 mb-6">
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Mã khách hàng</p>
                <p className="font-body-md font-semibold text-on-surface">KH12345678</p>
              </div>
              <div>
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Chủ hộ</p>
                <p className="font-body-md font-semibold text-on-surface">Nguyễn Văn An</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-label-sm font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">Địa chỉ</p>
                <p className="font-body-md text-on-surface">123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-headline-md text-headline-md text-primary">Tổng tiền: 30.000 VNĐ</p>
            </div>
          </div>
          {/* Payment Methods */}
          <div className="bg-surface-container-lowest rounded-xl p-8 card-shadow border border-surface-container">
            <h3 className="font-headline-md text-headline-md mb-6 text-on-surface">Chọn phương thức thanh toán</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card: Credit */}
              <label className="relative flex items-center p-4 rounded-lg border border-surface-container-high cursor-pointer hover:bg-surface-container-low transition-colors border-primary bg-surface-container-low">
                <input defaultChecked className="hidden" name="payment" type="radio"/>
                <span className="material-symbols-outlined mr-4 text-primary">credit_card</span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">Thẻ tín dụng / Ghi nợ</p>
                </div>
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </label>
              {/* Card: MoMo */}
              <label className="relative flex items-center p-4 rounded-lg border border-surface-container-high cursor-pointer hover:bg-surface-container-low transition-colors">
                <input className="hidden" name="payment" type="radio"/>
                <span className="material-symbols-outlined mr-4 text-on-surface-variant">account_balance_wallet</span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">Ví MoMo</p>
                </div>
                <span className="material-symbols-outlined text-outline-variant">radio_button_unchecked</span>
              </label>
              {/* Card: VNPay */}
              <label className="relative flex items-center p-4 rounded-lg border border-surface-container-high cursor-pointer hover:bg-surface-container-low transition-colors">
                <input className="hidden" name="payment" type="radio"/>
                <span className="material-symbols-outlined mr-4 text-on-surface-variant">qr_code_2</span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">VNPay</p>
                </div>
                <span className="material-symbols-outlined text-outline-variant">radio_button_unchecked</span>
              </label>
              {/* Card: Bank Transfer */}
              <label className="relative flex items-center p-4 rounded-lg border border-surface-container-high cursor-pointer hover:bg-surface-container-low transition-colors">
                <input className="hidden" name="payment" type="radio"/>
                <span className="material-symbols-outlined mr-4 text-on-surface-variant">account_balance</span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">Chuyển khoản ngân hàng</p>
                </div>
                <span className="material-symbols-outlined text-outline-variant">radio_button_unchecked</span>
              </label>
            </div>
            <button className="mt-8 w-full md:w-auto px-10 py-4 bg-primary text-on-primary rounded-full font-headline-md text-headline-md active:scale-95 transition-transform flex items-center justify-center gap-2">
              <span>Xác nhận thanh toán</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
        {/* Right Column: History */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container-lowest rounded-xl p-8 card-shadow border border-surface-container sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Lịch sử giao dịch</h3>
              <span className="material-symbols-outlined text-primary">history</span>
            </div>
            <div className="space-y-6">
              {/* History Item 1 */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Tháng 9/2024</p>
                    <p className="text-label-sm text-on-surface-variant">30.000 VNĐ</p>
                  </div>
                </div>
                <span className="text-primary font-label-sm font-semibold">Thành công</span>
              </div>
              {/* History Item 2 */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Tháng 8/2024</p>
                    <p className="text-label-sm text-on-surface-variant">30.000 VNĐ</p>
                  </div>
                </div>
                <span className="text-primary font-label-sm font-semibold">Thành công</span>
              </div>
              {/* History Item 3 */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Tháng 7/2024</p>
                    <p className="text-label-sm text-on-surface-variant">30.000 VNĐ</p>
                  </div>
                </div>
                <span className="text-primary font-label-sm font-semibold">Thành công</span>
              </div>
            </div>
            <a className="mt-8 block text-center py-3 rounded-lg border-2 border-primary text-primary font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-all" href="#">
              Xem tất cả lịch sử
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
