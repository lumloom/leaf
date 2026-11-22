import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import DesktopHeader from './components/DesktopHeader.jsx';
import DialogHost from './components/DialogHost.jsx';
import { startSync } from './data/sync.js';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Plants = lazy(() => import('./pages/Plants.jsx'));
const PlantForm = lazy(() => import('./pages/PlantForm.jsx'));
const PlantDetail = lazy(() => import('./pages/PlantDetail.jsx'));
const LogForm = lazy(() => import('./pages/LogForm.jsx'));
const Spaces = lazy(() => import('./pages/Spaces.jsx'));
const SpaceForm = lazy(() => import('./pages/SpaceForm.jsx'));
const SoilRecipeForm = lazy(() => import('./pages/SoilRecipeForm.jsx'));
const Compare = lazy(() => import('./pages/Compare.jsx'));
const Passport = lazy(() => import('./pages/Passport.jsx'));
const Stats = lazy(() => import('./pages/Stats.jsx'));
const Memories = lazy(() => import('./pages/Memories.jsx'));
const GrowthTimeline = lazy(() => import('./pages/GrowthTimeline.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const More = lazy(() => import('./pages/More.jsx'));

// HashRouter: GitHub Pages 정적 호스팅에서도 새로고침이 깨지지 않는다.
export default function App() {
  useEffect(() => {
    startSync();
  }, []);

  return (
    <HashRouter>
      <div className="app-shell">
        <DesktopHeader />
        <Suspense fallback={<div className="route-loading" role="status"><span /><p>정원을 불러오는 중이에요…</p></div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plants" element={<Plants />} />
            <Route path="/plants/new" element={<PlantForm />} />
            <Route path="/plants/:id" element={<PlantDetail />} />
            <Route path="/plants/:id/edit" element={<PlantForm />} />
            <Route path="/plants/:id/log" element={<LogForm />} />
            <Route path="/plants/:id/log/:eventId" element={<LogForm />} />
            <Route path="/plants/:id/soil" element={<SoilRecipeForm />} />
            <Route path="/plants/:id/compare" element={<Compare />} />
            <Route path="/plants/:id/passport" element={<Passport />} />
            <Route path="/spaces" element={<Spaces />} />
            <Route path="/spaces/new" element={<SpaceForm />} />
            <Route path="/spaces/:id/edit" element={<SpaceForm />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/timeline" element={<GrowthTimeline />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/more" element={<More />} />
          </Routes>
        </Suspense>
        <BottomNav />
        <DialogHost />
      </div>
    </HashRouter>
  );
}
