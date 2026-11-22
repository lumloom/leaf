import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';

const primary = [
  { to: '/', label: '정원 홈', icon: 'home', end: true },
  { to: '/plants', label: '식물', icon: 'leaf' },
  { to: '/spaces', label: '공간', icon: 'space' },
  { to: '/timeline', label: '성장기록', icon: 'journal' },
  { to: '/stats', label: '정원 통계', icon: 'chart' },
];

export default function DesktopHeader() {
  return (
    <header className="desktop-header">
      <NavLink to="/" className="desktop-brand" aria-label="Leaf 정원 홈">
        <span className="brand-mark"><Icon name="sprout" size={21} /></span>
        <span><strong>Leaf</strong><small>Lumloom garden journal</small></span>
      </NavLink>
      <nav aria-label="주요 메뉴">
        {primary.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon name={item.icon} size={17} />{item.label}
          </NavLink>
        ))}
      </nav>
      <NavLink to="/more" className="header-more" aria-label="더보기"><Icon name="more" /></NavLink>
    </header>
  );
}
