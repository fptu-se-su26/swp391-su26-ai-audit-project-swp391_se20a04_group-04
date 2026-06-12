import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
import { ROLES, normalizeRole } from '../constants/roles';

export default function Guide() {
  const user = authService.getCurrentUser();
  if (user && normalizeRole(user.role) === ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Hero Section */}
      <section className="bg-emerald-50 dark:bg-emerald-950/20 py-16 border-b border-emerald-100 dark:border-emerald-900/30">
        <div className="max-w-container-max-width mx-auto px-margin-desktop text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-4 leading-tight">
            TÓM TẮT HƯỚNG DẪN PHÂN LOẠI RÁC TẠI NGUỒN
          </h1>
          <p className="font-body-lg text-body-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Phân loại rác tại nguồn giúp giảm thiểu khối lượng chôn lấp và bảo vệ môi trường. 
            Theo quy định của Luật Bảo vệ Môi trường, rác thải sinh hoạt bắt buộc phải được chia thành 3 nhóm chính.
          </p>
        </div>
      </section>

      {/* Main Content: 3 Waste Groups */}
      <section className="max-w-container-max-width mx-auto px-margin-desktop py-12">
        <div className="mb-10 text-center md:text-left">
          <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
            1. Phân loại thành 3 nhóm chính
          </h2>
          <div className="h-1 w-20 bg-emerald-600 rounded-full mx-auto md:mx-0"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Nhóm rác thải hữu cơ */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-600"></div>
            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2">
              Rác hữu cơ (Dễ phân hủy)
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold mb-4 tracking-wider">
              Màu xanh lá / Xanh dương
            </p>
            <div className="flex-grow mb-6">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Các loại bao gồm:
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Thức ăn thừa, rau củ quả, vỏ trái cây, bã trà, bã cà phê, hoa, lá cây, cỏ.
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <strong>Cách xử lý:</strong> Bỏ vào túi hoặc thùng rác màu xanh lá hoặc xanh dương.
            </div>
          </div>

          {/* Nhóm rác thải tái chế */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
            <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-2">
              Rác tái chế (Có thể tái sử dụng)
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold mb-4 tracking-wider">
              Màu vàng
            </p>
            <div className="flex-grow mb-6">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Các loại bao gồm:
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                Giấy báo, bìa carton, vỏ lon bia/nước ngọt, chai/lọ nhựa, túi nilon sạch, vỏ hộp sữa.
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Cách xử lý:</strong> Làm sạch, để ráo nước, gấp gọn (đối với bìa carton) rồi bỏ vào túi hoặc thùng rác màu vàng.
            </div>
          </div>

          {/* Nhóm rác vô cơ & Nguy hại */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-600"></div>
            <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 mb-2">
              Rác vô cơ (Phần còn lại)
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-semibold mb-4 tracking-wider">
              Màu cam / Đỏ / Xám
            </p>
            <div className="flex-grow mb-6">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Các loại bao gồm:
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Hộp xốp, túi nilon bẩn, sành, sứ, thủy tinh vỡ, vỏ sò, vỏ ốc, tàn thuốc lá.
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed mt-2 border-t border-rose-100 dark:border-rose-950/40 pt-2">
                <strong>Lưu ý rác nguy hại:</strong> Pin cũ, bóng đèn hỏng, hóa chất, vỏ chai thuốc trừ sâu phải bỏ riêng vào hộp và ghi chú rõ ràng chữ "Rác nguy hại".
              </p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              <strong>Cách xử lý:</strong> Bỏ vào túi hoặc thùng rác màu cam, màu đỏ hoặc màu xám.
            </div>
          </div>
        </div>

        {/* Section 2: Residential Guidelines */}
        <div>
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
              2. Quy trình thực hiện tại khu dân cư
            </h2>
            <div className="h-1 w-20 bg-emerald-600 rounded-full mx-auto md:mx-0"></div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Chuẩn bị */}
              <div className="flex flex-col">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
                  Bước 1: Chuẩn bị
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                  Trang bị sẵn thùng đựng
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Mỗi hộ gia đình nên chủ động trang bị sẵn từ 2 đến 3 thùng đựng rác hoặc túi đựng rác khác màu nhau.
                </p>
              </div>

              {/* Lưu trữ */}
              <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700/60 pt-6 md:pt-0 md:pl-8">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
                  Bước 2: Lưu trữ
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                  Phân tách rác đúng cách
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Phải thực hiện buộc kín miệng túi rác hữu cơ để ngăn ngừa triệt để việc bốc mùi hôi hoặc thu hút côn trùng.
                </p>
              </div>

              {/* Bàn giao */}
              <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700/60 pt-6 md:pt-0 md:pl-8">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-2">
                  Bước 3: Bàn giao
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
                  Đúng lịch & đúng nơi
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Đưa rác đến đúng nơi tập kết quy định, tuân thủ nghiêm ngặt theo đúng khung giờ và lịch trình thu gom của khu dân cư.
                </p>
              </div>

            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
