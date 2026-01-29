import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userToken } = data;
    
    if (!userToken) {
      return NextResponse.json({
        success: false,
        message: 'Missing user token'
      }, { status: 400 });
    }
    
    // In a real application, you would remove the subscription from your database
    // Here we just remove the cookie
    
    const cookieStore = await cookies();
    cookieStore.delete('push_subscription_id');
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to unsubscribe from push notifications'
    }, { status: 500 });
  }
} 