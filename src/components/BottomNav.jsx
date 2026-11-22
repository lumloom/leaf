import { NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';

const tabs = [
  { to: '/', icon: 'home', label: '홈', end: true },
  { to: '/plants', icon: 'leaf', label: '식물' },
  { to: '/timeline', icon: 'journal', label: '기록' },
  { to: '/spaces', icon: 'space', label: '공간' },
  { to: '/more', icon: 'more', label: '더보기' },
];

export default function BottomNav() {
  const location = useLocation();
  const moreActive = ['/more', '/stats', '/settings', '/memories'].some((path) => location.pathname.startsWith(path));
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => ((isActive || (t.to === '/more' && moreActive)) ? 'active' : '')}>
          <span className="nav-icon"><Icon name={t.icon} size={21} /></span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
