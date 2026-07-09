import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { SongbookProvider, useSongbook } from './context/SongbookContext';
import Layout from './components/Layout';

// Pages
import SongList from './pages/SongList';
import SongDetail from './pages/SongDetail';
import SongForm from './pages/SongForm';
import AdminSettings from './pages/AdminSettings';
import Profile from './pages/Profile';

// Route Guards for Simulated Roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useSongbook();
  
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Wrapper to force a clean remount when viewing a different song
function SongDetailWrapper() {
  const { id } = useParams();
  return <SongDetail key={id} />;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SongList />} />
        <Route path="/song/:id" element={<SongDetailWrapper />} />
        
        {/* Admin/Developer Routes */}
        <Route 
          path="/admin/add" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'developer']}>
              <SongForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/edit/:id" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'developer']}>
              <SongForm />
            </ProtectedRoute>
          } 
        />
        
        {/* Organization Admin Routes */}
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'developer']}>
              <AdminSettings />
            </ProtectedRoute>
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
    <SongbookProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SongbookProvider>
  );
}
