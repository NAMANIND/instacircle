import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HttpException } from '@/lib/http-exception';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      throw new HttpException(400, 'userId is required');
    }

    const privacySettings = await prisma.privacySettings.findUnique({
      where: { userId },
    });

    if (!privacySettings) {
      // Create default privacy settings if they don't exist
      const defaultSettings = await prisma.privacySettings.create({
        data: {
          userId,
          visibility: 'FRIENDS',
          showDistance: true,
          showLastSeen: true,
          allowNearbySearch: true,
        },
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(privacySettings);
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    if (error instanceof HttpException) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      visibility,
      showDistance,
      showLastSeen,
      allowNearbySearch,
    } = body;

    if (!userId) {
      throw new HttpException(400, 'userId is required');
    }

    const privacySettings = await prisma.privacySettings.upsert({
      where: { userId },
      update: {
        visibility,
        showDistance,
        showLastSeen,
        allowNearbySearch,
      },
      create: {
        userId,
        visibility: visibility || 'FRIENDS',
        showDistance: showDistance ?? true,
        showLastSeen: showLastSeen ?? true,
        allowNearbySearch: allowNearbySearch ?? true,
      },
    });

    return NextResponse.json(privacySettings);
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    if (error instanceof HttpException) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}
