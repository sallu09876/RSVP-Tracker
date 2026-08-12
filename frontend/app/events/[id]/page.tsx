'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RSVP {
  user_id: number;
  name: string;
  status: 'going' | 'maybe' | 'declined';
}

interface EventDetail {
  id: number;
  title: string;
  description: string;
  location: string;
  event_time: string;
  creator_name: string;
  is_owner: boolean;
}

export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventRes, rsvpsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/events/${id}`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/events/${id}/rsvps`, { credentials: 'include' })
        ]);

        if (eventRes.status === 401 || rsvpsRes.status === 401) {
          window.location.href = '/login';
          return;
        }

        if (!eventRes.ok) {
          throw new Error('Failed to fetch event details');
        }

        const eventData = await eventRes.json();
        const rsvpsData = await rsvpsRes.json();

        setEvent(eventData);
        setRsvps(rsvpsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [id]);

  const handleRSVP = async (status: 'going' | 'maybe' | 'declined') => {
    setRsvpLoading(true);
    setActionError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/events/${id}/rsvp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update RSVP');
      
      // Refresh RSVPs
      const rsvpsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/events/${id}/rsvps`, { credentials: 'include' });
      if (rsvpsRes.ok) {
        setRsvps(await rsvpsRes.json());
      }
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setRsvpLoading(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventTime, setEditEventTime] = useState('');

  useEffect(() => {
    if (event) {
      setEditTitle(event.title);
      setEditLocation(event.location);
      setEditDescription(event.description || '');
      // Format datetime-local string (YYYY-MM-DDTHH:MM)
      const d = new Date(event.event_time);
      const tzoffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
      const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
      setEditEventTime(localISOTime);
    }
  }, [event]);

  const handleEdit = async () => {
    setActionError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          location: editLocation,
          event_time: editEventTime
        }),
        credentials: 'include'
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update event');
      
      setEvent({ ...event!, title: editTitle, description: editDescription, location: editLocation, event_time: editEventTime });
      setIsEditing(false);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    setActionError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/events/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete event');
      
      router.push('/events');
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="skeleton w-28 h-4 rounded mb-2"></div>
        
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div className="w-full">
              <div className="skeleton h-10 w-3/4 mb-4 rounded-lg"></div>
              <div className="flex flex-wrap gap-4">
                <div className="skeleton h-5 w-32 rounded"></div>
                <div className="skeleton h-5 w-40 rounded"></div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="skeleton h-9 w-16 rounded-lg"></div>
              <div className="skeleton h-9 w-16 rounded-lg"></div>
            </div>
          </div>
          
          <div className="space-y-3 mb-8">
            <div className="skeleton h-4 w-full rounded"></div>
            <div className="skeleton h-4 w-full rounded"></div>
            <div className="skeleton h-4 w-3/4 rounded"></div>
          </div>
          
          <div className="skeleton h-4 w-1/4 rounded border-t border-border pt-4"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="card">
              <div className="skeleton h-8 w-1/3 mb-6 rounded-lg"></div>
              
              <div className="space-y-6">
                <div>
                  <div className="skeleton h-5 w-1/4 mb-3 rounded"></div>
                  <div className="flex gap-2">
                    <div className="skeleton h-7 w-20 rounded-full"></div>
                    <div className="skeleton h-7 w-24 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="skeleton h-5 w-1/4 mb-3 rounded"></div>
                  <div className="flex gap-2">
                    <div className="skeleton h-7 w-16 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="skeleton h-5 w-1/4 mb-3 rounded"></div>
                  <div className="flex gap-2">
                    <div className="skeleton h-7 w-24 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="card md:sticky md:top-24">
              <div className="skeleton h-7 w-1/2 mb-4 rounded-lg"></div>
              <div className="space-y-3">
                <div className="skeleton h-12 w-full rounded-lg"></div>
                <div className="skeleton h-12 w-full rounded-lg"></div>
                <div className="skeleton h-12 w-full rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return <div className="error-banner text-center">{error || 'Event not found'}</div>;
  }

  const going = rsvps.filter(r => r.status === 'going');
  const maybe = rsvps.filter(r => r.status === 'maybe');
  const declined = rsvps.filter(r => r.status === 'declined');

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <Link href="/events" className="back-link">
        &larr; Back to Events
      </Link>

      {actionError && (
        <div className="error-banner flex items-center justify-between gap-4">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-error hover:text-error/80 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error rounded p-1">✕</button>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="w-full min-w-0">
            {isEditing ? (
              <div className="space-y-4 mb-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="input-field w-full font-serif text-2xl font-semibold"
                  placeholder="Event Title"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Location"
                  />
                  <input
                    type="datetime-local"
                    value={editEventTime}
                    onChange={e => setEditEventTime(e.target.value)}
                    className="input-field flex-1"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink mb-3 tracking-tight">{event.title}</h1>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 meta-text">
                  <span className="flex items-center gap-2">
                    <span className="text-accent" aria-hidden="true">📍</span> {event.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-primary" aria-hidden="true">📅</span> {new Date(event.event_time).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </>
            )}
          </div>
          
          {event.is_owner && (
            <div className="flex gap-2 shrink-0">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                  <button onClick={handleEdit} className="btn-primary text-sm py-2 px-4">Save</button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Edit
                  </button>
                  <button onClick={handleDelete} className="btn-danger text-sm py-2 px-4">
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="max-w-none mb-8">
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              className="input-field w-full min-h-[120px] leading-relaxed"
              placeholder="Description"
            />
          ) : (
            <p className="whitespace-pre-wrap text-ink-muted text-base leading-relaxed">{event.description || 'No description provided.'}</p>
          )}
        </div>
        
        <div className="text-sm text-ink-subtle border-t border-border pt-4">
          Organized by <span className="font-medium text-ink-muted">{event.creator_name}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h2 className="section-title mb-6">Attendees</h2>
            
            {rsvps.length === 0 ? (
              <div className="text-center py-12 bg-surface-muted rounded-xl border border-border">
                <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center text-2xl mx-auto mb-4" aria-hidden="true">👥</div>
                <h3 className="font-serif text-lg font-semibold text-ink mb-1">No attendees yet</h3>
                <p className="text-sm text-ink-muted">Be the first to RSVP for this event!</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-going mb-3 flex items-center gap-2">
                    <span className="status-dot-going"></span>
                    Going ({going.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {going.map(r => (
                      <span key={r.user_id} className="badge-going">{r.name}</span>
                    ))}
                    {going.length === 0 && <span className="text-ink-subtle text-sm italic">No one yet</span>}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-semibold text-lg text-maybe mb-3 flex items-center gap-2">
                    <span className="status-dot-maybe"></span>
                    Maybe ({maybe.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {maybe.map(r => (
                      <span key={r.user_id} className="badge-maybe">{r.name}</span>
                    ))}
                    {maybe.length === 0 && <span className="text-ink-subtle text-sm italic">No one yet</span>}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-semibold text-lg text-declined mb-3 flex items-center gap-2">
                    <span className="status-dot-declined"></span>
                    Declined ({declined.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {declined.map(r => (
                      <span key={r.user_id} className="badge-declined">{r.name}</span>
                    ))}
                    {declined.length === 0 && <span className="text-ink-subtle text-sm italic">No one yet</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="card md:sticky md:top-24">
            <h2 className="font-serif text-xl font-semibold text-ink mb-5">Your RSVP</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleRSVP('going')}
                disabled={rsvpLoading}
                className="rsvp-btn-going flex items-center justify-center gap-2"
              >
                I&apos;m Going
              </button>
              <button
                onClick={() => handleRSVP('maybe')}
                disabled={rsvpLoading}
                className="rsvp-btn-maybe flex items-center justify-center gap-2"
              >
                Maybe
              </button>
              <button
                onClick={() => handleRSVP('declined')}
                disabled={rsvpLoading}
                className="rsvp-btn-declined flex items-center justify-center gap-2"
              >
                Can&apos;t Go
              </button>
            </div>
            {rsvpLoading && (
              <div className="mt-4 text-center text-sm text-ink-muted">Updating…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
