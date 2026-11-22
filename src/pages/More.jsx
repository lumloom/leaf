import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

const links = [
  { to: '/stats', icon: 'chart', title: '정원의 시간', copy: '새잎과 물주기, 쌓인 기록을 돌아봐요.' },
  { to: '/memories', icon: 'archive', title: '추억 속 식물', copy: '보내준 식물의 이야기도 그대로 간직해요.' },
  { to: '/settings', icon: 'settings', title: '보관과 설정', copy: '계정 동기화, ZIP 백업과 개인정보를 관리해요.' },
];

export default function More() {
  return <main className="page more-page"><div className="page-heading-row"><div><span className="eyebrow">MORE FOR YOUR GARDEN</span><h1 className="page-title">정원을 더 오래 간직하기</h1><p className="page-sub">기록을 돌아보고, 안전하게 보관하는 도구를 모았어요.</p></div></div><div className="more-grid">{links.map((item) => <Link to={item.to} className="more-card" key={item.to}><span><Icon name={item.icon} /></span><div><strong>{item.title}</strong><p>{item.copy}</p></div><Icon name="arrow" className="more-arrow" /></Link>)}</div><div className="more-note"><Icon name="leaf" /><div><strong>기록은 먼저 이 기기에 저장돼요.</strong><p>Lumloom 계정 동기화와 ZIP 백업을 함께 사용하면 더 안전하게 간직할 수 있어요.</p></div></div></main>;
}
