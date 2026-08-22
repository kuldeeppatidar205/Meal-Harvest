import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import User from '@/models/User';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in.' }, { status: 401 });
    }

    if (!['NGO', 'VOLUNTEER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only verified NGOs or Volunteers can claim surplus food listings.' },
        { status: 403 }
      );
    }

    if (!session.user.isVerified) {
      return NextResponse.json(
        { error: 'Forbidden: Unverified accounts cannot claim donations. Please submit verification credentials first.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { donationId } = body;

    if (!donationId) {
      return NextResponse.json({ error: 'donationId is required.' }, { status: 400 });
    }

    await dbConnect();

    // Atomic MongoDB operation preventing double-claiming race conditions
    const updatedDonation = await Donation.findOneAndUpdate(
      {
        _id: donationId,
        status: 'AVAILABLE',
        expiryTime: { $gt: new Date() },
      },
      {
        $set: {
          status: 'CLAIMED',
          claimedBy: session.user.id,
        },
        $push: {
          transitLogs: {
            status: 'CLAIMED',
            timestamp: new Date(),
            note: `Donation claimed by ${session.user.role} (${session.user.name})`,
            updatedBy: session.user.id,
          },
        },
      },
      { new: true }
    )
      .populate('providerId', 'name email organizationDetails')
      .populate('claimedBy', 'name email role vehicleCapacity organizationDetails');

    if (!updatedDonation) {
      return NextResponse.json(
        {
          error:
            'Conflict: This food donation has already been claimed by another NGO/Volunteer, or has expired.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: 'Donation claimed successfully!',
      donation: updatedDonation,
    });
  } catch (error) {
    console.error('Claim Donation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
