import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminPortal from './pages/AdminPortal';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Homepage Route */}
        <Route path="/" element={<Home />} />
        
        {/* Admin CMS Portal Route */}
        <Route path="/admin" element={<AdminPortal />} />
        
        {/* Catch-all Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
