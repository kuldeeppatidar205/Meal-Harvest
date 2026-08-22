import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NeedRequest from '@/models/NeedRequest';
import '@/models/Donation'; // register Donation schema for populate()
import '@/models/User';    // register User schema for populate()

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      recipientName,
      contactPerson,
      contactPhone,
      email,
      organizationType,
      servingsNeeded,
      dietaryPreference,
      urgencyLevel,
      longitude,
      latitude,
      address,
      notes,
    } = body;

    if (
      !recipientName ||
      !contactPerson ||
      !contactPhone ||
      !servingsNeeded ||
      longitude === undefined ||
      latitude === undefined ||
      !address
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientName, contactPerson, contactPhone, servingsNeeded, coordinates, address.' },
        { status: 400 }
      );
    }

    const lng = Number(longitude);
    const lat = Number(latitude);
    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return NextResponse.json({ error: 'Invalid coordinate values.' }, { status: 400 });
    }

    await dbConnect();

    const newRequest = await NeedRequest.create({
      recipientName,
      contactPerson,
      contactPhone,
      email: email || '',
      organizationType: organizationType || 'INDIVIDUAL',
      servingsNeeded: Number(servingsNeeded),
      dietaryPreference: dietaryPreference || 'ANY',
      urgencyLevel: urgencyLevel || 'HIGH',
      location: { type: 'Point', coordinates: [lng, lat], address },
      notes: notes || '',
      status: 'OPEN',
      transitLogs: [{ status: 'OPEN', timestamp: new Date(), note: 'Food need request submitted' }],
    });

    return NextResponse.json(
      { message: 'Food need request registered successfully!', request: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit Need Request Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const requests = await NeedRequest.find({ status: { $ne: 'FULFILLED' } })
      .populate('matchedDonationId')
      .populate('assignedDriverId', 'name email role vehicleCapacity')
      .sort({ createdAt: -1 });

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('Fetch Need Requests Error:', error);
    return NextResponse.json(
      { requests: [], error: error.message || 'Failed to fetch requests' },
      { status: 200 }
    );
  }
}

// DELETE: Remove a need request by ID (?id=<requestId>)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required as query param ?id=...' }, { status: 400 });
    }

    await dbConnect();

    const deleted = await NeedRequest.findByIdAndDelete(requestId);
    if (!deleted) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Food need request deleted successfully.' });
  } catch (error) {
    console.error('Delete Need Request Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
