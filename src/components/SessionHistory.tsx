import { useState, useEffect } from 'react';
import { X, Clock, Trash2, RefreshCw } from 'lucide-react';
import { listSessions, getSession, deleteSession } from '../services/sessionService';
import type { Session } from '../types/session';
import type { PageData } from './TimesheetForm';

interface SessionHistoryProps {
  readonly onLoadSession: (pages: PageData[], hourlyRate: string) => void;
  readonly onClose: () => void;
}

export function SessionHistory({ onLoadSession, onClose }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<readonly Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleLoad = async (id: string) => {
    if (!confirm('Loading will replace your current data. Continue?')) return;
    setLoadingId(id);
    try {
      const session = await getSession(id);
      onLoadSession(session.pages, session.hourly_rate || '');
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session permanently?')) return;
    try {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-gray-800 border-l border-gray-700 w-full max-w-md shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Session History
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSessions}
              className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-gray-700 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-500 py-12">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No saved sessions yet</p>
              <p className="text-xs mt-1 text-gray-600">Sessions are saved when you generate a PDF</p>
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white text-sm truncate max-w-[260px]" title={session.title}>
                    {session.title}
                  </h3>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span>{formatDate(session.created_at)}</span>
                  {session.total_hours != null && (
                    <span>{session.total_hours.toFixed(1)}h</span>
                  )}
                  {session.total_pay != null && session.total_pay > 0 && (
                    <span className="text-green-400">${session.total_pay.toFixed(2)}</span>
                  )}
                </div>

                <button
                  onClick={() => handleLoad(session.id)}
                  disabled={loadingId === session.id}
                  className="w-full py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingId === session.id ? 'Loading...' : 'Load Session'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
