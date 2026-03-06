import React, { useState, useEffect } from 'react';
import { 
  PenLine, 
  Mic, 
  Smile, 
  ShieldAlert, 
  Send, 
  History,
  CheckCircle2,
  Loader2,
  Activity,
  UserCircle,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState<'journal' | 'mood' | 'history'>('journal');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [mood, setMood] = useState<number | null>(null);

  const patientId = 'p1'; // Mock current user

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const res = await fetch(`/api/patients/${patientId}/history`);
    const data = await res.json();
    setHistory(data);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content && activeTab !== 'mood') return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          type: activeTab === 'mood' ? 'mood' : 'journal',
          content: activeTab === 'mood' ? `Mood Check-in: ${mood}/10. ${content}` : content
        })
      });
      
      if (res.ok) {
        setContent('');
        setMood(null);
        fetchHistory();
        alert('Entry saved and analyzed. Your counselor has been updated.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSOS = async () => {
    if (!confirm('Are you in immediate danger? This will alert emergency services and your counselor.')) return;
    
    setIsSubmitting(true);
    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          type: 'sos',
          content: 'EMERGENCY SOS BUTTON PRESSED'
        })
      });
      alert('EMERGENCY ALERT SENT. Please stay calm, help is on the way.');
      fetchHistory();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Input Area */}
      <div className="lg:col-span-2 space-y-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">How are you feeling today, John?</h1>
          <p className="text-stone-500 mt-2 text-lg">Your journal is a safe space for your thoughts.</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-stone-200/50 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('journal')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'journal' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-600 hover:bg-white/50"
            )}
          >
            <PenLine className="w-4 h-4" />
            Journal
          </button>
          <button 
            onClick={() => setActiveTab('mood')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'mood' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-600 hover:bg-white/50"
            )}
          >
            <Smile className="w-4 h-4" />
            Mood Check-in
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'history' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-600 hover:bg-white/50"
            )}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200">
          {activeTab === 'journal' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write whatever is on your mind..."
                className="w-full h-64 p-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 resize-none text-lg"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button type="button" className="p-3 hover:bg-stone-100 rounded-full transition-colors text-stone-500">
                    <Mic className="w-6 h-6" />
                  </button>
                </div>
                <button 
                  disabled={isSubmitting || !content}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Save Entry
                </button>
              </div>
            </form>
          )}

          {activeTab === 'mood' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold">Rate your mood (1-10)</h2>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setMood(num)}
                      className={cn(
                        "w-10 h-10 rounded-full font-medium transition-all",
                        mood === num ? "bg-emerald-600 text-white scale-110" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Any specific reason for this mood? (Optional)"
                className="w-full h-32 p-4 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <div className="flex justify-end">
                <button 
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting || mood === null}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Complete Check-in
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-stone-400 py-12">No entries yet. Start writing to see your history.</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                          entry.type === 'sos' ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {entry.type}
                        </span>
                        <span className="text-xs text-stone-400">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-stone-700 line-clamp-2">{entry.content}</p>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-sm font-bold",
                        entry.risk_score > 60 ? "text-red-500" : entry.risk_score > 30 ? "text-amber-500" : "text-emerald-500"
                      )}>
                        Risk: {entry.risk_score}%
                      </div>
                      <div className="text-[10px] text-stone-400 capitalize">{entry.sentiment}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Quick Actions & Stats */}
      <div className="space-y-6">
        {/* SOS Button */}
        <button 
          onClick={handleSOS}
          className="w-full bg-red-50 text-red-600 p-8 rounded-3xl border-2 border-red-100 flex flex-col items-center gap-4 hover:bg-red-100 transition-all group"
        >
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-110 transition-transform">
            <ShieldAlert className="text-white w-8 h-8" />
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold">SOS Emergency</span>
            <span className="text-sm opacity-70">Immediate counselor alert</span>
          </div>
        </button>

        {/* Daily Progress */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Your Wellbeing
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Journaling Streak</span>
              <span className="font-bold">5 Days</span>
            </div>
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[70%]" />
            </div>
            <p className="text-xs text-stone-400 italic">"Consistency is key to understanding your patterns."</p>
          </div>
        </div>

        {/* Counselor Info */}
        <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-lg shadow-emerald-900/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <UserCircle className="w-8 h-8" />
            </div>
            <div>
              <span className="block font-semibold">Dr. Sarah Wilson</span>
              <span className="text-xs text-emerald-300">Your Assigned Counselor</span>
            </div>
          </div>
          <button className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Message Counselor
          </button>
        </div>
      </div>
    </div>
  );
}
