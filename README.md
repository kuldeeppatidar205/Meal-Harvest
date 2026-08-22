# Meal-Harvest

Meal-Harvest connects surplus food providers with verified NGOs and volunteer drivers who can move food to nearby communities in need. The platform uses live geospatial data, browser location, MongoDB indexes, and route-priority scoring to support quick food rescue decisions.

## Features

- Live map of nearby food donations and community need requests
- Role-based accounts for food providers, NGOs, and volunteer drivers
- Provider portal for posting surplus inventory and pickup windows
- NGO and driver dashboard for filtering, claiming, matching, and tracking donations
- Food support request form for shelters, community kitchens, orphanages, individuals, and communities
- Browser GPS detection with a Jaipur, Rajasthan fallback location
- Atomic donation claims to prevent two users from claiming the same listing
- Route recommendations based on expiry time, distance, and vehicle capacity
- Verification details and account status shown throughout the app

## Tech Stack

- Next.js 14 App Router
- React 18
- NextAuth credentials authentication
- MongoDB with Mongoose and 2dsphere geospatial indexes
- Leaflet and React Leaflet maps
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database, either local or MongoDB Atlas

### Installation

```bash
npm install
```

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/food_rescue
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
```

For MongoDB Atlas, replace `MONGODB_URI` with your connection string. Keep `.env.local` private and never commit database credentials or authentication secrets.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Data

The repository includes Jaipur demo-data scripts for local testing. They create verified provider, NGO, and volunteer accounts, food donations, and community need requests.

```bash
node scripts/seed.cjs
node scripts/seed-needs.cjs
node scripts/create-indexes.cjs
```

The seeded demo accounts use the password `password123`. Change or remove demo credentials before using a shared or production database. The seed scripts remove matching demo records before recreating them.

## Some user IDs and pass for checking the website

## Provider - kuldeep@gmail.com - 963852
## Driver / NGOs - kuldeeppatel2052007@gmail.com - 963852

## User Roles

| Role | Main actions |
| --- | --- |
| Food Provider | Register, verify an account, post and manage surplus food listings |
| NGO | Register, verify an account, view nearby supply and needs, claim or match food |
| Volunteer Driver | Register with vehicle capacity, verify an account, claim food and use route recommendations |
| Community recipient | Submit a food need request with location, serving count, dietary preference, and urgency |

Unverified providers cannot post listings. Unverified NGOs and volunteer drivers cannot claim donations. Verification is completed from the in-app verification banner using organization name and registration ID.

## Main Routes

- `/` - Public home page and live geospatial map
- `/register` - Create a provider, NGO, or volunteer account
- `/login` - Sign in with email and password
- `/provider` - Provider listing portal
- `/dashboard` - NGO and volunteer dashboard with route optimization
- `/request-food` - Submit a community food need

## Useful Commands

```bash
npm run dev       # Start development mode
npm run build     # Create a production build
npm start         # Serve the production build
npm run lint      # Run Next.js linting
```

## Data and Location Notes

Donation and need-request coordinates use GeoJSON `[longitude, latitude]` order. The app searches within a configurable radius and falls back to a Haversine-distance calculation if MongoDB geospatial queries are unavailable. Browser location permission is optional; without it, the map defaults to Jaipur.

## Production Notes

- Set a strong, unique `NEXTAUTH_SECRET` in the deployment environment.
- Use a restricted MongoDB user and a production database rather than the demo database.
- Configure the deployed origin in `NEXTAUTH_URL`.
- Do not expose `.env.local` or seed scripts containing credentials.
