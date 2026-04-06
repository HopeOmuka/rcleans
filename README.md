# RCleans – On-Demand Cleaning, When You Need It

RCleans is a modern, on-demand cleaning platform that connects customers with trusted, professional cleaners instantly—just like ride-hailing apps connect riders with drivers. With only a few taps, users can request reliable cleaning services for homes, offices, and commercial spaces, schedule instantly or in advance, and track their cleaner in real time from arrival to completion.

RCleans removes the hassle of finding and managing cleaning services by providing a seamless, transparent, and efficient experience powered by technology.

## How RCleans Works

RCleans simplifies the cleaning process into a few easy steps:

1. **Request a Service**
   Choose the type of cleaning you need, including home cleaning, office cleaning, deep cleaning, move-in/move-out cleaning, or custom services.

2. **Get Matched Instantly**
   RCleans connects you with nearby, vetted, and verified professional cleaners in seconds.

3. **Track in Real Time**
   Monitor your cleaner's live location, estimated arrival time, and job progress directly in the app.

4. **Secure, Cashless Payment**
   Pay seamlessly through the app with clear, upfront pricing and no hidden fees.

5. **Rate and Review**
   Provide feedback after each service to maintain high quality and accountability across the platform.

## Key Features

- **On-Demand Booking** – Request cleaning services instantly or schedule ahead
- **Real-Time Tracking** – Track your cleaner's arrival and service progress live
- **Verified Professionals** – All cleaners are vetted, reviewed, and trusted
- **Flexible Scheduling** – Book services that fit your schedule
- **Transparent Pricing** – Clear pricing with no surprises
- **Secure In-App Payments** – Safe, fast, and cashless transactions
- **Ratings and Reviews** – Community-driven quality assurance

## For Customers

RCleans offers unmatched convenience, reliability, and peace of mind. Whether you need a quick cleanup, routine maintenance, or a deep professional clean, RCleans delivers high-quality service without the stress of searching, calling, or negotiating.

## For Cleaners

RCleans empowers cleaning professionals by providing:

- Consistent job opportunities
- Flexible working hours
- Fair and transparent pricing
- Fast and secure payouts
- A simple, easy-to-use mobile platform

Cleaners can focus on delivering excellent service while RCleans handles the logistics.

## Our Mission

RCleans aims to modernize the cleaning industry by making professional cleaning services more accessible, efficient, and transparent—empowering both customers and service providers through smart technology.

**RCleans: Professional cleaning, ordered as easily as a ride.**

## Recent Improvements

- **Ratings & Reviews**: Complete rating system for completed services
- **Scheduling**: Option to book services instantly or schedule for later
- **Emergency Support**: SOS button for urgent situations
- **Enhanced Profile**: Saved locations and support sections
- **Better Error Handling**: Improved loading states and error messages
- **Database Migration**: Complete schema update script for cleaning services
- **Updated Onboarding**: Cleaning-focused welcome screens

## Tech Stack

- **Framework**: React Native / Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Authentication**: Clerk
- **Database**: Neon Postgres
- **Payments**: Stripe
- **Maps**: Google Maps + Mapbox
- **State Management**: Zustand

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run the app: `npm start`

## Database Setup

1. Create a Neon Postgres database
2. Run the migration script to set up the schema:
   ```sql
   -- Run the contents of database-migration.sql in your Neon console
   ```
3. The migration will:
   - Create the `service_types` table with default cleaning services
   - Update the `cleaners` table with new fields (specialties, location, availability)
   - Recreate the `services` table with new cleaning-focused schema
   - Migrate existing data if present
   - Create performance indexes

## Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
DATABASE_URL=your_neon_database_url
EXPO_PUBLIC_MAPBOX_API_KEY=your_mapbox_key
```
