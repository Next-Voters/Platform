import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface PhotonFeature {
  properties?: {
    name?: string;
    city?: string;
    country?: string;
    state?: string;
    osm_value?: string;
  };
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ regions: [] });
  }

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '8');
  url.searchParams.set('osm_tag', 'place:city');
  url.searchParams.append('osm_tag', 'place:town');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'NextVoters/1.0 (hello@nextvoters.com)' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ regions: [] });
    }
    const data = (await res.json()) as PhotonResponse;

    const seen = new Set<string>();
    const regions: Array<{ label: string; name: string; state: string | null; country: string | null }> = [];
    for (const feat of data.features ?? []) {
      const name = feat.properties?.name?.trim();
      if (!name) continue;
      const country = feat.properties?.country?.trim() || null;
      const state = feat.properties?.state?.trim() || null;
      const key = `${name.toLowerCase()}|${state?.toLowerCase() ?? ''}|${country?.toLowerCase() ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const label = [name, state, country].filter(Boolean).join(', ');
      regions.push({ label, name, state, country });
    }

    return NextResponse.json({ regions });
  } catch {
    return NextResponse.json({ regions: [] });
  }
}
