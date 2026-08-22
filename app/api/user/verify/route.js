import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organizationName, registrationId, documentUrl, vehicleCapacity } = body;

    if (!organizationName || !registrationId) {
      return NextResponse.json(
        { error: 'Organization name and Registration ID are required for verification.' },
        { status: 400 }
      );
    }

    await dbConnect();

    const updateFields = {
      isVerified: true, // Mark verified upon submitting valid credentials
      organizationDetails: {
        name: organizationName,
        registrationId: registrationId,
        documentUrl: documentUrl || 'https://via.placeholder.com/150?text=Verification+Doc',
      },
    };

    if (vehicleCapacity !== undefined) {
      updateFields.vehicleCapacity = Number(vehicleCapacity);
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json({
      message: 'Verification details submitted successfully! Account is now verified.',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        organizationDetails: updatedUser.organizationDetails,
        vehicleCapacity: updatedUser.vehicleCapacity,
      },
    });
  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
