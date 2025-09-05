'use client';

import { useEffect, useState } from 'react';

/**
 * Client-side CSRF token management
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/csrf-token', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setToken(data.token);
        } else {
          console.error('Failed to fetch CSRF token');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, loading };
}

/**
 * Get CSRF token from cookies (client-side)
 */
export function getCSRFTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith('csrf-token=')
  );

  if (csrfCookie) {
    return csrfCookie.split('=')[1];
  }

  return null;
}

/**
 * Add CSRF token to fetch requests
 */
export function addCSRFTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFTokenFromCookies();
  
  if (token) {
    return {
      ...headers,
      'X-CSRF-Token': token,
    };
  }

  return headers;
}

/**
 * Enhanced fetch with CSRF protection
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = addCSRFTokenToHeaders(options.headers);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
