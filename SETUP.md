# InstaCircle Radar Setup Guide

## 🚀 Quick Start

### 1. Database Setup

You need a PostgreSQL database with PostGIS extension for geospatial queries.

#### Option A: Local PostgreSQL with PostGIS

```bash
# Install PostgreSQL and PostGIS
brew install postgresql postgis  # macOS
# or
sudo apt-get install postgresql postgis  # Ubuntu

# Create database
createdb instacircle

# Enable PostGIS extension
psql instacircle -c "CREATE EXTENSION postgis;"
```

#### Option B: Use Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Enable PostGIS in the SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/instacircle?schema=public"

# Next.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

## 🎯 Features Implemented

### ✅ Core Features

- **Real-time Location Sharing** - Users can share their location with privacy controls
- **Interactive Radar Interface** - Animated radar showing nearby users
- **Privacy Settings** - Granular control over location visibility
- **Infinite Polling** - Real-time updates without WebSocket complexity
- **Geospatial Queries** - Efficient nearby user search using PostGIS

### ✅ API Endpoints

- `POST /api/users` - Create user account
- `GET /api/users?userId=xxx` - Get user profile
- `POST /api/users/location` - Update user location
- `GET /api/users/location?userId=xxx` - Get user location
- `GET /api/users/nearby?lat=xxx&lng=xxx&radius=xxx` - Find nearby users
- `GET /api/users/privacy?userId=xxx` - Get privacy settings
- `PUT /api/users/privacy` - Update privacy settings

### ✅ Components

- **Radar Component** - Interactive radar with real-time updates
- **User Manager** - Simple user creation and management
- **Privacy Settings** - Location privacy controls
- **UI Components** - Button, Card, Switch, Select

## 🔧 How It Works

### Location Polling

- Polls user location every 5 seconds
- Updates location on server automatically
- Fetches nearby users based on current location
- Respects privacy settings for visibility

### Privacy Controls

- **Visibility Levels**: Public, Friends Only, Private
- **Show Distance**: Toggle exact distance display
- **Show Last Seen**: Toggle last active time
- **Allow Nearby Search**: Control if others can find you

### Database Schema

- **Users**: Basic user information
- **Locations**: User location data with timestamps
- **Privacy Settings**: User privacy preferences
- **PostGIS**: Geospatial queries for nearby users

## 🚀 Next Steps for Production

### 1. Authentication

- Add proper user authentication (NextAuth.js)
- Implement user registration/login
- Add email verification

### 2. Real-time Features

- Replace polling with WebSocket connections
- Add push notifications
- Implement live chat/messaging

### 3. Enhanced Features

- User profiles and interests
- Friend connections
- Location history
- Geofencing

### 4. Performance

- Add Redis for caching
- Implement rate limiting
- Add database indexing
- Optimize geospatial queries

### 5. Security

- Encrypt location data
- Add rate limiting
- Implement proper CORS
- Add input validation

## 🐛 Troubleshooting

### Database Connection Issues

- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify PostGIS extension is installed

### Location Permission Issues

- Ensure HTTPS in production
- Check browser geolocation permissions
- Handle permission denied gracefully

### API Errors

- Check browser console for errors
- Verify API endpoints are working
- Check database connection

## 📱 Testing

1. Open the app in multiple browser tabs
2. Create different user accounts
3. Allow location access
4. See users appear on each other's radar
5. Test privacy settings

The radar will show real nearby users based on their actual locations!
