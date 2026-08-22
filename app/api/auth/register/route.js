import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, role, organizationDetails, vehicleCapacity } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required.' },
        { status: 400 }
      );
    }

    if (!['PROVIDER', 'NGO', 'VOLUNTEER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid user role specified.' },
        { status: 400 }
      );
    }

    try {
      await dbConnect();
    } catch (dbErr) {
      console.error('Database connection failed in registration handler:', dbErr.message);

      let userMsg = 'Database connection failed. ';
      if (dbErr.message.includes('ECONNREFUSED')) {
        userMsg += 'Could not connect to local MongoDB (127.0.0.1:27017). Please check if your local MongoDB service is running or update MONGODB_URI in .env.local with a valid MongoDB Atlas connection string.';
      } else if (dbErr.message.includes('bad auth') || dbErr.message.includes('authentication failed')) {
        userMsg += 'MongoDB Atlas authentication failed. The username or password in MONGODB_URI inside .env.local is incorrect.';
      } else {
        userMsg += dbErr.message;
      }

      return NextResponse.json({ error: userMsg }, { status: 503 });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isVerified: false,
      organizationDetails: organizationDetails || { name: '', registrationId: '', documentUrl: '' },
      vehicleCapacity: vehicleCapacity ? Number(vehicleCapacity) : 0,
    });

    return NextResponse.json(
      {
        message: 'User registered successfully.',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isVerified: newUser.isVerified,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
