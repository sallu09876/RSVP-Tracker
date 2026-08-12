'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  event_time: string;
  creator_name: string;
}

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/events`);
        if (debouncedTerm) {
          url.searchParams.append('search', debouncedTerm);
        }

        const res = await fetch(url.toString(), {
          credentials: 'include'
        });
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [debouncedTerm]);

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="skeleton h-10 w-64 rounded-lg"></div>
          <div className="skeleton h-10 w-36 rounded-lg"></div>
        </div>

        <div className="relative mb-8">
          <div className="skeleton h-12 w-full rounded-lg"></div>
        </div>

        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-full flex flex-col min-h-[220px]">
              <div className="skeleton h-7 w-3/4 mb-4 rounded"></div>
              <div className="space-y-3 mb-4 flex-grow">
                <div className="skeleton h-4 w-1/2 rounded"></div>
                <div className="skeleton h-4 w-2/3 rounded"></div>
                <div className="skeleton h-4 w-full mt-4 rounded"></div>
                <div className="skeleton h-4 w-5/6 rounded"></div>
              </div>
              <div className="skeleton h-4 w-1/3 mt-3 rounded border-t border-border pt-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-banner text-center">{error}</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="page-title">Upcoming Events</h1>
          <p className="mt-1 text-ink-muted text-base">Discover meetups happening near you</p>
        </div>
        <Link href="/events/new" className="btn-primary shrink-0 self-start sm:self-auto">
          Create Event
        </Link>
      </div>

      <div className="relative mb-8">
        <label htmlFor="event-search" className="sr-only">Search events</label>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-subtle pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="event-search"
            type="text"
            placeholder="Search by title, location, or description…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay hide to allow click on suggestion to register.
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            className="input-field pl-12 py-3.5"
          />
        </div>
        
        {showSuggestions && searchTerm && (
          <div className="absolute z-10 w-full mt-2 bg-surface border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto" style={{ boxShadow: 'var(--shadow-card-hover)' }}>
            {events.length === 0 ? (
              <div className="p-4 text-ink-muted text-center text-sm">No events found matching &ldquo;{searchTerm}&rdquo;</div>
            ) : (
              events.map((event) => (
                <Link 
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block px-4 py-3.5 hover:bg-surface-muted border-b border-border last:border-0 transition-colors focus-visible:outline-none focus-visible:bg-surface-muted"
                  onClick={() => setShowSuggestions(false)}
                >
                  <div className="font-serif font-semibold text-ink">{event.title}</div>
                  <div className="text-xs text-ink-muted truncate mt-1">
                    {event.location} · {new Date(event.event_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center text-3xl mb-5" aria-hidden="true">📅</div>
          <h3 className="font-serif text-xl font-semibold text-ink mb-2">No events found</h3>
          <p className="text-ink-muted max-w-sm">{searchTerm ? 'Try adjusting your search terms.' : 'Be the first to create an event!'}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link href={`/events/${event.id}`} key={event.id} className="group">
              <div className="card-interactive h-full flex flex-col">
                <h2 className="event-card-title">{event.title}</h2>
                <div className="text-ink-muted text-sm mb-4 space-y-2 flex-grow">
                  <p className="flex items-start gap-2">
                    <span className="text-accent shrink-0 mt-0.5" aria-hidden="true">📍</span>
                    <span>{event.location}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5" aria-hidden="true">📅</span>
                    <span>{new Date(event.event_time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </p>
                  {event.description && (
                    <p className="text-ink-subtle mt-3 line-clamp-2 leading-relaxed">{event.description}</p>
                  )}
                </div>
                <div className="text-xs text-ink-subtle border-t border-border pt-4 mt-auto">
                  Organized by <span className="font-medium text-ink-muted">{event.creator_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
