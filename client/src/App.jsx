import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomeDashboard from './pages/HomeDashboard';
import ProjectsPage from './pages/ProjectsPage';
import ProjectBoard from './pages/ProjectBoard';
import JoinProject from './pages/JoinProject';
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<AppLayout><HomeDashboard /></AppLayout>} />
        <Route path="/projects" element={<AppLayout><ProjectsPage /></AppLayout>} />
        <Route path="/project/:projectId" element={<AppLayout><ProjectBoard /></AppLayout>} />
        <Route path="/join/:token" element={<JoinProject />} />
        {/* Redirect root to auth by default */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;