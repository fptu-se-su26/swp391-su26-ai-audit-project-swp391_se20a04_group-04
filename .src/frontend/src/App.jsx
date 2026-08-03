import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import AIChatBox from './components/AIChatBox';
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
import CollectorAttendance from './pages/Collector/Attendance';
import ManagerInvoice from './pages/ManagerInvoice';
import ResidentSchedules from './resident/ResidentSchedules';
import Complaints from './pages/Complaints';
import EditProfile from './pages/EditProfile';

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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collector" element={<CollectorDashboard />} />
            <Route path="/collector/attendance" element={<CollectorAttendance />} />
            <Route path="/collector/reports" element={<AssignedReports />} />
            <Route path="/dashboard/invoices/new" element={<ManagerInvoice />} />
            <Route path="/phan-anh" element={<Complaints />} />
            <Route path="/ho-so" element={<EditProfile />} />
          </Routes>
        </div>
        <Footer />
        <AIChatBox />
      </div>
    </Router>
  );
}

export default App;
