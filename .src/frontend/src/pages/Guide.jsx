export default function Guide() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-[#e8f5e9] py-20">
        <div className="max-w-container-max-width mx-auto px-margin-desktop text-center">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-6 max-w-3xl mx-auto">
<<<<<<< HEAD
            Hướng dẫn phân loại rác tại nguồn
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Phân loại rác tại nguồn giúp giảm thiểu khối lượng chôn lấp và bảo vệ môi trường. Rác sinh hoạt bắt buộc chia thành 3 nhóm chính.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-container-max-width mx-auto px-margin-desktop py-16">
        
        <div className="mb-12">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 border-b pb-4">1. Phân loại theo 3 nhóm chính</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Hữu cơ */}
            <div className="bg-surface-container-lowest p-8 rounded-xl border-l-4 border-l-green-600 border-t border-r border-b border-outline-variant shadow-sm flex flex-col">
              <h3 className="font-headline-sm text-headline-sm text-green-700 mb-4">A. Rác hữu cơ (Dễ phân hủy)</h3>
              <p className="font-body-md text-on-surface-variant mb-4 font-semibold">Thường dùng làm phân compost hoặc thức ăn chăn nuôi.</p>
              <ul className="list-disc pl-5 space-y-2 mb-6 font-body-md text-on-surface flex-grow">
                <li><strong>Ví dụ:</strong> Thức ăn thừa, rau củ quả, vỏ trái cây, bã trà/cà phê, hoa, lá cây.</li>
              </ul>
              <div className="bg-green-50 p-4 rounded-lg mt-auto">
                <p className="font-label-md text-green-800"><strong>Cách xử lý:</strong> Bỏ vào túi/thùng rác màu xanh lá hoặc xanh dương.</p>
              </div>
            </div>

            {/* Tái chế */}
            <div className="bg-surface-container-lowest p-8 rounded-xl border-l-4 border-l-yellow-500 border-t border-r border-b border-outline-variant shadow-sm flex flex-col">
              <h3 className="font-headline-sm text-headline-sm text-yellow-700 mb-4">B. Rác tái chế (Có thể tái sử dụng)</h3>
              <p className="font-body-md text-on-surface-variant mb-4 font-semibold">Vật liệu qua sử dụng có thể thu hồi tái chế thành sản phẩm mới.</p>
              <ul className="list-disc pl-5 space-y-2 mb-6 font-body-md text-on-surface flex-grow">
                <li><strong>Ví dụ:</strong> Giấy báo, bìa carton, vỏ lon, chai nhựa, túi nilon sạch, vỏ hộp sữa.</li>
              </ul>
              <div className="bg-yellow-50 p-4 rounded-lg mt-auto">
                <p className="font-label-md text-yellow-800"><strong>Cách xử lý:</strong> Làm sạch, để ráo nước, gấp gọn rồi bỏ vào túi/thùng rác màu vàng.</p>
              </div>
            </div>

            {/* Vô cơ */}
            <div className="bg-surface-container-lowest p-8 rounded-xl border-l-4 border-l-red-600 border-t border-r border-b border-outline-variant shadow-sm flex flex-col">
              <h3 className="font-headline-sm text-headline-sm text-red-700 mb-4">C. Rác vô cơ (Rác thải còn lại)</h3>
              <p className="font-body-md text-on-surface-variant mb-4 font-semibold">Không thể tái chế, cần đem chôn lấp hoặc đốt.</p>
              <ul className="list-disc pl-5 space-y-2 mb-6 font-body-md text-on-surface flex-grow">
                <li><strong>Ví dụ:</strong> Hộp xốp, túi nilon bẩn, sành sứ, thủy tinh vỡ, tàn thuốc lá.</li>
                <li className="text-red-600"><strong>Rác nguy hại:</strong> Pin, bóng đèn, hóa chất... cần bỏ riêng vào túi/hộp ghi "Rác nguy hại".</li>
              </ul>
              <div className="bg-red-50 p-4 rounded-lg mt-auto">
                <p className="font-label-md text-red-800"><strong>Cách xử lý:</strong> Bỏ vào túi/thùng rác màu cam, đỏ hoặc xám.</p>
              </div>
            </div>

          </div>
        </div>

        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 border-b pb-4">2. Hướng dẫn thực hiện tại khu dân cư</h2>
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant shadow-sm">
            <ul className="space-y-4 font-body-md text-on-surface">
              <li className="flex gap-4">
                <span className="font-bold min-w-[120px]">Chuẩn bị dụng cụ:</span>
                <span>Mỗi hộ gia đình nên trang bị ít nhất 2 - 3 thùng rác hoặc túi rác khác màu (VD: Thùng xanh cho rác hữu cơ, thùng vàng cho rác tái chế, thùng đỏ cho rác vô cơ/nguy hại).</span>
              </li>
              <li className="flex gap-4">
                <span className="font-bold min-w-[120px]">Lưu trữ rác:</span>
                <span>Rác hữu cơ cần được buộc kín miệng túi để tránh bốc mùi hôi và côn trùng.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-bold min-w-[120px]">Bàn giao rác:</span>
                <span>Đặt rác đúng nơi quy định của khu dân cư. Đảm bảo giao rác đúng khung giờ hoặc phân loại theo đúng lịch thu gom của tổ dân phố.</span>
=======
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
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
              </li>
            </ul>
          </div>
        </div>
<<<<<<< HEAD

=======
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
>>>>>>> dab39dbd0183b50eeafa6fadf2fbb79058580e92
      </section>
    </main>
  );
}
