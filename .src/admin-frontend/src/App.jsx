import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/Login/ForgotPassword';
import ResetPassword from './pages/Login/ResetPassword';
import AdminManagement from './pages/Admin/AdminManagement';

import Home from './pages/Home';
import Notifications from './pages/Notifications';
import Dashboard from './pages/Dashboard';
import ManagerInvoice from './pages/ManagerInvoice';
import ProtectedRoute from './components/ProtectedRoute';
import { ROLES } from './constants/roles';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Toaster position="top-right" />
        <Header />
        <div className="flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/quan-ly" element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}><AdminManagement /></ProtectedRoute>} />
            <Route path="/thong-bao" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ADMIN]}><Dashboard /></ProtectedRoute>} />
            <Route path="/hoa-don" element={<ProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ADMIN]}><ManagerInvoice /></ProtectedRoute>} />
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
