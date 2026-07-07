import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Payment from './pages/Payment';
import Guide from './pages/Guide';
import Notifications from './pages/Notifications';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/Login/ForgotPassword';
import ResetPassword from './pages/Login/ResetPassword';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard';
import CollectorDashboard from './pages/Collector';
import AssignedReports from './pages/Collector/AssignedReports';
import ManagerInvoice from './pages/ManagerInvoice';
import ResidentSchedules from './resident/ResidentSchedules';
import Complaints from './pages/Complaints';
import ProtectedRoute from './components/ProtectedRoute';
import { ROLES } from './constants/roles';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tra-cuu" element={<ResidentSchedules />} />
            <Route path="/thanh-toan" element={<Payment />} />
            <Route path="/huong-dan" element={<Guide />} />
            <Route path="/thong-bao" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.MANAGER]}><Dashboard /></ProtectedRoute>} />
            <Route path="/collector" element={<ProtectedRoute allowedRoles={[ROLES.COLLECTOR]}><CollectorDashboard /></ProtectedRoute>} />
            <Route path="/collector/reports" element={<ProtectedRoute allowedRoles={[ROLES.COLLECTOR]}><AssignedReports /></ProtectedRoute>} />
            <Route path="/dashboard/invoices/new" element={<ProtectedRoute allowedRoles={[ROLES.MANAGER]}><ManagerInvoice /></ProtectedRoute>} />
            <Route path="/phan-anh" element={<ProtectedRoute allowedRoles={[ROLES.RESIDENT, ROLES.COLLECTOR, ROLES.MANAGER]}><Complaints /></ProtectedRoute>} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
