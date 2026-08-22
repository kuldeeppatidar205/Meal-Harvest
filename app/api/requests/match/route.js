import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import NeedRequest from '@/models/NeedRequest';
import Donation from '@/models/Donation';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in.' }, { status: 401 });
    }

    if (!['NGO', 'VOLUNTEER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only verified NGOs or Volunteers can match food to recipient requests.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, donationId } = body;

    if (!requestId || !donationId) {
      return NextResponse.json(
        { error: 'requestId and donationId are required.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const donation = await Donation.findById(donationId);
    if (!donation || donation.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Donation not found or has expired.' },
        { status: 404 }
      );
    }

    const requestDoc = await NeedRequest.findById(requestId);
    if (!requestDoc) {
      return NextResponse.json({ error: 'Need Request not found.' }, { status: 404 });
    }

    // Update Donation status to CLAIMED and reference recipient request
    donation.status = 'CLAIMED';
    donation.claimedBy = session.user.id;
    donation.transitLogs.push({
      status: 'CLAIMED',
      timestamp: new Date(),
      note: `Matched & assigned to recipient: ${requestDoc.recipientName} (${requestDoc.contactPerson})`,
      updatedBy: session.user.id,
    });
    await donation.save();

    // Update NeedRequest status to MATCHED and link donation & driver
    requestDoc.status = 'MATCHED';
    requestDoc.matchedDonationId = donationId;
    requestDoc.assignedDriverId = session.user.id;
    requestDoc.transitLogs.push({
      status: 'MATCHED',
      timestamp: new Date(),
      note: `Matched with food donation: "${donation.title}" (${donation.quantity} kg)`,
      updatedBy: session.user.id,
    });
    await requestDoc.save();

    const updatedRequest = await NeedRequest.findById(requestDoc._id)
      .populate('matchedDonationId')
      .populate('assignedDriverId', 'name email role vehicleCapacity');

    return NextResponse.json({
      message: `Food surplus "${donation.title}" successfully matched & assigned to ${requestDoc.recipientName}!`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Match Request Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
