'use client';

import React, { useState } from 'react';
import { Incident, IncidentClassificationDTO, Task } from '@/domain/types';
import { api } from '@/lib/api-client';
import { useStadiumState } from '@/hooks/use-stadium-state';
import {
  Camera,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  HeartPulse,
  Wrench,
  Users,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

const SAMPLE_PHOTOS = [
  {
    label: '🚨 Medical Distress (Sec 112)',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    desc: 'Spectator collapsed in Sector 112 row 14, exhibiting severe heat exhaustion and dizziness.',
  },
  {
    label: '🚧 Turnstile Bottleneck (Gate C)',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600',
    desc: 'Severe crowd congestion forming at Gate C turnstiles due to commuter train arrival.',
  },
  {
    label: '🔧 Broken Scanner (Gate D)',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
    desc: 'Ticket scanner hardware failure at Gate D auxiliary turnstile #4.',
  },
];

export const IncidentReporter: React.FC = () => {
  const { state } = useStadiumState();
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [sector, setSector] = useState('112');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastClassification, setLastClassification] = useState<IncidentClassificationDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskUpdatingId, setTaskUpdatingId] = useState<string | null>(null);

  const recentIncidents = state.incidents;
  const tasks = state.tasks;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setLastClassification(null);
    setError(null);
    try {
      const { aiClassification } = await api.createIncident({
        stadiumId: 'metlife-ny-nj',
        incidentType: 'MAINTENANCE', // AI will override this!
        location: { sector, concourseLevel: 'Lower Bowl' },
        description,
        photoUrl: photoUrl || undefined,
      });
      setLastClassification(aiClassification);
      setDescription('');
      setPhotoUrl('');
    } catch (err) {
      const e = err as Error & { status?: number };
      setError(e.status === 403 ? 'Your role cannot submit incidents. Switch to VOLUNTEER or OPERATIONS.' : e.message || 'Failed to report incident.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskCheck = async (task: Task, itemIndex: number) => {
    const updatedChecklist = task.checklist.map((item, idx) => (idx === itemIndex ? { ...item, completed: !item.completed } : item));
    const allDone = updatedChecklist.every((i) => i.completed);
    setTaskUpdatingId(task.taskId);
    try {
      await api.updateTask(task.taskId, {
        status: allDone ? 'COMPLETED' : 'IN_PROGRESS',
        checklist: updatedChecklist,
      });
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setTaskUpdatingId(null);
    }
  };

  const getSeverityBadge = (sev: number) => {
    if (sev >= 8) return { bg: 'bg-red-500/20 text-red-300 border-red-500/40', label: `SEV ${sev} • CRITICAL` };
    if (sev >= 5) return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', label: `SEV ${sev} • ELEVATED` };
    return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: `SEV ${sev} • LOW` };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Multimodal Incident Reporter */}
      <div className="lg:col-span-6 w-full space-y-6">
        <div className="card-floodlit ref-card-yellow rounded-xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white font-black shadow-lg shadow-sky-500/20" aria-hidden="true">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2">
                  <span>Multimodal Incident Reporter</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-md font-mono font-bold">GLM VISION</span>
                </h3>
                <p className="text-xs text-emerald-100/60">Snap photos or record voice notes; AI auto-grades severity &amp; routes triage</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 relative z-10">
            <span className="text-[11px] font-black text-emerald-100/50 uppercase tracking-widest jersey-heading">Quick test scenarios:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_PHOTOS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPhotoUrl(sample.url);
                    setDescription(sample.desc);
                  }}
                  className="p-2.5 rounded-md bg-[#03110a]/80 hover:bg-sky-950/40 border border-emerald-900/50 text-left text-xs text-emerald-100/80 hover:text-white transition-all shadow-sm group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label={`Load sample scenario: ${sample.label}`}
                >
                  <div className="font-black truncate group-hover:text-sky-300 jersey-heading">{sample.label}</div>
                  <div className="text-[10px] text-emerald-100/75 truncate mt-0.5">Click to load photo</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="incident-sector" className="block text-xs font-black text-emerald-100/60 uppercase mb-1.5 tracking-widest jersey-heading">
                  Sector / Concourse
                </label>
                <select
                  id="incident-sector"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-[#03110a] border border-emerald-900/50 rounded-md px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="112">Sector 112 (Lower Bowl)</option>
                  <option value="110">Sector 110 (Lower Bowl)</option>
                  <option value="Gate C Plaza">Gate C Rail Hub Plaza</option>
                  <option value="Gate D Plaza">Gate D Auxiliary North</option>
                  <option value="205">Sector 205 (Mezzanine)</option>
                </select>
              </div>
              <div>
                <label htmlFor="incident-photo" className="block text-xs font-black text-emerald-100/60 uppercase mb-1.5 tracking-widest jersey-heading">
                  Photo URL (optional)
                </label>
                <div className="relative">
                  <input
                    id="incident-photo"
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#03110a] border border-emerald-900/50 rounded-md pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-emerald-100/30 focus:outline-none focus:border-sky-500"
                  />
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-100/75 absolute left-2.5 top-3" aria-hidden="true" />
                </div>
              </div>
            </div>

            {photoUrl && (
              <div className="relative rounded-md overflow-hidden border border-emerald-900/50 max-h-40 bg-[#03110a] flex items-center justify-center">
                <img src={photoUrl} alt="Incident preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-[#03110a]/90 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-sky-300 font-mono font-black tracking-widest">
                  ⚡ READY FOR VISION
                </div>
              </div>
            )}

            <div>
              <label htmlFor="incident-description" className="block text-xs font-black text-emerald-100/60 uppercase mb-1.5 tracking-widest jersey-heading">
                Incident description
              </label>
              <textarea
                id="incident-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you see or transcribe radio report…"
                className="w-full bg-[#03110a] border border-emerald-900/50 rounded-md p-3 text-xs sm:text-sm text-white placeholder:text-emerald-100/30 focus:outline-none focus:border-sky-500"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-md bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!description.trim() || isSubmitting}
              className="w-full py-3 rounded-md bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin-ball" aria-hidden="true" />
              ) : (
                <Sparkles className="w-4 h-4 fill-current" aria-hidden="true" />
              )}
              <span>Analyze &amp; Submit</span>
            </button>
          </form>

          {lastClassification && (
            <div className="bg-gradient-to-r from-sky-950/60 to-cyan-950/60 border border-sky-500/40 rounded-md p-4 shadow-xl space-y-3 animate-in fade-in duration-300 relative z-10" role="status" aria-live="polite">
              <div className="flex items-center justify-between border-b border-sky-500/30 pb-2">
                <div className="flex items-center gap-2 text-xs font-black text-sky-300 jersey-heading">
                  <Sparkles className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} aria-hidden="true" />
                  <span>{lastClassification.engine === 'gemini' ? 'GLM VISION' : 'SIMULATED'} CLASSIFICATION</span>
                </div>
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border tracking-widest uppercase ${getSeverityBadge(lastClassification.estimatedSeverity).bg}`}>
                  {getSeverityBadge(lastClassification.estimatedSeverity).label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#03110a]/60 p-2 rounded-md border border-emerald-900/40">
                  <span className="text-emerald-100/50 block text-[10px] uppercase font-bold tracking-widest">Routed Team:</span>
                  <span className="font-black text-white uppercase jersey-heading">{lastClassification.requiredTeam}</span>
                </div>
                <div className="bg-[#03110a]/60 p-2 rounded-md border border-emerald-900/40">
                  <span className="text-emerald-100/50 block text-[10px] uppercase font-bold tracking-widest">Incident Type:</span>
                  <span className="font-black text-cyan-300 jersey-heading">{lastClassification.incidentType}</span>
                </div>
              </div>
              <div className="text-xs text-emerald-100/90 bg-[#03110a]/80 p-3 rounded-md border border-emerald-900/40 leading-relaxed font-mono">
                {lastClassification.aiSummary}
              </div>
              <div className="text-[11px] text-emerald-400 font-black flex items-center gap-1.5 uppercase tracking-widest">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ticket logged &amp; dispatched to {lastClassification.requiredTeam}!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Tasks + Incident Feed */}
      <div className="lg:col-span-6 w-full space-y-6">
        <div className="card-floodlit rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 relative z-10">
            <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <span>Assigned Shift Checklists</span>
            </h3>
            <span className="text-xs text-emerald-100/50 font-mono tracking-widest uppercase">ELENA • VOL-881</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-pitch relative z-10">
            {tasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-emerald-100/75">No pending shift tasks assigned.</div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.taskId}
                  className={`p-4 rounded-md border transition-all ${
                    task.priority === 'URGENT'
                      ? 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-500/5'
                      : 'bg-[#03110a]/80 border-emerald-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md tracking-widest uppercase ${task.priority === 'URGENT' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'}`}>
                      {task.priority} PRIORITY
                    </span>
                    <span className="text-[10px] text-emerald-100/75 font-mono">{task.taskId}</span>
                  </div>
                  <h4 className="text-sm font-black text-white jersey-heading">{task.title}</h4>
                  <p className="text-xs text-emerald-100/60 mt-1 leading-relaxed">{task.description}</p>
                  <div className="mt-3 space-y-1.5 border-t border-emerald-900/40 pt-3">
                    {task.checklist.map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2.5 text-xs text-emerald-100/80 cursor-pointer hover:text-white p-1.5 rounded-md hover:bg-emerald-950/40 transition-all">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleTaskCheck(task, idx)}
                          disabled={taskUpdatingId === task.taskId}
                          className="w-4 h-4 rounded border-emerald-700 text-sky-600 focus:ring-0 bg-[#03110a]"
                        />
                        <span className={item.completed ? 'line-through text-emerald-100/75' : ''}>{item.item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-floodlit rounded-xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 relative z-10">
            <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <span>Live Incident Ticket Feed</span>
            </h3>
            <span className="text-xs text-emerald-100/50 font-mono tracking-widest uppercase">REAL-TIME SSE</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-pitch relative z-10">
            {recentIncidents.length === 0 ? (
              <div className="text-center py-6 text-xs text-emerald-100/75">No incidents reported.</div>
            ) : (
              recentIncidents.map((inc) => {
                const badge = getSeverityBadge(inc.severity);
                return (
                  <div key={inc.incidentId} className="bg-[#03110a]/80 border border-emerald-900/40 p-3.5 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border tracking-widest uppercase ${badge.bg}`}>{badge.label}</span>
                      <span className="text-[10px] font-mono text-emerald-100/75">
                        SEC {inc.location.sector} • {inc.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      {inc.incidentType === 'MEDICAL' && <HeartPulse className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />}
                      {inc.incidentType === 'SECURITY' && <ShieldAlert className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />}
                      {inc.incidentType === 'CROWD_CONGESTION' && <Users className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />}
                      {inc.incidentType === 'MAINTENANCE' && <Wrench className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />}
                      <span>{inc.incidentType}: {inc.description}</span>
                    </div>
                    {inc.aiSummary && (
                      <div className="text-[11px] text-emerald-100/70 bg-[#0a1f15] p-2 rounded-md border border-emerald-900/40 font-mono">{inc.aiSummary}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
