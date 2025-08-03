import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import Predictions from './pages/Predictions';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Users from './pages/Users';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Role-based Route Component
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/items" 
              element={
                <ProtectedRoute>
                  <Items />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/stock-in" 
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <StockIn />
                  </RoleRoute>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/stock-out" 
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <StockOut />
                  </RoleRoute>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/predictions" 
              element={
                <ProtectedRoute>
                  <Predictions />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <Orders />
                  </RoleRoute>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['admin', 'owner']}>
                    <Reports />
                  </RoleRoute>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={['admin']}>
                    <Users />
                  </RoleRoute>
                </ProtectedRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;