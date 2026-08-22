import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NeedRequest from '@/models/NeedRequest';
import '@/models/Donation'; // register Donation schema so populate() works
import '@/models/User';    // register User schema so populate() works
import { calculateHaversineDistance } from '@/lib/geospatial';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius'); // in km (default 50km)

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Latitude (lat) and Longitude (lng) query parameters are required.' },
        { status: 400 }
      );
    }

    const lat = Number(latStr);
    const lng = Number(lngStr);
    const radiusKm = radiusStr ? Number(radiusStr) : 50;
    const maxDistanceMeters = radiusKm * 1000;

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
      return NextResponse.json({ error: 'Invalid numeric parameters.' }, { status: 400 });
    }

    await dbConnect();

    let requests = [];
    try {
      requests = await NeedRequest.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: maxDistanceMeters,
          },
        },
        status: { $in: ['OPEN', 'MATCHED', 'IN_TRANSIT'] },
      }).populate('matchedDonationId assignedDriverId');
    } catch (geoErr) {
      console.warn('GeoJSON $near query fallback for NeedRequest:', geoErr.message);
      const allOpen = await NeedRequest.find({
        status: { $in: ['OPEN', 'MATCHED', 'IN_TRANSIT'] },
      }).populate('matchedDonationId assignedDriverId');

      requests = allOpen.filter((item) => {
        const [itemLng, itemLat] = item.location.coordinates;
        const dist = calculateHaversineDistance(lat, lng, itemLat, itemLng);
        return dist <= radiusKm;
      });
    }

    const formattedRequests = requests.map((doc) => {
      const obj = doc.toObject ? doc.toObject() : doc;
      const [itemLng, itemLat] = obj.location.coordinates;
      const distanceKm = calculateHaversineDistance(lat, lng, itemLat, itemLng);
      return {
        ...obj,
        distanceKm: Number(distanceKm.toFixed(2)),
      };
    });

    return NextResponse.json({
      count: formattedRequests.length,
      center: { lat, lng },
      radiusKm,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error('Fetch Nearby Need Requests Error:', error);
    return NextResponse.json(
      { count: 0, requests: [], error: error.message || 'Error fetching requests' },
      { status: 200 }
    );
  }
}
