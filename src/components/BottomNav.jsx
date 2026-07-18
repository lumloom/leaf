import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', icon: '🌿', label: '식물', end: true },
  { to: '/spaces', icon: '🏠', label: '공간' },
  { to: '/stats', icon: '📊', label: '통계' },
  { to: '/settings', icon: '⚙️', label: '설정' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon">{t.icon}</span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
