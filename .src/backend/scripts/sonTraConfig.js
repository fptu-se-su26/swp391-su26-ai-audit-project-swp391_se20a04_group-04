/**
 * Phạm vi triển khai EcoSchedule - Quận Sơn Trà, Đà Nẵng
 * Firebase Project: swp391-database
 */
const PROJECT = {
  id: 'swp391-database',
  city: 'Thành phố Đà Nẵng',
  district: 'Quận Sơn Trà',
};

/**
 * 7 phường thuộc Quận Sơn Trà (Đà Nẵng)
 * Mỗi phường có danh sách tổ dân phố mẫu để seed.
 */
const SON_TRA_WARDS = [
  {
    slug: 'an_hai_bac',
    name: 'Phường An Hải Bắc',
    neighborhoods: ['Tổ 1', 'Tổ 2', 'Tổ 3'],
    lat: 16.0678,
    lng: 108.2412,
  },
  {
    slug: 'an_hai_dong',
    name: 'Phường An Hải Đông',
    neighborhoods: ['Tổ 4', 'Tổ 5'],
    lat: 16.0712,
    lng: 108.2489,
  },
  {
    slug: 'an_hai_tay',
    name: 'Phường An Hải Tây',
    neighborhoods: ['Tổ 6', 'Tổ 7'],
    lat: 16.0645,
    lng: 108.2356,
  },
  {
    slug: 'man_thai',
    name: 'Phường Mân Thái',
    neighborhoods: ['Tổ 5', 'Tổ 8', 'Tổ 9'],
    lat: 16.1050,
    lng: 108.2400,
  },
  {
    slug: 'nai_hien_dong',
    name: 'Phường Nại Hiên Đông',
    neighborhoods: ['Tổ 10', 'Tổ 11'],
    lat: 16.0923,
    lng: 108.2521,
  },
  {
    slug: 'phuoc_my',
    name: 'Phường Phước Mỹ',
    neighborhoods: ['Tổ 12', 'Tổ 13', 'Tổ 14'],
    lat: 16.0789,
    lng: 108.2567,
  },
  {
    slug: 'tho_quang',
    name: 'Phường Thọ Quang',
    neighborhoods: ['Tổ 7', 'Tổ 12', 'Tổ 15'],
    lat: 16.1123,
    lng: 108.2456,
  },
];

/** Nhóm tuyến thu gom theo khu vực địa lý trong quận */
const SON_TRA_ROUTE_GROUPS = [
  {
    id: 'route_son_tra_bac',
    name: 'Tuyến Bắc Sơn Trà',
    wardSlugs: ['an_hai_bac', 'an_hai_dong'],
    vehicleCode: 'DN-ST-01',
  },
  {
    id: 'route_son_tra_tay',
    name: 'Tuyến Tây Sơn Trà',
    wardSlugs: ['an_hai_tay', 'phuoc_my'],
    vehicleCode: 'DN-ST-02',
  },
  {
    id: 'route_son_tra_dong',
    name: 'Tuyến Đông Sơn Trà',
    wardSlugs: ['nai_hien_dong', 'man_thai'],
    vehicleCode: 'DN-ST-03',
  },
  {
    id: 'route_son_tra_nam',
    name: 'Tuyến Nam Sơn Trà',
    wardSlugs: ['tho_quang'],
    vehicleCode: 'DN-ST-04',
  },
];

function wardAreaId(slug) {
  return `area_ward_${slug}`;
}

function neighborhoodAreaId(wardSlug, neighborhood) {
  const num = neighborhood.replace(/\D/g, '') || '0';
  return `area_neighborhood_${wardSlug}_to_${num}`;
}

function wardBySlug(slug) {
  return SON_TRA_WARDS.find((w) => w.slug === slug);
}

module.exports = {
  PROJECT,
  SON_TRA_WARDS,
  SON_TRA_ROUTE_GROUPS,
  wardAreaId,
  neighborhoodAreaId,
  wardBySlug,
};
