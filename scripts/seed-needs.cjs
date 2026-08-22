const mongoose = require('mongoose');

const MONGODB_URI =
  'mongodb+srv://kuldeeppatidar9091_db_user:jUmT7kQZlsHJgcdB@meal-harvest.wqrohzx.mongodb.net/food_rescue?retryWrites=true&w=majority';

const NeedRequestSchema = new mongoose.Schema(
  {
    recipientName: String,
    contactPerson: String,
    contactPhone: String,
    email: String,
    organizationType: {
      type: String,
      enum: ['SHELTER', 'COMMUNITY_KITCHEN', 'ORPHANAGE', 'INDIVIDUAL', 'SLUM_COMMUNITY', 'OTHER'],
    },
    servingsNeeded: Number,
    dietaryPreference: String,
    urgencyLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
      address: String,
    },
    status: { type: String, enum: ['OPEN', 'MATCHED', 'IN_TRANSIT', 'DELIVERED', 'FULFILLED'] },
    notes: String,
    transitLogs: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);
NeedRequestSchema.index({ location: '2dsphere' });
const NeedRequest = mongoose.models.NeedRequest || mongoose.model('NeedRequest', NeedRequestSchema);

async function seedNeedRequests() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas!');

  // Clean previous seeded requests
  await NeedRequest.deleteMany({
    recipientName: {
      $in: [
        'Jaipur Rain Basera Shelter',
        'Rajendra Nagar Anganwadi Community Kitchen',
        'Shanti Niketan Orphanage',
        'Kishanpole Slum Community',
        'Sindhi Camp Homeless Individual',
        'Gandhi Nagar Senior Citizens Group',
      ],
    },
  });
  console.log('Cleaned old need-request seed data...');

  const requests = [
    {
      recipientName: 'Jaipur Rain Basera Shelter',
      contactPerson: 'Mohan Lal Gupta',
      contactPhone: '+91 98290 55432',
      email: 'rainbasera.jpr@gmail.com',
      organizationType: 'SHELTER',
      servingsNeeded: 80,
      dietaryPreference: 'ANY',
      urgencyLevel: 'CRITICAL',
      location: {
        type: 'Point',
        coordinates: [75.7904, 26.9198], // Near Jaipur Railway Station
        address: 'Near Jaipur Railway Station, Platform 1 Entry, Sindhi Camp, Jaipur 302006',
      },
      status: 'OPEN',
      notes: 'Serving 80+ homeless persons tonight. Need cooked meals by 7 PM.',
      transitLogs: [{ status: 'OPEN', note: 'Emergency dinner need', timestamp: new Date() }],
    },
    {
      recipientName: 'Rajendra Nagar Anganwadi Community Kitchen',
      contactPerson: 'Sunita Devi',
      contactPhone: '+91 94140 22188',
      organizationType: 'COMMUNITY_KITCHEN',
      servingsNeeded: 120,
      dietaryPreference: 'VEGETARIAN',
      urgencyLevel: 'HIGH',
      location: {
        type: 'Point',
        coordinates: [75.7780, 26.8701], // Rajendra Nagar area
        address: 'Rajendra Nagar, Near Water Tank, Jaipur, Rajasthan 302004',
      },
      status: 'OPEN',
      notes: 'Running community lunch for slum families. 120 servings of dal-roti needed.',
      transitLogs: [{ status: 'OPEN', note: 'Community lunch request', timestamp: new Date() }],
    },
    {
      recipientName: 'Shanti Niketan Orphanage',
      contactPerson: 'Sister Mary Joseph',
      contactPhone: '+91 94600 11290',
      email: 'shantiniketan.jpr@gmail.com',
      organizationType: 'ORPHANAGE',
      servingsNeeded: 45,
      dietaryPreference: 'VEGETARIAN',
      urgencyLevel: 'HIGH',
      location: {
        type: 'Point',
        coordinates: [75.8370, 26.9042], // Bani Park direction
        address: 'Bani Park Extension Road, Near Civil Lines, Jaipur, Rajasthan 302016',
      },
      status: 'OPEN',
      notes: '45 children aged 4-14. Need nutritious vegetarian meals for dinner.',
      transitLogs: [{ status: 'OPEN', note: 'Orphanage dinner request', timestamp: new Date() }],
    },
    {
      recipientName: 'Kishanpole Slum Community',
      contactPerson: 'Raju Bairwa',
      contactPhone: '+91 96728 44312',
      organizationType: 'SLUM_COMMUNITY',
      servingsNeeded: 200,
      dietaryPreference: 'ANY',
      urgencyLevel: 'CRITICAL',
      location: {
        type: 'Point',
        coordinates: [75.8192, 26.9256], // Inside Walled City area
        address: 'Kishanpole Bazar, Walled City, Jaipur, Rajasthan 302001',
      },
      status: 'OPEN',
      notes: '200 daily-wage workers and families have not eaten since morning. Urgent dry rations or cooked food needed.',
      transitLogs: [{ status: 'OPEN', note: 'Urgent slum community need', timestamp: new Date() }],
    },
    {
      recipientName: 'Sindhi Camp Homeless Individual',
      contactPerson: 'Ghanshyam Das',
      contactPhone: '+91 80050 99311',
      organizationType: 'INDIVIDUAL',
      servingsNeeded: 5,
      dietaryPreference: 'ANY',
      urgencyLevel: 'CRITICAL',
      location: {
        type: 'Point',
        coordinates: [75.7940, 26.9234], // Very close to Jaipur station
        address: 'Sindhi Camp Bus Stand, Near Gate 3, Jaipur, Rajasthan 302006',
      },
      status: 'OPEN',
      notes: 'Family of 5 sleeping on footpath. Any food will help.',
      transitLogs: [{ status: 'OPEN', note: 'Individual family in need', timestamp: new Date() }],
    },
    {
      recipientName: 'Gandhi Nagar Senior Citizens Group',
      contactPerson: 'Dr. Ramesh Chand',
      contactPhone: '+91 99290 76543',
      organizationType: 'COMMUNITY_KITCHEN',
      servingsNeeded: 30,
      dietaryPreference: 'VEGETARIAN',
      urgencyLevel: 'MEDIUM',
      location: {
        type: 'Point',
        coordinates: [75.8044, 26.9177], // Gandhi Nagar
        address: 'Gandhi Nagar Main Road, Adarsh Nagar, Jaipur, Rajasthan 302015',
      },
      status: 'OPEN',
      notes: 'Evening meals for 30 elderly persons living alone. Soft/easy-to-eat food preferred.',
      transitLogs: [{ status: 'OPEN', note: 'Senior citizen meal request', timestamp: new Date() }],
    },
  ];

  for (const r of requests) {
    await NeedRequest.create(r);
    console.log(`  ✓ Created: ${r.recipientName}`);
  }

  console.log('\n🎉 SUCCESS: 6 Jaipur Community Need Requests Seeded!');
  process.exit(0);
}

seedNeedRequests().catch((err) => {
  console.error('❌ Seed Error:', err.message);
  process.exit(1);
});
