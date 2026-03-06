import { useState, useEffect } from 'react';
import { 
  Users, 
  AlertCircle, 
  TrendingUp, 
  Search, 
  Filter,
  ChevronRight,
  Brain,
  MessageSquare,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Alert, Patient, Entry, AIAnalysis } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function CounselorDashboard({ alerts }: { alerts: Alert[] }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data);
        if (data.length > 0) handleSelectPatient(data[0]);
      });
  }, []);

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/history`);
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = history.slice().reverse().map(entry => ({
    time: new Date(entry.timestamp).toLocaleDateString(),
    risk: entry.risk_score,
    sentiment: entry.sentiment === 'positive' ? 1 : entry.sentiment === 'negative' ? -1 : 0
  }));

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600 bg-red-50 border-red-100";
    if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-100";
    if (score >= 30) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-emerald-600 bg-emerald-50 border-emerald-100";
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-12rem)]">
      {/* Sidebar: Patient List & Alerts */}
      <div className="xl:col-span-3 flex flex-col gap-6 overflow-hidden">
        {/* Real-time Alerts Panel */}
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden flex flex-col max-h-[40%] shadow-sm">
          <div className="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
            <h3 className="text-red-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Active Alerts
            </h3>
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">{alerts.length}</span>
          </div>
          <div className="overflow-y-auto p-2 space-y-2">
            {alerts.length === 0 ? (
              <p className="text-center text-stone-400 py-8 text-sm">No active alerts</p>
            ) : (
              alerts.map(alert => (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  key={alert.id} 
                  className="p-3 bg-white border border-stone-100 rounded-xl shadow-sm hover:border-red-200 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs">{alert.patient_name}</span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                      alert.risk_level === 'CRITICAL' ? "bg-red-600 text-white" : "bg-orange-500 text-white"
                    )}>
                      {alert.risk_level}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 line-clamp-2">{alert.reason}</p>
                  <span className="text-[9px] text-stone-400 mt-2 block">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white rounded-3xl border border-stone-200 flex-1 overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-stone-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search patients..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {patients.map(patient => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-all",
                  selectedPatient?.id === patient.id ? "bg-emerald-50 text-emerald-700" : "hover:bg-stone-50 text-stone-600"
                )}
              >
                <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center overflow-hidden">
                  <Users className="w-5 h-5 text-stone-400" />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-sm font-semibold">{patient.name}</span>
                  <span className="text-[10px] opacity-70">{patient.email}</span>
                </div>
                {selectedPatient?.id === patient.id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Panel: Patient Details & Analytics */}
      <div className="xl:col-span-9 overflow-y-auto pr-2 space-y-8">
        {selectedPatient ? (
          <>
            {/* Header: Patient Profile Overview */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center">
                  <Users className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-stone-900">{selectedPatient.name}</h2>
                  <div className="flex gap-4 mt-2">
                    <span className="text-sm text-stone-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Last active: {history[0] ? new Date(history[0].timestamp).toLocaleDateString() : 'Never'}
                    </span>
                    <span className="text-sm text-stone-500 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Risk Trend: {history.length > 1 && history[0].risk_score > history[1].risk_score ? 'Increasing' : 'Decreasing'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-all flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Direct Message
                </button>
                <button className="px-6 py-3 bg-stone-100 text-stone-600 rounded-2xl font-semibold hover:bg-stone-200 transition-all">
                  Full Report
                </button>
              </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Risk Score Card */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-stone-500 uppercase tracking-wider text-xs">Current Risk Score</h3>
                  <Brain className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex items-end gap-2">
                  <span className={cn(
                    "text-5xl font-black",
                    history[0]?.risk_score > 60 ? "text-red-600" : "text-emerald-600"
                  )}>
                    {history[0]?.risk_score || 0}
                  </span>
                  <span className="text-stone-400 mb-2">/ 100</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      history[0]?.risk_score > 60 ? "bg-red-500" : "bg-emerald-500"
                    )} 
                    style={{ width: `${history[0]?.risk_score || 0}%` }} 
                  />
                </div>
                <p className="text-xs text-stone-400">
                  {history[0]?.risk_score > 60 ? 'Immediate attention required' : 'Stable condition'}
                </p>
              </div>

              {/* Sentiment Card */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-stone-500 uppercase tracking-wider text-xs">Average Sentiment</h3>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    {history[0]?.sentiment === 'positive' ? (
                      <ArrowUpRight className="text-emerald-600 w-6 h-6" />
                    ) : (
                      <ArrowDownRight className="text-red-600 w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="block text-2xl font-bold capitalize">{history[0]?.sentiment || 'Neutral'}</span>
                    <span className="text-xs text-stone-400">Based on latest entry</span>
                  </div>
                </div>
              </div>

              {/* Activity Card */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-stone-500 uppercase tracking-wider text-xs">Activity Level</h3>
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-3xl font-bold">{history.length} Entries</div>
                <p className="text-xs text-stone-400">Total interactions this month</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Risk Score Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="risk" stroke="#10b981" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6">Sentiment History</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={[-1.5, 1.5]} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="step" dataKey="sentiment" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Analysis Feed */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Linguistic Analysis Feed</h3>
              <div className="space-y-4">
                {history.map(entry => {
                  const analysis: AIAnalysis | null = entry.analysis_json ? JSON.parse(entry.analysis_json) : null;
                  return (
                    <div key={entry.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            getRiskColor(entry.risk_score)
                          )}>
                            {entry.type} • Risk {entry.risk_score}%
                          </span>
                          <span className="text-xs text-stone-400">{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                          {analysis?.psychologicalProfile.cognitiveDistortions.map((d, i) => (
                            <span key={i} className="text-[9px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{d}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-stone-700 italic border-l-4 border-stone-200 pl-4 py-1">"{entry.content}"</p>
                      {analysis && (
                        <div className="bg-stone-50 p-4 rounded-2xl space-y-2">
                          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                            <Brain className="w-4 h-4" />
                            AI Insight
                          </div>
                          <p className="text-sm text-stone-600">{analysis.summary}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                            <div className="space-y-1">
                              <span className="text-[10px] text-stone-400 uppercase">Anxiety</span>
                              <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full" style={{ width: `${analysis.psychologicalProfile.anxietyIndicator * 100}%` }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-stone-400 uppercase">Depression</span>
                              <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full" style={{ width: `${analysis.psychologicalProfile.depressionIndicator * 100}%` }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-stone-400 uppercase">Instability</span>
                              <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full" style={{ width: `${analysis.psychologicalProfile.emotionalInstability * 100}%` }} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-stone-400 uppercase">Joy</span>
                              <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: `${analysis.emotions.joy * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
            <Users className="w-16 h-16 opacity-20" />
            <p className="text-xl">Select a patient to view their profile and analytics</p>
          </div>
        )}
      </div>
    </div>
  );
}
