/**
 * NotificationSettings.jsx
 * Component sidebar cài đặt tùy chọn nhận thông báo (Email, SMS, Push).
 * Nhận settings hiện tại và callbacks qua props, không tự gọi API.
 */

const CHANNELS = [
  { key: 'email', label: 'Nhận qua Email',           desc: 'Bản tin hàng tuần & hóa đơn' },
  { key: 'push',  label: 'Nhận Push Notification',   desc: 'Cảnh báo trực tiếp trên ứng dụng' },
];


/**
 * @param {Object}   settings        - { email: boolean, sms: boolean, push: boolean }
 * @param {Function} onSettingChange - Hàm cập nhật state settings ở component cha
 * @param {Function} onSave          - Hàm gọi API lưu cài đặt
 * @param {boolean}  saving          - Đang trong quá trình lưu
 * @param {boolean}  saved           - Vừa lưu thành công
 */
export default function NotificationSettings({ settings, onSettingChange, onSave, saving, saved }) {
  return (
    <aside className="md:col-span-3">
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 sticky top-24 shadow-sm">

        {/* Tiêu đề */}
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">settings_suggest</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Tùy chọn nhận thông báo</h2>
        </div>

        <div className="flex flex-col gap-6">
          {/* Các toggle kênh nhận thông báo */}
          {CHANNELS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-md text-on-surface">{label}</span>
                <span className="text-label-sm text-on-surface-variant">{desc}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings[key] ?? false}
                  onChange={(e) => onSettingChange(key, e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          ))}

          {/* Nút Lưu cài đặt */}
          <div className="pt-4 border-t border-outline-variant">
            <button
              onClick={onSave}
              disabled={saving}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang lưu...
                </>
              ) : saved ? (
                <>
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Đã lưu!
                </>
              ) : (
                'Lưu cài đặt'
              )}
            </button>
          </div>
        </div>

        {/* Hộp trợ giúp */}
        <div className="mt-8 p-4 bg-primary-container/10 border border-primary-container/20 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[20px]">help_outline</span>
            <div>
              <h4 className="text-label-md text-on-primary-container font-bold mb-1">Cần hỗ trợ?</h4>
              <p className="text-label-sm text-on-surface-variant">
                Nếu bạn không nhận được thông báo, hãy kiểm tra phần cài đặt hệ thống trên điện thoại.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
