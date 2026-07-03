const { normalizeRole } = require('../constants/roles');

/**
 * Chuẩn hóa dữ liệu user từ Firestore
 */
function normalizeUser(data, uid) {
  return {
    uid:      data.uid      || uid,
    fullName: data.fullName || data['Họ và tên']   || data['ho_va_ten'] || '',
    email:    data.email    || data['e-mail']       || data['Email']     || '',
    phone:    data.phone    || data['điện thoại']   || data['dien_thoai']|| '',
    address:  data.address  || data['Địa chỉ']      || data['dia_chi']   || '',
    area:     data.area     || data['khu vực']      || data['khu_vuc']   || '',
    role:     normalizeRole(data.role || data['vai trò'] || data['Vai trò']),
    emailVerified: data.emailVerified ?? true,
  };
}

/**
 * Chuẩn hóa chuỗi tiếng Việt để so sánh fuzzy (bỏ dấu, viết thường).
 */
function normalizeStr(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { normalizeUser, normalizeStr };
