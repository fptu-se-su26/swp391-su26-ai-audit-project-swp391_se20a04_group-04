import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login/Login';
import ForgotPassword from './pages/Login/ForgotPassword';
import AdminManagement from './pages/Admin/AdminManagement';

import Home from './pages/Home';
import Notifications from './pages/Notifications';
import Payment from './pages/Payment';
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import Collector from './pages/Collector';
import Guide from './pages/Guide';
import ManagerInvoice from './pages/ManagerInvoice';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/quan-ly" element={<AdminManagement />} />
            <Route path="/tra-cuu" element={<Home />} />
            <Route path="/thong-bao" element={<Notifications />} />
            <Route path="/thanh-toan" element={<Payment />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/phan-anh" element={<Complaints />} />
            <Route path="/collector" element={<Collector />} />
            <Route path="/huong-dan" element={<Guide />} />
            <Route path="/hoa-don" element={<ManagerInvoice />} />
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
