'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateEvent() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/events`, {
          credentials: 'include'
        });
        if (res.status === 401) {
          window.location.href = '/login';
        } else {
          setCheckingAuth(false);
        }
      } catch (err) {
        setCheckingAuth(false); // allow form to render, it will error on submit anyway
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location, event_time: eventTime }),
        credentials: 'include'
      });

      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      router.push(`/events/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/events" className="back-link mb-6">
        &larr; Back to Events
      </Link>
      <div className="card">
        <div className="mb-8">
          <h1 className="page-title mb-2">Create New Event</h1>
          <p className="text-ink-muted text-base">Share a meetup with your community</p>
        </div>
        {error && (
          <div className="error-banner mb-6">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              required
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer Tech Meetup"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input-field min-h-[120px] leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this event about?"
            />
          </div>
          <div>
            <label className="label">Location</label>
            <input
              type="text"
              required
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Downtown Library or Zoom Link"
            />
          </div>
          <div>
            <label className="label">Date &amp; Time</label>
            <input
              type="datetime-local"
              required
              className="input-field"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
