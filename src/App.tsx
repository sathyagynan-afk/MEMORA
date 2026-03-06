import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCircle, 
  AlertTriangle, 
  MessageSquare, 
  Heart, 
  Activity,
  Bell,
  ShieldAlert,
  Menu,
  X,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PatientDashboard from './components/PatientDashboard';
import CounselorDashboard from './components/CounselorDashboard';
import { Alert } from './types';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Fetch initial alerts
    fetch('/api/alerts')
      .then(res => res.json())
      .then(setAlerts);

    // WebSocket for real-time alerts
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NEW_ALERT') {
        setAlerts(prev => [message.data, ...prev]);
        // Simple notification sound or visual cue could be added here
      }
    };

    return () => ws.close();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Heart className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-semibold tracking-tight">MindGuard AI</span>
              </div>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-sm font-medium hover:text-emerald-600 transition-colors">Patient Portal</Link>
                <Link to="/counselor" className="text-sm font-medium hover:text-emerald-600 transition-colors flex items-center gap-2">
                  Counselor Dashboard
                  {alerts.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {alerts.length}
                    </span>
                  )}
                </Link>
                <button className="p-2 hover:bg-stone-100 rounded-full transition-colors relative">
                  <Bell className="w-5 h-5 text-stone-600" />
                  {alerts.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<PatientDashboard />} />
            <Route path="/counselor" element={<CounselorDashboard alerts={alerts} />} />
          </Routes>
        </main>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden"
            >
              <div className="flex flex-col gap-6">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-2xl font-medium">Patient Portal</Link>
                <Link to="/counselor" onClick={() => setIsMenuOpen(false)} className="text-2xl font-medium">Counselor Dashboard</Link>
                <div className="h-px bg-stone-200 my-4" />
                <button className="flex items-center gap-2 text-stone-500">
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
