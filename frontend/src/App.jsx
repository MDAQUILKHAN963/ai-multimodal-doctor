import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import { SkeletonCard } from './components/Skeleton.jsx';
import { useAuth } from './context/AuthContext.jsx';

// Auth pages load eagerly — needed on first render for unauthenticated users
import Login    from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// All other pages are lazy-loaded for code splitting
const Dashboard      = lazy(() => import('./pages/Dashboard.jsx'));
const XrayAnalysis   = lazy(() => import('./pages/XrayAnalysis.jsx'));
const SymptomChat    = lazy(() => import('./pages/SymptomChat.jsx'));
const History        = lazy(() => import('./pages/History.jsx'));
const Profile        = lazy(() => import('./pages/Profile.jsx'));
const Settings       = lazy(() => import('./pages/Settings.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const NotFound       = lazy(() => import('./pages/NotFound.jsx'));

const PageFallback = () => (
  <div className="pt-10 space-y-4">
    <SkeletonCard rows={2} />
    <SkeletonCard rows={4} />
  </div>
);

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-full flex flex-col bg-dark-900">
      <Navbar />

      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
        <p className="text-amber-600/90 text-xs text-center font-medium">
          ⚕ Educational use only — Not a substitute for professional medical advice. Always consult a qualified doctor.
        </p>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login"                   element={<Login />} />
            <Route path="/register"                element={<Register />} />
            <Route path="/forgot-password"         element={<ForgotPassword />} />
            <Route path="/reset-password/:token"   element={<ResetPassword />} />

            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/xray"     element={<XrayAnalysis />} />
              <Route path="/symptoms" element={<SymptomChat />} />
              <Route path="/history"  element={<History />} />
              <Route path="/profile"  element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin"    element={
                <AdminRoute><AdminDashboard /></AdminRoute>
              } />
            </Route>

            {/* 404 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*"    element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="border-t border-slate-200 bg-dark-800 py-4 mt-8">
        <p className="text-center text-xs text-slate-600">
          AI Doctor &mdash; Multimodal Medical AI Assistant &mdash; For educational use only
        </p>
      </footer>
    </div>
  );
}
