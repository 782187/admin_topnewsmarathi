import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ArticleList from './pages/ArticleList';
import ArticleForm from './pages/ArticleForm';
import AdList from './pages/AdList';
import AdForm from './pages/AdForm';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#2a2a2a',
            color: '#fff',
            border: '1px solid #404040',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        
        {/* Public Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/articles/list" 
          element={
            <ProtectedRoute>
              <ArticleList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/articles/create" 
          element={
            <ProtectedRoute>
              <ArticleForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/articles/edit/:id" 
          element={
            <ProtectedRoute>
              <ArticleForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/ads/list" 
          element={
            <ProtectedRoute>
              <AdList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/ads/create" 
          element={
            <ProtectedRoute>
              <AdForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/ads/edit/:id" 
          element={
            <ProtectedRoute>
              <AdForm />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
