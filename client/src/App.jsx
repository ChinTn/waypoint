import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomeDashboard from './pages/HomeDashboard';
import ProjectsPage from './pages/ProjectsPage';
import ProjectOverview from './pages/ProjectOverview';
import ProjectBoard from './pages/ProjectBoard';
import ProjectDocuments from './pages/ProjectDocuments';
import ProjectFlow from './pages/ProjectFlow';
import JoinProject from './pages/JoinProject';
import MyTasksPage from './pages/MyTasksPage';
import AppLayout from './components/layout/AppLayout';
import CommandPalette from './components/layout/CommandPalette';

function App() {
  return (
    <BrowserRouter>
    <CommandPalette />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<AppLayout><HomeDashboard /></AppLayout>} />
        <Route path="/projects" element={<AppLayout><ProjectsPage /></AppLayout>} />
        <Route path="/my-tasks" element={<AppLayout><MyTasksPage /></AppLayout>} />
        <Route path="/project/:projectId" element={<AppLayout><ProjectOverview /></AppLayout>} />
        <Route path="/project/:projectId/board" element={<AppLayout><ProjectBoard /></AppLayout>} />
        <Route path="/project/:projectId/documents" element={<AppLayout><ProjectDocuments /></AppLayout>} />
        <Route path="/project/:projectId/flow" element={<AppLayout><ProjectFlow /></AppLayout>} />
        <Route path="/join/:token" element={<JoinProject />} />
        {/* Redirect root to auth by default */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;