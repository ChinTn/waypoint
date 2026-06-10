import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        {/* We will build the Dashboard in the next phase, for now just show a placeholder */}
        <Route path="/dashboard" element={
          <div className="min-h-screen flex items-center justify-center text-accent font-serif text-4xl">
            Welcome to the Dashboard.
          </div>
        } />
        {/* Redirect root to auth by default */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;