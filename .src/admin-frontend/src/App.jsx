import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/Login/ForgotPassword';
import ResetPassword from './pages/Login/ResetPassword';
import AdminManagement from './pages/Admin/AdminManagement';

import Notifications from './pages/Notifications';
import Payment from './pages/Payment';
import Complaints from './pages/Complaints';
import Collector from './pages/Collector';
import Guide from './pages/Guide';
import ManagerInvoice from './pages/ManagerInvoice';

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
            <Route path="/quan-ly" element={<AdminManagement />} />
            <Route path="/thong-bao" element={<Notifications />} />
            <Route path="/thanh-toan" element={<Payment />} />
            <Route path="/phan-anh" element={<Complaints />} />
            <Route path="/collector" element={<Collector />} />
            <Route path="/huong-dan" element={<Guide />} />
            <Route path="/hoa-don" element={<ManagerInvoice />} />
            <Route path="/" element={<Navigate to="/quan-ly" replace />} />
            <Route path="*" element={<Navigate to="/quan-ly" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
