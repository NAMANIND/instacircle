import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HttpException } from '@/lib/http-exception';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, avatar } = body;

    if (!name || !email) {
      throw new HttpException(400, 'Name and email are required');
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        avatar,
      },
    });

    // Create default privacy settings
    await prisma.privacySettings.create({
      data: {
        userId: user.id,
        visibility: 'FRIENDS',
        showDistance: true,
        showLastSeen: true,
        allowNearbySearch: true,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof HttpException) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        location: true,
        privacySettings: true,
      },
    });

    if (!user) {
      throw new HttpException(404, 'User not found');
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      location: user.location,
      privacySettings: user.privacySettings,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error instanceof HttpException) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
