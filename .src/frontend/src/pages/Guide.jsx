export default function Guide() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-[#e8f5e9] py-20">
        <div className="max-w-container-max-width mx-auto px-margin-desktop text-center">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-6 max-w-3xl mx-auto">
            Bảo vệ môi trường bắt đầu từ việc phân loại rác
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Hành động nhỏ của bạn hôm nay kiến tạo nên một tương lai xanh bền vững cho cộng đồng.
          </p>
        </div>
      </section>
      {/* Main Content: Waste Sorting Grid */}
      <section className="max-w-container-max-width mx-auto px-margin-desktop py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-20">
          {/* Column 1: Rác Hữu Cơ */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
            <div className="mb-6 p-4 bg-primary-container rounded-full text-white">
              <span className="material-symbols-outlined text-4xl">compost</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-primary mb-4">Rác Hữu Cơ</h2>
            <ul className="space-y-3 w-full">
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md border-b border-surface-container pb-2">
                <span className="material-symbols-outlined text-primary scale-75">check_circle</span> Thức ăn thừa
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md border-b border-surface-container pb-2">
                <span className="material-symbols-outlined text-primary scale-75">check_circle</span> Rau củ quả
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md border-b border-surface-container pb-2">
                <span className="material-symbols-outlined text-primary scale-75">check_circle</span> Vỏ trái cây
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md">
                <span className="material-symbols-outlined text-primary scale-75">check_circle</span> Bã trà/cà phê
              </li>
            </ul>
          </div>
          {/* Column 2: Rác Tái Chế */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-secondary"></div>
            <div className="mb-6 p-4 bg-secondary-container rounded-full text-white">
              <span className="material-symbols-outlined text-4xl">recycling</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-secondary mb-4">Rác Tái Chế</h2>
            <ul className="space-y-3 w-full">
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md border-b border-surface-container pb-2">
                <span className="material-symbols-outlined text-secondary scale-75">check_circle</span> Giấy báo, bìa carton
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md border-b border-surface-container pb-2">
                <span className="material-symbols-outlined text-secondary scale-75">check_circle</span> Vỏ chai nhựa
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md border-b border-surface-container pb-2">
                <span className="material-symbols-outlined text-secondary scale-75">check_circle</span> Lon kim loại
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md">
                <span className="material-symbols-outlined text-secondary scale-75">check_circle</span> Thủy tinh
              </li>
            </ul>
          </div>
          {/* Column 3: Rác Nguy Hại */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-error"></div>
            <div className="mb-6 p-4 bg-error-container rounded-full text-error">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-error mb-4">Rác Nguy Hại &amp; Khác</h2>
            <ul className="space-y-3 w-full">
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md border-b border-surface-container pb-2">
                <span className="material-symbols-outlined text-error scale-75">check_circle</span> Pin cũ
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md border-b border-surface-container pb-2">
                <span className="material-symbols-outlined text-error scale-75">check_circle</span> Bóng đèn huỳnh quang
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md border-b border-surface-container pb-2">
                <span className="material-symbols-outlined text-error scale-75">check_circle</span> Chai lọ hóa chất
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant font-body-md">
                <span className="material-symbols-outlined text-error scale-75">check_circle</span> Thiết bị điện tử hỏng
              </li>
            </ul>
          </div>
        </div>
        {/* Video Section */}
        <div className="w-full">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Video hướng dẫn chi tiết</h2>
            <div className="h-[2px] flex-grow bg-outline-variant"></div>
          </div>
          <div className="relative group aspect-video rounded-3xl overflow-hidden shadow-xl bg-surface-container-high border border-outline-variant">
            <img alt="Video hướng dẫn môi trường" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_fsAWFsWG3fd-5RuAXDUsSyZ5Hqigmvkr4h_zja3JojSsilgvLA-CrNT_kiVEu_ES0y6hOAXH5flex2tZ2i6g6Il-xVZg_nO9bzf4ofLibcKmYu2i32JtB7_WBzYXnf8koMgd4xUjLGsi3quZTY2-r0-KxSpEHpfcHUHsx5H1iDw6TDLg8v9EFw32-xtermk_PSClG2YlQhuyJMJvR34IPdZrAWYcIT9O5wMisQ1xIOlQjgw88gEbjh2-PeY0kclJ_P_PdS8_8Sc"/>
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <button className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center text-primary shadow-2xl group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                <span className="material-symbols-outlined text-5xl ml-2" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white font-label-md">Quy trình phân loại và xử lý rác tại nguồn chuyên nghiệp cho cộng đồng văn minh.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
