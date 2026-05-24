export default function Guide() {
  return (
    <main className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Hero Section */}
      <section className="bg-emerald-50 dark:bg-emerald-950/20 py-20 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="max-w-container-max-width mx-auto px-margin-desktop text-center">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-5xl mb-4 animate-bounce-subtle">
            eco
          </span>
          <h1 className="font-headline-lg text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-6 max-w-3xl mx-auto leading-tight">
            Bảo vệ môi trường bắt đầu từ việc phân loại rác
          </h1>
          <p className="font-body-lg text-body-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Hành động nhỏ của bạn hôm nay kiến tạo nên một tương lai xanh bền vững cho cộng đồng EcoSchedule Đà Nẵng.
          </p>
        </div>
      </section>

      {/* Main Content: Waste Sorting Grid */}
      <section className="max-w-container-max-width mx-auto px-margin-desktop py-16">
        <div className="text-center md:text-left mb-10">
          <div className="flex items-center gap-2.5 mb-3 justify-center md:justify-start">
            <span className="h-5 w-1 bg-emerald-600 rounded-full"></span>
            <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Hướng dẫn cơ bản
            </h2>
          </div>
          <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            Phân loại rác tại nguồn theo 3 nhóm chính
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Column 1: Rác Hữu Cơ */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-4xl">compost</span>
            </div>
            <h3 className="font-headline-md text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-4">Rác Hữu Cơ</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Thường dùng làm phân compost sinh học hoặc thức ăn chăn nuôi.</p>
            <ul className="space-y-3 w-full mb-6 flex-grow">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="material-symbols-outlined text-emerald-600 scale-75">check_circle</span> Thức ăn thừa, cơm nguội
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="material-symbols-outlined text-emerald-600 scale-75">check_circle</span> Rau củ quả hỏng, vỏ trái cây
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="material-symbols-outlined text-emerald-600 scale-75">check_circle</span> Xác động vật, xương cá nhỏ
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md">
                <span className="material-symbols-outlined text-emerald-600 scale-75">check_circle</span> Bã trà, bã cà phê, hoa tươi
              </li>
            </ul>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-xl w-full text-xs text-emerald-800 dark:text-emerald-300">
              <strong>Cách xử lý:</strong> Bỏ vào túi bóng tự hủy sinh học hoặc thùng màu xanh lá. Buộc chặt đầu túi trước khi bàn giao.
            </div>
          </div>

          {/* Column 2: Rác Tái Chế */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/40 rounded-full text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-4xl">recycling</span>
            </div>
            <h3 className="font-headline-md text-xl font-bold text-amber-700 dark:text-amber-400 mb-4">Rác Tái Chế</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Vật liệu sạch có thể thu hồi để tái chế thành các sản phẩm tiện ích mới.</p>
            <ul className="space-y-3 w-full mb-6 flex-grow">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="material-symbols-outlined text-amber-500 scale-75">check_circle</span> Giấy báo, tạp chí, bìa carton
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="material-symbols-outlined text-amber-500 scale-75">check_circle</span> Vỏ chai nhựa, túi nilon sạch
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="material-symbols-outlined text-amber-500 scale-75">check_circle</span> Vỏ lon bia, lon nước ngọt kim loại
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md">
                <span className="material-symbols-outlined text-amber-500 scale-75">check_circle</span> Hộp sữa giấy, chai lọ thủy tinh
              </li>
            </ul>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl w-full text-xs text-amber-800 dark:text-amber-300">
              <strong>Cách xử lý:</strong> Rửa sạch, để ráo nước hoàn toàn và nén gọn rác thải trước khi cho vào thùng màu vàng hoặc xám.
            </div>
          </div>

          {/* Column 3: Rác Nguy Hại & Khác */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-600"></div>
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 rounded-full text-rose-600 dark:text-rose-400">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <h3 className="font-headline-md text-xl font-bold text-rose-700 dark:text-rose-400 mb-4">Rác Nguy Hại &amp; Khác</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Các loại rác độc hại cho con người, môi trường hoặc không thể tái chế.</p>
            <ul className="space-y-3 w-full mb-6 flex-grow">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="material-symbols-outlined text-rose-600 scale-75">check_circle</span> Pin cũ, bình ắc quy hỏng
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="material-symbols-outlined text-rose-600 scale-75">check_circle</span> Bóng đèn huỳnh quang, thủy tinh vỡ
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md border-b border-slate-100 dark:border-slate-700/50 pb-2">
                <span className="material-symbols-outlined text-rose-600 scale-75">check_circle</span> Chai lọ hóa chất bảo vệ thực vật, sành sứ
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-body-md">
                <span className="material-symbols-outlined text-rose-600 scale-75">check_circle</span> Bỉm tã, hộp xốp đựng thức ăn bẩn
              </li>
            </ul>
            <div className="bg-rose-50 dark:bg-rose-950/20 p-3.5 rounded-xl w-full text-xs text-rose-800 dark:text-rose-300">
              <strong>Cách xử lý:</strong> Bỏ vào túi/thùng màu đỏ, ghi rõ nhãn cảnh báo nguy hiểm bên ngoài để nhân viên xử lý đặc biệt.
            </div>
          </div>
        </div>

        {/* Section 2: Residential Guidelines */}
        <div className="mb-20">
          <div className="text-center md:text-left mb-8">
            <div className="flex items-center gap-2.5 mb-3 justify-center md:justify-start">
              <span className="h-5 w-1 bg-emerald-600 rounded-full"></span>
              <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Quy trình thực hiện
              </h2>
            </div>
            <h3 className="font-headline-md text-2xl font-bold text-slate-800 dark:text-white">
              Hướng dẫn thực hiện tại khu dân cư
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-1.5">Chuẩn bị dụng cụ</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Mỗi hộ gia đình trang bị ít nhất 2-3 túi/thùng chứa rác phân biệt theo màu (màu xanh lá: hữu cơ, màu xám/vàng: tái chế, màu đỏ: nguy hại).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-1.5">Lưu trữ rác</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Tách biệt rác ngay khi thải ra. Rác hữu cơ phải buộc kín miệng túi tránh bốc mùi; rác tái chế làm sạch chất bẩn hữu cơ bám dính.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-1.5">Bàn giao đúng giờ</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Đặt rác đúng nơi quy định của khu dân cư. Bàn giao đúng khung giờ thu gom của xe rác hoặc theo lịch cụ thể trên hệ thống EcoSchedule.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Video Section */}
        <div className="w-full">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-headline-lg text-2xl font-bold text-slate-800 dark:text-white">Video hướng dẫn chi tiết</h2>
            <div className="h-[2px] flex-grow bg-slate-200 dark:bg-slate-700"></div>
          </div>
          
          <div className="relative group aspect-video rounded-3xl overflow-hidden shadow-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img 
              alt="Video hướng dẫn môi trường" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_fsAWFsWG3fd-5RuAXDUsSyZ5Hqigmvkr4h_zja3JojSsilgvLA-CrNT_kiVEu_ES0y6hOAXH5flex2tZ2i6g6Il-xVZg_nO9bzf4ofLibcKmYu2i32JtB7_WBzYXnf8koMgd4xUjLGsi3quZTY2-r0-KxSpEHpfcHUHsx5H1iDw6TDLg8v9EFw32-xtermk_PSClG2YlQhuyJMJvR34IPdZrAWYcIT9O5wMisQ1xIOlQjgw88gEbjh2-PeY0kclJ_P_PdS8_8Sc"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <button className="w-20 h-20 md:w-24 md:h-24 bg-white/90 rounded-full flex items-center justify-center text-emerald-600 shadow-2xl group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                <span className="material-symbols-outlined text-4xl md:text-5xl ml-2" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-white font-medium text-sm md:text-base">Quy trình phân loại và xử lý rác tại nguồn chuyên nghiệp cho cộng đồng văn minh.</p>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
