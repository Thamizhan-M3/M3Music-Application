import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Library from './pages/Library';
import Search from './pages/Search';
import Upload from './pages/Upload';
import Playlist from './pages/Playlist';
import LikedSongs from './pages/LikedSongs';

// Discovery Pages
import Discovery from './pages/Discovery';
import ArtistDetail from './pages/ArtistDetail';
import AlbumDetail from './pages/AlbumDetail';
import GenreDetail from './pages/GenreDetail';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManager from './pages/admin/UserManager';
import SongManager from './pages/admin/SongManager';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* User Routes */}
        <Route path="/" element={
          // <ProtectedRoute>
            <Layout />
          // </ProtectedRoute>
        }>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="explore" element={<Discovery />} />
          <Route path="artist/:name" element={<ArtistDetail />} />
          <Route path="album/:name" element={<AlbumDetail />} />
          <Route path="genre/:genre" element={<GenreDetail />} />
          <Route path="library" element={<Library />} />
          <Route path="playlist/:id" element={<Playlist />} />
          <Route path="collection/tracks" element={<LikedSongs />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          // <AdminRoute>
            <Layout isAdmin />
          // </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManager />} />
          <Route path="songs" element={<SongManager />} />
          <Route path="upload" element={<Upload />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
