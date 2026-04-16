export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Fallback hardcoded list — used only if the DB lookup fails
const FALLBACK_ADMIN_EMAILS = ["nbdotwork@gmail.com"];

const PUBLIC_ROUTES = [
  /^\/$/, 
  /^\/products/,
  /^\/api\/products/,
  /^\/api\/categories/,
  /^\/api\/banners/,
  /^\/api\/reviews/,
  /^\/login/,
  /^\/checkout/,
  /^\/orders/,
  /^\/register/,
  /^\/search/,
  /^\/api\/search/,
  /^\/auth/,
  /^\/api\/auth/,
  /^\/api\/settings/,
];

const ADMIN_ROUTES = [
  /^\/admin/,
  /^\/api\/admin/,
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(r => r.test(pathname));
}

function isAdminRoute(pathname: string) {
  return ADMIN_ROUTES.some(r => r.test(pathname));
}

// Fetch admin emails from D1 database
async function fetchAdminEmails(): Promise<string[]> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as { DB: any }).DB;
    
    if (!db) {
      console.error('D1 database not available, using fallback');
      return FALLBACK_ADMIN_EMAILS;
    }

    const result = await db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .bind('admin_emails')
      .all();

    if (!result.results || result.results.length === 0) {
      console.warn('No admin_emails setting found in database, using fallback');
      return FALLBACK_ADMIN_EMAILS;
    }

    const rawValue = (result.results[0] as { value: string }).value;
    console.log('Raw admin_emails value from D1:', rawValue);

    // Parse the JSON value
    let parsed: string[] = [];
    try {
      parsed = JSON.parse(rawValue);
    } catch (e) {
      console.error('Failed to parse admin_emails JSON:', rawValue, e);
      return FALLBACK_ADMIN_EMAILS;
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn('admin_emails is not a valid array:', parsed);
      return FALLBACK_ADMIN_EMAILS;
    }

    console.log('Admin emails successfully loaded:', parsed);
    return parsed;
  } catch (error) {
    console.error('Error fetching admin emails from D1:', error);
    return FALLBACK_ADMIN_EMAILS;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  // Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get authenticated user from Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // Check admin routes
  if (isAdminRoute(pathname)) {
    if (!user) {
      console.log('No user found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    console.log('Admin access check for user:', user.email);

    // Fetch admin emails from D1
    const adminEmails = await fetchAdminEmails();
    console.log('Checking if', user.email, 'is in admin list:', adminEmails);

    if (!adminEmails.includes(user.email ?? '')) {
      console.log('User', user.email, 'is NOT an admin, denying access');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('User', user.email, 'is an admin, granting access');
    return response;
  }

  // Check protected routes (non-public routes require login)
  if (!isPublicRoute(pathname) && !user) {
    console.log('Protected route accessed without user, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};