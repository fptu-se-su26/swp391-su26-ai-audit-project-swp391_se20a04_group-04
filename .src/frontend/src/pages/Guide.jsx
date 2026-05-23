export default function Guide() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-[#e8f5e9] py-20">
        <div className="max-w-container-max-width mx-auto px-margin-desktop text-center">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-6 max-w-3xl mx-auto">
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
              </li>
            </ul>
          </div>
        </div>

      </section>
    </main>
  );
}
