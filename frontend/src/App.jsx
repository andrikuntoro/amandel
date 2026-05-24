import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import EventsPage from './pages/EventsPage';
import MatchPage from './pages/MatchPage';
import RewardsPage from './pages/RewardsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

const PrivateRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'ADMIN' ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#111128', color: '#fff', border: '1px solid #2A2A4A' },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/join/:inviteCode" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="match" element={<MatchPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
