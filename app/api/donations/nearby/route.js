import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import User from '@/models/User';
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

    const now = new Date();

    let donations = [];
    try {
      donations = await Donation.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: maxDistanceMeters,
          },
        },
        status: { $in: ['AVAILABLE', 'CLAIMED', 'IN_TRANSIT'] },
        expiryTime: { $gt: now },
      })
        .populate('providerId', 'name email organizationDetails')
        .populate('claimedBy', 'name email role')
        .exec();
    } catch (geoError) {
      console.warn('GeoJSON $near query fallback:', geoError.message);
      try {
        const allAvailable = await Donation.find({
          status: { $in: ['AVAILABLE', 'CLAIMED', 'IN_TRANSIT'] },
          expiryTime: { $gt: now },
        })
          .populate('providerId', 'name email organizationDetails')
          .populate('claimedBy', 'name email role');

        donations = allAvailable.filter((item) => {
          const [itemLng, itemLat] = item.location.coordinates;
          const dist = calculateHaversineDistance(lat, lng, itemLat, itemLng);
          return dist <= radiusKm;
        });
      } catch {
        donations = [];
      }
    }

    const formattedDonations = donations.map((doc) => {
      const donationObj = doc.toObject ? doc.toObject() : doc;
      const [itemLng, itemLat] = donationObj.location.coordinates;
      const distanceKm = calculateHaversineDistance(lat, lng, itemLat, itemLng);
      return {
        ...donationObj,
        distanceKm: Number(distanceKm.toFixed(2)),
      };
    });

    return NextResponse.json({
      count: formattedDonations.length,
      center: { lat, lng },
      radiusKm,
      donations: formattedDonations,
    });
  } catch (error) {
    console.error('Fetch Nearby Donations Error:', error);
    return NextResponse.json(
      {
        count: 0,
        center: { lat: 0, lng: 0 },
        radiusKm: 50,
        donations: [],
        error: error.message || 'Failed to fetch nearby donations',
      },
      { status: 200 }
    );
  }
}
