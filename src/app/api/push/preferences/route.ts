import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In a real application, you would store these preferences in a database
// Here we use a mock storage for demonstration
const userPreferences = new Map();

export async function GET(req: NextRequest) {
  try {
    // Get user ID from authentication token
    // This is a simplified example - in practice, you'd extract this from
    // an authenticated session using a proper auth mechanism
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }
    
    // Get preferences for this user (default if not found)
    const preferences = userPreferences.get(userId) || {
      promotions: true,
      orderUpdates: true,
      accountSecurity: true,
      newsletter: false,
      priceDrop: false
    };
    
    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error getting push notification preferences:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get push notification preferences'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId, preferences } = data;
    
    if (!userId || !preferences) {
      return NextResponse.json({
        success: false,
        message: 'User ID and preferences are required'
      }, { status: 400 });
    }
    
    // Validate preferences object
    const requiredKeys = ['promotions', 'orderUpdates', 'accountSecurity', 'newsletter', 'priceDrop'];
    const hasAllKeys = requiredKeys.every(key => typeof preferences[key] === 'boolean');
    
    if (!hasAllKeys) {
      return NextResponse.json({
        success: false,
        message: 'Invalid preferences format'
      }, { status: 400 });
    }
    
    // Store preferences for this user
    userPreferences.set(userId, { ...preferences });
    
    return NextResponse.json({
      success: true,
      message: 'Push notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating push notification preferences:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update push notification preferences'
    }, { status: 500 });
  }
} 