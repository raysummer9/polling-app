import { NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security/csrf';

export async function GET() {
  try {
    // Generate new CSRF token
    const token = CSRFProtection.generateToken();
    const cookie = CSRFProtection.createTokenCookie(token);
    
    // Create response with token
    const response = NextResponse.json({ token });
    
    // Set CSRF token cookie
    response.headers.set('Set-Cookie', cookie);
    
    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
