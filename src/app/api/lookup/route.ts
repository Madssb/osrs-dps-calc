import { NextRequest, NextResponse } from 'next/server';
import { LookupType, lookupByName } from '@/lib/api/lookup';

const isLookupType = (t: string): t is LookupType => t === 'equipment' || t === 'monster';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const typeRaw = sp.get('type');
  const name = sp.get('name');
  const version = sp.get('version') || undefined;
  const exact = sp.get('exact') === 'true';
  const limitRaw = sp.get('limit');
  const limit = limitRaw ? Number(limitRaw) : undefined;

  if (!typeRaw || !isLookupType(typeRaw)) {
    return NextResponse.json(
      { error: '`type` must be one of: equipment, monster' },
      { status: 400 },
    );
  }

  if (!name) {
    return NextResponse.json(
      { error: '`name` query parameter is required' },
      { status: 400 },
    );
  }

  if (limitRaw && Number.isNaN(limit)) {
    return NextResponse.json(
      { error: '`limit` must be a number' },
      { status: 400 },
    );
  }

  const results = lookupByName({
    type: typeRaw,
    name,
    version,
    exact,
    limit,
  });

  return NextResponse.json({
    query: {
      type: typeRaw,
      name,
      version,
      exact,
      limit: limit || 20,
    },
    count: results.length,
    results,
  });
}
