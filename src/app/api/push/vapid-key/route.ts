import { NextResponse } from 'next/server';

// In a real application, these would be stored securely as environment variables
const VAPID_PUBLIC_KEY = 'BH8-lm-B6FJjlVIZLHGe99_RwjJ8iJxZa__5aKiM7xA8AqJ5_EGIZL-C3pLAYQZw8LGcJ5cNJDcLqMxJ2MRP_Og';

export async function GET() {
  return NextResponse.json({ 
    publicKey: VAPID_PUBLIC_KEY 
  });
} 