import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HttpException } from '@/lib/http-exception';

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '1000'); // meters
    const userId = searchParams.get('userId') || '';

    if (!lat || !lng) {
      throw new HttpException(400, 'Latitude and longitude are required');
    }

    // Get nearby users using Prisma
    const nearbyUsers = await prisma.user.findMany({
      where: {
        id: { not: userId },
        location: {
          isActive: true,
          lastSeen: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        privacySettings: {
          allowNearbySearch: true,
          visibility: { not: 'PRIVATE' },
        },
      },
      include: {
        location: true,
        privacySettings: true,
      },
      take: 50,
    });

    // Calculate distance and filter by radius
    const formattedUsers = nearbyUsers
      .map((user) => {
        if (!user.location) return null;

        const distance = calculateDistance(
          lat,
          lng,
          user.location.latitude,
          user.location.longitude
        );

        if (distance > radius) return null;

        return {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          distance: Math.round(distance),
          location: {
            latitude: user.location.latitude,
            longitude: user.location.longitude,
            accuracy: user.location.accuracy,
            timestamp: new Date(user.location.lastSeen).getTime(),
          },
          isOnline: user.location.isActive,
          lastSeen: new Date(user.location.lastSeen).getTime(),
          privacy: {
            visibility: user.privacySettings?.visibility,
            showDistance: user.privacySettings?.showDistance,
            showLastSeen: user.privacySettings?.showLastSeen,
          },
        };
      })
      .filter((user): user is NonNullable<typeof user> => user !== null)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching nearby users:', error);
    if (error instanceof HttpException) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch nearby users' },
      { status: 500 }
    );
  }
}
