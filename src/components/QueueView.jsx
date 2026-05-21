import { useState, useEffect } from 'react';
import { Trash2, GripVertical, ListOrdered } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from '../context/ThemeContext';

const DEMO_JOBS = [
  { id: 1, filename: 'naruto-ep247.mkv',     inputRes: '720p',  algorithm: 'Anime4K v4',  status: 'completed', progress: 100 },
  { id: 2, filename: 'aot-s4e28.mp4',        inputRes: '1080p', algorithm: 'Real-ESRGAN', status: 'processing', progress: 67  },
  { id: 3, filename: 'demon-slayer.mkv',      inputRes: '480p',  algorithm: 'Real-CUGAN',  status: 'queued',     progress: 0   },
  { id: 4, filename: 'jujutsu-s2e11.mp4',    inputRes: '720p',  algorithm: 'Anime4K v4',  status: 'queued',     progress: 0   },
];

const STATUS_COLORS = {
  completed: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', color: '#10b981', label: 'Done ✓' },
  processing: { bg: 'rgba(124,92,252,0.12)', border: 'rgba(124,92,252,0.35)', color: '#a78bfa', label: 'Processing' },
  queued:     { bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.25)', color: '#64748b', label: 'Queued' },
  error:      { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)',   color: '#ef4444', label: 'Failed' },
};

function JobCard({ job, animProgress, isDark, canDrag, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id, disabled: !canDrag,
  });

  const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const s      = STATUS_COLORS[job.status] || STATUS_COLORS.queued;
  const prog   = job.status === 'processing' ? Math.round(animProgress) : job.progress;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 999 : 'auto',
      }}
    >
      <div style={{
        height: 72, display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 10px 0 6px',
        background: isDark ? 'rgba(30,33,48,0.8)' : 'rgba(255,255,255,0.9)',
        border: `1px solid ${isDragging ? 'rgba(124,92,252,0.4)' : border}`,
        borderRadius: 12, marginBottom: 6,
        boxShadow: isDragging ? '0 8px 32px rgba(124,92,252,0.3)' : 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Drag handle */}
        <div
          {...(canDrag ? { ...attributes, ...listeners } : {})}
          style={{ cursor: canDrag ? 'grab' : 'default', color: isDark ? '#334155' : '#cbd5e1', padding: '0 2px', flexShrink: 0 }}
        >
          <GripVertical size={14} />
        </div>

        {/* Thumbnail placeholder */}
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          background: isDark ? 'linear-gradient(135deg,#1e2130,#2a2d3e)' : 'linear-gradient(135deg,#e0e7ff,#c7d2fe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          🎬
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.filename}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: isDark ? '#475569' : '#94a3b8' }}>{job.inputRes}</span>
            <span style={{ fontSize: 9, color: isDark ? '#334155' : '#cbd5e1' }}>·</span>
            <span style={{ fontSize: 9, color: isDark ? '#475569' : '#94a3b8' }}>{job.algorithm}</span>
          </div>
          {/* Progress bar for processing */}
          {job.status === 'processing' && (
            <div style={{ height: 3, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', marginTop: 2 }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${prog}%`, background: 'linear-gradient(90deg,#7c5cfc,#22d3ee)', transition: 'width 0.3s ease', boxShadow: '0 0 4px rgba(124,92,252,0.4)' }} />
            </div>
          )}
        </div>

        {/* Status badge */}
        <span style={{
          position: 'absolute', top: 6, right: 34,
          fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 20,
          background: s.bg, border: `1px solid ${s.border}`, color: s.color,
          whiteSpace: 'nowrap',
        }}>
          {job.status === 'processing' ? `${prog}%` : s.label}
        </span>

        {/* Delete */}
        <button
          onClick={() => onDelete(job.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#334155' : '#cbd5e1', padding: 4, flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.color = isDark ? '#334155' : '#cbd5e1'; }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function QueueView({ queue: externalQueue, onQueueChange }) {
  const { theme } = useTheme();
  const isDark    = theme === 'dark';

  // Use external queue if provided (real jobs), else demo data
  const [jobs, setJobs] = useState(externalQueue?.length > 0 ? externalQueue : DEMO_JOBS);
  const [animProgress, setAnimProgress] = useState(67);

  // Sync external queue
  useEffect(() => {
    if (externalQueue?.length > 0) setJobs(externalQueue);
  }, [externalQueue]);

  // Animate processing progress in demo mode
  useEffect(() => {
    const t = setInterval(() => setAnimProgress(p => p >= 100 ? 67 : p + 0.25), 80);
    return () => clearInterval(t);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setJobs(prev => {
      const oi = prev.findIndex(j => j.id === active.id);
      const ni = prev.findIndex(j => j.id === over.id);
      if (prev[oi].status !== 'queued') return prev;
      const next = arrayMove(prev, oi, ni);
      onQueueChange?.(next);
      return next;
    });
  };

  const handleDelete = (id) => {
    setJobs(prev => {
      const next = prev.filter(j => j.id !== id);
      onQueueChange?.(next);
      return next;
    });
  };

  const queuedIds = jobs.filter(j => j.status === 'queued').map(j => j.id);
  const counts = { completed: 0, processing: 0, queued: 0 };
  jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, opacity: 0.4 }}>📭</div>
        <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#475569' : '#94a3b8', margin: 0 }}>No jobs yet</p>
        <p style={{ fontSize: 11, color: isDark ? '#334155' : '#cbd5e1', margin: 0 }}>Drop a video on the Upscale tab to get started</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Stats pills */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { label: `${counts.completed} done`,     color: '#10b981' },
          { label: `${counts.processing} active`,   color: '#a78bfa' },
          { label: `${counts.queued} pending`,       color: '#64748b' },
        ].map(({ label, color }) => (
          <span key={label} style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
            background: `${color}15`, border: `1px solid ${color}40`, color,
          }}>
            {label}
          </span>
        ))}
      </div>

      {/* Job cards */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              animProgress={animProgress}
              isDark={isDark}
              canDrag={job.status === 'queued'}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      <p style={{ fontSize: 9, textAlign: 'center', color: isDark ? '#334155' : '#cbd5e1', margin: 0 }}>
        Drag queued items to reorder
      </p>
    </div>
  );
}
