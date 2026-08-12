'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to logout');
      }

      // Even if there were client side state, it would be cleared here.
      // Since it's cookie-based, clearing the cookie is enough.
      router.push('/login');
      router.refresh(); // Ensure server components re-fetch and realize we are logged out
    } catch (err: any) {
      setLogoutError(err.message || 'Logout failed');
      // Per instructions: redirect to login regardless since intent is to leave
      router.push('/login');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Hide on login page
  if (pathname === '/login') {
    return null;
  }

  const isEventsActive =
    pathname === '/events' ||
    (pathname.startsWith('/events/') && pathname !== '/events/new');

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href="/events"
          className={isEventsActive ? 'nav-events-active' : 'nav-events'}
        >
          Events
        </Link>
        <Link
          href="/events/new"
          className={`btn-secondary text-sm py-2 px-3 sm:px-4 ${pathname === '/events/new' ? 'ring-2 ring-primary/25 border-primary/30' : ''}`}
        >
          Create Event
        </Link>
      </div>

      <div className="nav-divider" aria-hidden="true" />

      <div className="flex items-center gap-1.5 sm:gap-2">
        {logoutError && <span className="text-error text-xs hidden lg:inline">{logoutError}</span>}
        <button
          onClick={() => window.location.reload()}
          className="nav-refresh"
          title="Refresh page"
          aria-label="Refresh page"
        >
          <span aria-hidden="true">↻</span>
        </button>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="nav-logout"
        >
          {isLoggingOut ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
