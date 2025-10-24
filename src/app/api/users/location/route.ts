import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HttpException } from '@/lib/http-exception';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, latitude, longitude, accuracy } = body;

    if (!userId || !latitude || !longitude) {
      throw new HttpException(
        400,
        'userId, latitude, and longitude are required'
      );
    }

    // Upsert location data
    const location = await prisma.location.upsert({
      where: { userId },
      update: {
        latitude,
        longitude,
        accuracy,
        isActive: true,
        lastSeen: new Date(),
      },
      create: {
        userId,
        latitude,
        longitude,
        accuracy,
        isActive: true,
        lastSeen: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        isActive: location.isActive,
        lastSeen: location.lastSeen,
      },
    });
  } catch (error) {
    console.error('Error updating location:', error);
    if (error instanceof HttpException) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      throw new HttpException(400, 'userId is required');
    }

    const location = await prisma.location.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!location) {
      throw new HttpException(404, 'Location not found');
    }

    return NextResponse.json({
      id: location.id,
      userId: location.userId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      isActive: location.isActive,
      lastSeen: location.lastSeen,
      user: location.user,
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    if (error instanceof HttpException) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}
