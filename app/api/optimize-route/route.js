import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import NeedRequest from '@/models/NeedRequest';
import { calculateHaversineDistance } from '@/lib/geospatial';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    const body = await req.json();
    const {
      latitude,
      longitude,
      vehicleCapacity: customCapacity,
      alpha: userAlpha,
      beta: userBeta,
      gamma: userGamma,
    } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Driver coordinates (latitude and longitude) are required.' },
        { status: 400 }
      );
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Invalid coordinate values.' }, { status: 400 });
    }

    const vehicleCapacity = Number(
      customCapacity || session?.user?.vehicleCapacity || 50
    );

    const alpha = userAlpha ? Number(userAlpha) : 0.5;
    const beta = userBeta ? Number(userBeta) : 0.3;
    const gamma = userGamma ? Number(userGamma) : 0.2;

    await dbConnect();
    const now = new Date();

    // 1. Fetch available food donations
    const availableDonations = await Donation.find({
      status: 'AVAILABLE',
      expiryTime: { $gt: now },
    }).populate('providerId', 'name email organizationDetails');

    // 2. Fetch open needy recipient requests
    const openNeedRequests = await NeedRequest.find({
      status: 'OPEN',
    });

    if (!availableDonations || availableDonations.length === 0) {
      return NextResponse.json({
        message: 'No available food donations found for route optimization.',
        recommendations: [],
      });
    }

    // Process each food donation and pair with nearest needy recipient
    const scoredRoutes = availableDonations.map((donation) => {
      const donationObj = donation.toObject();
      const [pickupLng, pickupLat] = donationObj.location.coordinates;

      // Distance from Driver to Pickup (km)
      const distDriverToPickup = calculateHaversineDistance(lat, lng, pickupLat, pickupLng);

      // Find nearest needy organization / recipient for this food pickup
      let nearestRecipient = null;
      let minDistPickupToDropoff = Infinity;

      openNeedRequests.forEach((reqDoc) => {
        const reqObj = reqDoc.toObject();
        const [dropLng, dropLat] = reqObj.location.coordinates;
        const dist = calculateHaversineDistance(pickupLat, pickupLng, dropLat, dropLng);

        if (dist < minDistPickupToDropoff) {
          minDistPickupToDropoff = dist;
          nearestRecipient = {
            id: reqObj._id,
            recipientName: reqObj.recipientName,
            organizationType: reqObj.organizationType,
            contactPerson: reqObj.contactPerson,
            contactPhone: reqObj.contactPhone,
            servingsNeeded: reqObj.servingsNeeded,
            dietaryPreference: reqObj.dietaryPreference,
            urgencyLevel: reqObj.urgencyLevel,
            address: reqObj.location?.address || '',
            coordinates: reqObj.location?.coordinates || [],
            distanceFromPickupKm: Number(dist.toFixed(2)),
          };
        }
      });

      // Total Route Distance (Driver ➔ Pickup ➔ Dropoff)
      const totalRouteKm =
        nearestRecipient && minDistPickupToDropoff !== Infinity
          ? distDriverToPickup + minDistPickupToDropoff
          : distDriverToPickup;

      // Time remaining to expiration (hours)
      const timeRemainingHours = Math.max(
        0.01,
        (new Date(donationObj.expiryTime).getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      // Capacity match ratio
      const capacityMatchRatio =
        vehicleCapacity > 0 ? Math.min(1, donationObj.quantity / vehicleCapacity) : 1;

      // Formula: S = (T_exp / alpha) + (D / beta) + (gamma * C)
      const rawScore =
        timeRemainingHours / alpha + totalRouteKm / beta + gamma * capacityMatchRatio;

      const priorityIndex =
        (alpha / timeRemainingHours) * 10 +
        (beta / Math.max(0.5, totalRouteKm)) * 10 +
        gamma * capacityMatchRatio * 5;

      return {
        ...donationObj,
        distanceFromDriverKm: Number(distDriverToPickup.toFixed(2)),
        totalRouteKm: Number(totalRouteKm.toFixed(2)),
        timeRemainingHours: Number(timeRemainingHours.toFixed(2)),
        capacityMatchRatio: Number(capacityMatchRatio.toFixed(2)),
        score: Number(rawScore.toFixed(3)),
        priorityIndex: Number(priorityIndex.toFixed(2)),
        nearestRecipient,
      };
    });

    // Sort by priorityIndex descending
    scoredRoutes.sort((a, b) => b.priorityIndex - a.priorityIndex);

    return NextResponse.json({
      driverLocation: { lat, lng },
      vehicleCapacity,
      totalAvailable: scoredRoutes.length,
      recommendations: scoredRoutes,
    });
  } catch (error) {
    console.error('Route Optimization Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
