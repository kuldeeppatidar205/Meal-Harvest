import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/db.js';
import User from '../models/User.js';
import Donation from '../models/Donation.js';

async function seedDatabase() {
  try {
    console.log('Connecting to database for seeding...');
    await dbConnect();

    console.log('Cleaning existing demo data...');
    await User.deleteMany({ email: { $regex: /@foodrescue\.org|@ngo\.org/ } });
    await Donation.deleteMany({ title: { $regex: /Jaipur|Rajasthani|Bakery|Biryani|Vegetables|Canned/ } });

    console.log('Creating demo users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Food Providers in Jaipur
    const tajPalace = await User.create({
      name: 'Hotel Taj Palace Jaipur',
      email: 'taj.jaipur@foodrescue.org',
      password: hashedPassword,
      role: 'PROVIDER',
      isVerified: true,
      organizationDetails: {
        name: 'Taj Palace Jaipur',
        registrationId: 'HTL-JPR-8820',
        documentUrl: 'https://example.com/docs/taj.pdf',
      },
    });

    const chokhiDhani = await User.create({
      name: 'Chokhi Dhani Resort',
      email: 'chokhidhani@foodrescue.org',
      password: hashedPassword,
      role: 'PROVIDER',
      isVerified: true,
      organizationDetails: {
        name: 'Chokhi Dhani Village Resort',
        registrationId: 'HTL-JPR-9931',
        documentUrl: 'https://example.com/docs/chokhi.pdf',
      },
    });

    const lmbRest = await User.create({
      name: 'LMB Restaurant Johari Bazar',
      email: 'lmb.johari@foodrescue.org',
      password: hashedPassword,
      role: 'PROVIDER',
      isVerified: true,
      organizationDetails: {
        name: 'Laxmi Misthan Bhandar',
        registrationId: 'RST-JPR-1029',
        documentUrl: 'https://example.com/docs/lmb.pdf',
      },
    });

    // 2. Verified NGOs in Jaipur
    const akshayaPatra = await User.create({
      name: 'Akshaya Patra Foundation Jaipur',
      email: 'akshayapatra.jpr@ngo.org',
      password: hashedPassword,
      role: 'NGO',
      isVerified: true,
      organizationDetails: {
        name: 'Akshaya Patra Foundation',
        registrationId: 'NGO-JPR-4401',
        documentUrl: 'https://example.com/docs/akshaya.pdf',
      },
    });

    const robinHood = await User.create({
      name: 'Robin Hood Army Jaipur',
      email: 'robinhood.jaipur@ngo.org',
      password: hashedPassword,
      role: 'NGO',
      isVerified: true,
      organizationDetails: {
        name: 'Robin Hood Army Jaipur Chapter',
        registrationId: 'NGO-JPR-5512',
        documentUrl: 'https://example.com/docs/robinhood.pdf',
      },
    });

    // 3. Volunteer Drivers in Jaipur
    const rahulVolunteer = await User.create({
      name: 'Rahul Sharma (Jaipur Driver)',
      email: 'rahul.vol@foodrescue.org',
      password: hashedPassword,
      role: 'VOLUNTEER',
      isVerified: true,
      vehicleCapacity: 80,
      organizationDetails: {
        name: 'Jaipur Community Volunteers',
        registrationId: 'VOL-JPR-7721',
        documentUrl: 'https://example.com/docs/rahul.pdf',
      },
    });

    const priyaVolunteer = await User.create({
      name: 'Priya Verma (Jaipur Logistics)',
      email: 'priya.vol@foodrescue.org',
      password: hashedPassword,
      role: 'VOLUNTEER',
      isVerified: true,
      vehicleCapacity: 120,
      organizationDetails: {
        name: 'Jaipur Food Rescue Volunteers',
        registrationId: 'VOL-JPR-8812',
        documentUrl: 'https://example.com/docs/priya.pdf',
      },
    });

    console.log('Creating Jaipur surplus food inventory listings...');

    const now = new Date();

    // Item 1: Johari Bazar (CRITICAL - Expiry in 1.5h)
    await Donation.create({
      title: '45 Servings Fresh Rajasthani Thali & Dal Baati Churma',
      description: 'Freshly prepared surplus meals from lunch buffet. Packed in hygienic thermal containers.',
      foodType: 'COOKED_MEAL',
      quantity: 25,
      location: {
        type: 'Point',
        coordinates: [75.8246, 26.9205],
        address: 'Johari Bazar, Pink City, Jaipur, Rajasthan 302003',
      },
      expiryTime: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
      pickupWindow: {
        start: new Date(now.getTime() + 0.2 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 1.2 * 60 * 60 * 1000),
      },
      urgencyLevel: 'CRITICAL',
      status: 'AVAILABLE',
      providerId: lmbRest._id,
      transitLogs: [
        {
          status: 'AVAILABLE',
          timestamp: new Date(),
          note: 'Listing created by LMB Restaurant',
          updatedBy: lmbRest._id,
        },
      ],
    });

    // Item 2: Malviya Nagar (HIGH - Expiry in 4.5h)
    await Donation.create({
      title: '60 kg Assorted Organic Vegetables & Fresh Fruits',
      description: 'Surplus farm-fresh tomatoes, potatoes, spinach, and apples. Great condition.',
      foodType: 'PERISHABLE',
      quantity: 60,
      location: {
        type: 'Point',
        coordinates: [75.8150, 26.8529],
        address: 'Gaurav Tower Road, Malviya Nagar, Jaipur, Rajasthan 302017',
      },
      expiryTime: new Date(now.getTime() + 4.5 * 60 * 60 * 1000),
      pickupWindow: {
        start: new Date(now.getTime() + 0.5 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 3.5 * 60 * 60 * 1000),
      },
      urgencyLevel: 'HIGH',
      status: 'AVAILABLE',
      providerId: tajPalace._id,
      transitLogs: [
        {
          status: 'AVAILABLE',
          timestamp: new Date(),
          note: 'Listing created by Hotel Taj Palace',
          updatedBy: tajPalace._id,
        },
      ],
    });

    // Item 3: C-Scheme (MEDIUM - Expiry in 8h)
    await Donation.create({
      title: '80 Packs Bakery Products & Paneer Sandwich Boxes',
      description: 'Freshly baked bread loaves, croissants, and paneer sandwiches from evening event.',
      foodType: 'PERISHABLE',
      quantity: 35,
      location: {
        type: 'Point',
        coordinates: [75.8010, 26.9100],
        address: 'Ahinsa Circle, C-Scheme, Jaipur, Rajasthan 302001',
      },
      expiryTime: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      pickupWindow: {
        start: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      },
      urgencyLevel: 'MEDIUM',
      status: 'AVAILABLE',
      providerId: tajPalace._id,
      transitLogs: [
        {
          status: 'AVAILABLE',
          timestamp: new Date(),
          note: 'Listing created by Hotel Taj Palace',
          updatedBy: tajPalace._id,
        },
      ],
    });

    // Item 4: Vaishali Nagar (LOW - Expiry in 48h)
    await Donation.create({
      title: '150 kg Canned Pulses, Rice & Wheat Flour Sacks',
      description: 'Unopened bulk dry grains, basmati rice, lentils, and wheat flour bags.',
      foodType: 'NON_PERISHABLE',
      quantity: 150,
      location: {
        type: 'Point',
        coordinates: [75.7420, 26.9030],
        address: 'Amrapali Circle, Vaishali Nagar, Jaipur, Rajasthan 302021',
      },
      expiryTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      pickupWindow: {
        start: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      urgencyLevel: 'LOW',
      status: 'AVAILABLE',
      providerId: chokhiDhani._id,
      transitLogs: [
        {
          status: 'AVAILABLE',
          timestamp: new Date(),
          note: 'Listing created by Chokhi Dhani Resort',
          updatedBy: chokhiDhani._id,
        },
      ],
    });

    // Item 5: Raja Park (CLAIMED by Akshaya Patra)
    await Donation.create({
      title: '35 Portions Vegetable Biryani & Raita',
      description: 'Surplus dinner catering items kept in insulated food warmers.',
      foodType: 'COOKED_MEAL',
      quantity: 20,
      location: {
        type: 'Point',
        coordinates: [75.8310, 26.8920],
        address: 'Panchwati Circle, Raja Park, Jaipur, Rajasthan 302004',
      },
      expiryTime: new Date(now.getTime() + 1.8 * 60 * 60 * 1000),
      pickupWindow: {
        start: new Date(now.getTime() + 0.1 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
      },
      urgencyLevel: 'CRITICAL',
      status: 'CLAIMED',
      providerId: lmbRest._id,
      claimedBy: akshayaPatra._id,
      transitLogs: [
        {
          status: 'AVAILABLE',
          timestamp: new Date(now.getTime() - 30 * 60 * 1000),
          note: 'Listing created',
          updatedBy: lmbRest._id,
        },
        {
          status: 'CLAIMED',
          timestamp: new Date(),
          note: 'Claimed by Akshaya Patra Foundation',
          updatedBy: akshayaPatra._id,
        },
      ],
    });

    // Item 6: Mansarovar (IN_TRANSIT by Rahul Volunteer)
    await Donation.create({
      title: '50 kg Fresh Dairy Milk, Curd & Paneer Cubes',
      description: 'Cold chain stored dairy products with tomorrow morning expiration.',
      foodType: 'PERISHABLE',
      quantity: 50,
      location: {
        type: 'Point',
        coordinates: [75.7680, 26.8480],
        address: 'VT Road Market, Mansarovar, Jaipur, Rajasthan 302020',
      },
      expiryTime: new Date(now.getTime() + 14 * 60 * 60 * 1000),
      pickupWindow: {
        start: new Date(now.getTime() + 0.5 * 60 * 60 * 1000),
        end: new Date(now.getTime() + 10 * 60 * 60 * 1000),
      },
      urgencyLevel: 'LOW',
      status: 'IN_TRANSIT',
      providerId: chokhiDhani._id,
      claimedBy: rahulVolunteer._id,
      transitLogs: [
        {
          status: 'AVAILABLE',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          note: 'Listing created',
          updatedBy: chokhiDhani._id,
        },
        {
          status: 'CLAIMED',
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          note: 'Claimed by Rahul Volunteer',
          updatedBy: rahulVolunteer._id,
        },
        {
          status: 'IN_TRANSIT',
          timestamp: new Date(),
          note: 'Picked up for delivery to community kitchen',
          updatedBy: rahulVolunteer._id,
        },
      ],
    });

    console.log('✅ SEEDING COMPLETE FOR JAIPUR LOCALITY!');
  } catch (err) {
    console.error('❌ SEEDING ERROR:', err);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
