import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Donation, { getUrgencyLevel } from '@/models/Donation';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// POST: Create a new surplus food donation listing (PROVIDER only & Verified)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in.' }, { status: 401 });
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Forbidden: Only food providers can post surplus inventory.' },
        { status: 403 }
      );
    }

    if (!session.user.isVerified) {
      return NextResponse.json(
        { error: 'Forbidden: Unverified providers cannot post listings. Please submit verification credentials first.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      foodType,
      quantity,
      longitude,
      latitude,
      address,
      expiryTime,
      pickupWindowStart,
      pickupWindowEnd,
    } = body;

    if (
      !title ||
      !foodType ||
      !quantity ||
      longitude === undefined ||
      latitude === undefined ||
      !expiryTime ||
      !pickupWindowStart ||
      !pickupWindowEnd
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: title, foodType, quantity, coordinates, expiryTime, pickupWindow.' },
        { status: 400 }
      );
    }

    const lng = Number(longitude);
    const lat = Number(latitude);
    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'Invalid longitude or latitude values.' },
        { status: 400 }
      );
    }

    const expDate = new Date(expiryTime);
    if (expDate <= new Date()) {
      return NextResponse.json(
        { error: 'Expiration time must be in the future.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const urgency = getUrgencyLevel(expDate);

    const newDonation = await Donation.create({
      title,
      description: description || '',
      foodType,
      quantity: Number(quantity),
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        address: address || '',
      },
      expiryTime: expDate,
      pickupWindow: {
        start: new Date(pickupWindowStart),
        end: new Date(pickupWindowEnd),
      },
      urgencyLevel: urgency,
      status: 'AVAILABLE',
      providerId: session.user.id,
      transitLogs: [
        {
          status: 'AVAILABLE',
          timestamp: new Date(),
          note: 'Donation listing posted by provider',
          updatedBy: session.user.id,
        },
      ],
    });

    const populatedDonation = await Donation.findById(newDonation._id).populate(
      'providerId',
      'name email organizationDetails'
    );

    return NextResponse.json(
      {
        message: 'Donation listing created successfully!',
        donation: populatedDonation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create Donation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// GET: Fetch donations (supports provider filter)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const providerOnly = searchParams.get('providerOnly');

    await dbConnect();

    let query = {};
    if (providerOnly === 'true' && session?.user?.id) {
      query.providerId = session.user.id;
    } else {
      query.expiryTime = { $gt: new Date() };
    }

    const donations = await Donation.find(query)
      .populate('providerId', 'name email organizationDetails')
      .populate('claimedBy', 'name email role vehicleCapacity organizationDetails')
      .sort({ createdAt: -1 });

    return NextResponse.json({ donations: donations || [] });
  } catch (error) {
    console.error('Fetch Donations Error:', error);
    return NextResponse.json(
      { donations: [], error: error.message || 'Database connection error' },
      { status: 200 }
    );
  }
}

// DELETE: Provider can delete their own donation listing by ?id=<donationId>
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const donationId = searchParams.get('id');

    if (!donationId) {
      return NextResponse.json({ error: 'Donation ID is required as ?id=...' }, { status: 400 });
    }

    await dbConnect();

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return NextResponse.json({ error: 'Donation not found.' }, { status: 404 });
    }

    // Only the original provider (or any admin in future) can delete
    if (donation.providerId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own food listings.' },
        { status: 403 }
      );
    }

    await Donation.findByIdAndDelete(donationId);
    return NextResponse.json({ message: 'Donation listing deleted successfully.' });
  } catch (error) {
    console.error('Delete Donation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
