import { NextRequest, NextResponse } from 'next/server';
import { computeTtkForSetup, TtkApiRequest } from '@/lib/api/ttk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<TtkApiRequest>;

    if (typeof body.monsterId !== 'number' && typeof body.monsterId !== 'string') {
      return NextResponse.json(
        { error: '`monsterId` must be a number or string' },
        { status: 400 },
      );
    }

    if (!body.setup || typeof body.setup !== 'object') {
      return NextResponse.json(
        { error: '`setup` is required' },
        { status: 400 },
      );
    }

    if (!body.setup.equipment || typeof body.setup.equipment !== 'object') {
      return NextResponse.json(
        { error: '`setup.equipment` is required' },
        { status: 400 },
      );
    }

    const result = computeTtkForSetup(body as TtkApiRequest);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
