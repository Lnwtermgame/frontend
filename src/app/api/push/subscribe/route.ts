import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In a real application, you would store subscriptions in a database
// Here we simulate with an in-memory store
// Keep in mind this doesn't persist between server restarts
const subscriptions = new Map();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { subscription, userToken } = data;
    
    if (!subscription || !userToken) {
      return NextResponse.json({
        success: false,
        message: 'Missing subscription data or user token'
      }, { status: 400 });
    }
    
    // Store the subscription with the user token as the key
    subscriptions.set(userToken, subscription);
    
    // Set a cookie to remember this subscription on the client
    const cookieStore = cookies();
    cookieStore.set('push_subscription_id', userToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to push notifications'
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to subscribe to push notifications'
    }, { status: 500 });
  }
} 