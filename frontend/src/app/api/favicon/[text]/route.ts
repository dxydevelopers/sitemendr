import { NextResponse } from 'next/server';

/**
 * Dynamic favicon generator for Sitemendr
 * Usage: /api/favicon/S?color=0066FF
 * Returns an SVG favicon with the first letter of the site name
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') || 'S';
  const brandColor = searchParams.get('color') || '#0066FF';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="${brandColor}"/>
      <text x="16" y="23" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700">${text.charAt(0).toUpperCase()}</text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

export const dynamic = 'force-dynamic';
