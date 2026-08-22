import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import User from '@/models/User';

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { donationId, status: newStatus, note } = body;

    if (!donationId || !newStatus) {
      return NextResponse.json(
        { error: 'donationId and status parameters are required.' },
        { status: 400 }
      );
    }

    const allowedStatuses = ['IN_TRANSIT', 'DELIVERED', 'AVAILABLE', 'CLAIMED', 'EXPIRED'];
    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await dbConnect();

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return NextResponse.json({ error: 'Donation not found.' }, { status: 404 });
    }

    // Security check: Only assigned claimer, provider, or admin can update transit status
    const isClaimer = donation.claimedBy?.toString() === session.user.id;
    const isProvider = donation.providerId?.toString() === session.user.id;

    if (!isClaimer && !isProvider) {
      return NextResponse.json(
        { error: 'Forbidden: You are not authorized to update status for this donation.' },
        { status: 403 }
      );
    }

    donation.status = newStatus;
    donation.transitLogs.push({
      status: newStatus,
      timestamp: new Date(),
      note: note || `Status updated to ${newStatus} by ${session.user.name}`,
      updatedBy: session.user.id,
    });

    await donation.save();

    const updatedDonation = await Donation.findById(donation._id)
      .populate('providerId', 'name email organizationDetails')
      .populate('claimedBy', 'name email role vehicleCapacity organizationDetails');

    return NextResponse.json({
      message: `Donation status updated to ${newStatus} successfully!`,
      donation: updatedDonation,
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
