export default function Guide() {
  return (
    <main className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Hero Section */}
      <section className="bg-emerald-50 dark:bg-emerald-950/20 py-20 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="max-w-container-max-width mx-auto px-margin-desktop text-center">
          <h1 className="font-headline-lg text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-6 max-w-3xl mx-auto leading-tight">
            Hướng Dẫn Phân Loại Rác Tại Nguồn
          </h1>
          <p className="font-body-lg text-body-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Phân loại rác tại nguồn giúp giảm thiểu khối lượng chôn lấp và bảo vệ môi trường theo quy định của Luật Bảo vệ Môi trường.
          </p>
        </div>
      </section>

      {/* Main Content: Waste Sorting Grid */}
      <section className="max-w-container-max-width mx-auto px-margin-desktop py-16">
        <div className="text-center md:text-left mb-10">
          <div className="flex items-center gap-2.5 mb-3 justify-center md:justify-start">
            <span className="h-5 w-1 bg-emerald-600 rounded-full"></span>
            <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Phần 1
            </h2>
          </div>
          <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            Phân loại thành 3 nhóm chính
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          
          {/* Column 1: Rác Hữu Cơ */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
            <h3 className="font-headline-md text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-4">Rác Hữu Cơ</h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Dễ phân hủy</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 flex-grow leading-relaxed">
              Gồm thức ăn thừa, rau củ quả, bã trà/cà phê, lá cây.
            </p>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl w-full text-xs text-emerald-800 dark:text-emerald-300">
              <strong>Cách xử lý:</strong> Bỏ vào thùng hoặc túi màu xanh lá hoặc xanh dương.
            </div>
          </div>

          {/* Column 2: Rác Tái Chế */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
            <h3 className="font-headline-md text-xl font-bold text-amber-700 dark:text-amber-400 mb-4">Rác Tái Chế</h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Có thể tái sử dụng</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 flex-grow leading-relaxed">
              Gồm giấy báo, bìa carton, vỏ lon, chai nhựa sạch.
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl w-full text-xs text-amber-800 dark:text-amber-300">
              <strong>Cách xử lý:</strong> Làm sạch, để ráo, gấp gọn và bỏ vào thùng hoặc túi màu vàng.
            </div>
          </div>

          {/* Column 3: Rác Vô Cơ & Nguy Hại */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-start relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-600"></div>
            <h3 className="font-headline-md text-xl font-bold text-rose-700 dark:text-rose-400 mb-4">Rác Vô Cơ</h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Phần còn lại &amp; nguy hại</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 flex-grow leading-relaxed">
              Gồm hộp xốp, nilon bẩn, sành sứ, thủy tinh vỡ.
            </p>
            <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl w-full text-xs text-rose-800 dark:text-rose-300 mb-3">
              <strong>Cách xử lý:</strong> Bỏ vào thùng hoặc túi màu cam, đỏ hoặc xám.
            </div>
            <div className="bg-rose-100 dark:bg-rose-950/40 p-4 rounded-xl w-full text-xs text-rose-950 dark:text-rose-200 font-medium">
              <strong>Lưu ý:</strong> Rác nguy hại như pin, bóng đèn hỏng phải bỏ riêng vào hộp ghi rõ &quot;Rác nguy hại&quot;.
            </div>
          </div>
        </div>

        {/* Section 2: Residential Guidelines */}
        <div className="mb-8">
          <div className="text-center md:text-left mb-8">
            <div className="flex items-center gap-2.5 mb-3 justify-center md:justify-start">
              <span className="h-5 w-1 bg-emerald-600 rounded-full"></span>
              <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Phần 2
              </h2>
            </div>
            <h3 className="font-headline-md text-2xl font-bold text-slate-800 dark:text-white">
              Quy trình thực hiện tại khu dân cư
            </h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-1.5">Chuẩn bị</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Mỗi hộ gia đình nên trang bị sẵn 2-3 thùng hoặc túi rác khác màu.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-1.5">Lưu trữ</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Phải buộc kín miệng túi rác hữu cơ để tránh mùi hôi và côn trùng.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-1.5">Bàn giao</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Đưa rác đến đúng nơi quy định, tuân thủ đúng khung giờ và lịch thu gom của khu dân cư.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
