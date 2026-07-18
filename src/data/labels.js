// 공간·식물에서 함께 쓰는 선택지와 한글 라벨 정의

export const LIGHT_OPTIONS = [
  { value: 'direct', label: '직사광선' },
  { value: 'bright-indirect', label: '밝은 간접광' },
  { value: 'medium', label: '반그늘' },
  { value: 'low', label: '그늘' },
];

export const HUMIDITY_OPTIONS = [
  { value: 'moist', label: '물 많이' },
  { value: 'medium', label: '중간' },
  { value: 'dry', label: '건조 (과습주의)' },
];

export const AIRFLOW_OPTIONS = [
  { value: 'good', label: '통풍 좋음' },
  { value: 'normal', label: '통풍 보통' },
  { value: 'poor', label: '통풍 답답함' },
];

export const DIRECTION_OPTIONS = ['남향', '동향', '서향', '북향', '남동향', '남서향', '해당 없음'];

export const POT_MATERIAL_OPTIONS = ['토분', '플라스틱', '도자기', '시멘트', '유리', '기타'];

export const EVENT_TYPES = {
  diary: { label: '일기', icon: '🍃' },
  water: { label: '물주기', icon: '💧' },
  repot: { label: '분갈이', icon: '🪴' },
  fertilizer: { label: '비료', icon: '🌾' },
  newleaf: { label: '새잎', icon: '🌱' },
  prune: { label: '가지치기', icon: '✂️' },
  cutting: { label: '삽목/물꽂이', icon: '🫙' },
  move: { label: '화분위치변경', icon: '🧭' },
  pest: { label: '병충해', icon: '🐛' },
  photo: { label: '사진', icon: '📷' },
};

export const lightLabel = (v) => LIGHT_OPTIONS.find((o) => o.value === v)?.label ?? '';
export const airflowLabel = (v) => AIRFLOW_OPTIONS.find((o) => o.value === v)?.label ?? '';
export const humidityLabel = (v) => {
  const found = HUMIDITY_OPTIONS.find((o) => o.value === v);
  return found ? `습도 ${found.label}` : '';
};
