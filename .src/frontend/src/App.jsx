import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Payment from './pages/Payment';
import Guide from './pages/Guide';
import Notifications from './pages/Notifications';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard';
import CollectorDashboard from './pages/Collector';
import AssignedReports from './pages/Collector/AssignedReports';
import ManagerInvoice from './pages/ManagerInvoice';
import ResidentSchedules from './resident/ResidentSchedules';
import Complaints from './pages/Complaints';
import AdminManagement from './pages/Admin/AdminManagement';

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
            <Route path="/thong-bao" element={<Notifications />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collector" element={<CollectorDashboard />} />
            <Route path="/collector/reports" element={<AssignedReports />} />
            <Route path="/dashboard/invoices/new" element={<ManagerInvoice />} />
            <Route path="/phan-anh" element={<Complaints />} />
            <Route path="/quan-ly" element={<AdminManagement />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

