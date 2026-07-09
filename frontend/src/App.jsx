import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { SongbookProvider, useSongbook } from './context/SongbookContext';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import SongList from './pages/SongList';
import SongDetail from './pages/SongDetail';
import SongForm from './pages/SongForm';
import AdminSettings from './pages/AdminSettings';
import Profile from './pages/Profile';

const OrgAdminRoute = ({ children }) => {
  const { isActiveOrgAdmin } = useSongbook();
  if (!isActiveOrgAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function OrganizationScope({ children }) {
  const { organizationId } = useParams();
  const { activeOrganizationId, switchOrganization } = useSongbook();

  useEffect(() => {
    if (organizationId && organizationId !== activeOrganizationId) {
      switchOrganization(organizationId);
    }
  }, [organizationId, activeOrganizationId, switchOrganization]);

  if (organizationId && organizationId !== activeOrganizationId) {
    return (
      <div className="py-24 text-center text-sm font-semibold text-gray-500">
        Loading organization...
      </div>
    );
  }

  return children;
}

// Wrapper to force a clean remount when viewing a different song
function SongDetailWrapper() {
  const { id } = useParams();
  return <SongDetail key={id} />;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/org/:organizationId" element={<OrganizationScope><SongList /></OrganizationScope>} />
        <Route path="/org/:organizationId/song/:id" element={<OrganizationScope><SongDetailWrapper /></OrganizationScope>} />
        
        {/* Organization Admin Routes */}
        <Route 
          path="/org/:organizationId/admin/add" 
          element={
            <OrganizationScope>
              <OrgAdminRoute>
              <SongForm />
              </OrgAdminRoute>
            </OrganizationScope>
          } 
        />
        <Route 
          path="/org/:organizationId/admin/edit/:id" 
          element={
            <OrganizationScope>
              <OrgAdminRoute>
              <SongForm />
              </OrgAdminRoute>
            </OrganizationScope>
          } 
        />
        
        {/* Organization Admin Routes */}
        <Route 
          path="/org/:organizationId/admin/settings" 
          element={
            <OrganizationScope>
              <OrgAdminRoute>
              <AdminSettings />
              </OrgAdminRoute>
            </OrganizationScope>
          } 
        />
        
        <Route path="/profile" element={<Profile />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SongbookProvider>
        <AppRoutes />
      </SongbookProvider>
    </BrowserRouter>
  );
}
