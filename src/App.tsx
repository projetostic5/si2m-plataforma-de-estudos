import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { StudentRegister } from './components/StudentRegister';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ExamResults } from './components/ExamResults';
import { ExamTaking } from './components/ExamTaking';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RoleRedirect() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        navigate('/login', { replace: true });
      } else if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/estudante', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecionando...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        navigate('/login', { replace: true });
      } else if (requireAdmin && profile.role !== 'admin') {
        navigate('/estudante', { replace: true });
      } else if (!requireAdmin && profile.role === 'admin') {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, profile, loading, requireAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;
  if (requireAdmin && profile.role !== 'admin') return null;
  if (!requireAdmin && profile.role === 'admin') return null;

  return <>{children}</>;
}

function StudentSimulados() {
  return <StudentDashboard />;
}

function StudentResultados() {
  return <StudentDashboard />;
}

function StudentConfiguracoes() {
  return <StudentDashboard />;
}

function StudentTakeExam() {
  return <StudentDashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<StudentRegister />} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/estudante" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/estudante/simulados" element={<ProtectedRoute><StudentSimulados /></ProtectedRoute>} />
      <Route path="/estudante/resultados" element={<ProtectedRoute><StudentResultados /></ProtectedRoute>} />
      <Route path="/estudante/configuracoes" element={<ProtectedRoute><StudentConfiguracoes /></ProtectedRoute>} />
      <Route path="/estudante/plano" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/estudante/simulado/:id" element={<ProtectedRoute><StudentTakeExam /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
