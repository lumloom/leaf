import { HashRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import PlantForm from './pages/PlantForm.jsx';
import PlantDetail from './pages/PlantDetail.jsx';
import LogForm from './pages/LogForm.jsx';
import Spaces from './pages/Spaces.jsx';
import SpaceForm from './pages/SpaceForm.jsx';
import SoilRecipeForm from './pages/SoilRecipeForm.jsx';
import Compare from './pages/Compare.jsx';
import Passport from './pages/Passport.jsx';
import Stats from './pages/Stats.jsx';
import Settings from './pages/Settings.jsx';

// HashRouter: GitHub Pages 정적 호스팅에서도 새로고침이 깨지지 않는다.
export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plants/new" element={<PlantForm />} />
          <Route path="/plants/:id" element={<PlantDetail />} />
          <Route path="/plants/:id/edit" element={<PlantForm />} />
          <Route path="/plants/:id/log" element={<LogForm />} />
          <Route path="/plants/:id/soil" element={<SoilRecipeForm />} />
          <Route path="/plants/:id/compare" element={<Compare />} />
          <Route path="/plants/:id/passport" element={<Passport />} />
          <Route path="/spaces" element={<Spaces />} />
          <Route path="/spaces/new" element={<SpaceForm />} />
          <Route path="/spaces/:id/edit" element={<SpaceForm />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  );
}
