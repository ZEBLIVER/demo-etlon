import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { NoAccess } from '@/components/common';
import { useCurrentUser } from '@/lib/auth';
import LoginPage from '@/pages/LoginPage';
import OverviewPage from '@/pages/OverviewPage';
import LocationsPage from '@/pages/LocationsPage';
import LocationPage from '@/pages/LocationPage';
import ScreenPage from '@/pages/ScreenPage';
import MenuPage from '@/pages/MenuPage';
import MenuItemPage from '@/pages/MenuItemPage';
import UsersPage from '@/pages/UsersPage';
import AuditPage from '@/pages/AuditPage';
import PlayerPage from '@/pages/PlayerPage';

function RequireAuth() {
  const user = useCurrentUser();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <Layout />;
}

function AdminOnly({ children }: { children: JSX.Element }) {
  const user = useCurrentUser();
  return user?.role === 'ADMIN' ? children : <NoAccess />;
}

function Home() {
  const user = useCurrentUser();
  return user?.role === 'ADMIN' ? <OverviewPage /> : <Navigate to="/locations" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route index element={<Home />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="locations/:id" element={<LocationPage />} />
        <Route path="screens/:id" element={<ScreenPage />} />
        <Route path="menu" element={<AdminOnly><MenuPage /></AdminOnly>} />
        <Route path="menu/:id" element={<AdminOnly><MenuItemPage /></AdminOnly>} />
        <Route path="users" element={<AdminOnly><UsersPage /></AdminOnly>} />
        <Route path="audit" element={<AdminOnly><AuditPage /></AdminOnly>} />
        <Route path="*" element={<NoAccess message="Такой страницы нет." />} />
      </Route>
      <Route path="/:code/:num" element={<PlayerPage />} />
    </Routes>
  );
}
