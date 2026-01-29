// Mock user data for authentication system
import { User } from '../context/auth-context';

// Demo users with hashed passwords (in real app, never store plain passwords)
// For demo, we just simulate password hashing
export interface UserWithPassword extends User {
  password: string;
}

export const MOCK_USERS: UserWithPassword[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123', // In real app this would be hashed
    avatar: 'https://placehold.co/200x200?text=John',
    role: 'user',
    credits: 1250,
    isPremium: false,
    createdAt: new Date(2022, 5, 12).toISOString(),
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password456', // In real app this would be hashed
    avatar: 'https://placehold.co/200x200?text=Jane',
    role: 'admin',
    credits: 5000,
    isPremium: true,
    createdAt: new Date(2022, 1, 24).toISOString(),
  },
  {
    id: 'user-3',
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    password: 'password789', // In real app this would be hashed
    avatar: 'https://placehold.co/200x200?text=สมชาย',
    role: 'user',
    credits: 750,
    isPremium: true,
    createdAt: new Date(2022, 8, 5).toISOString(),
  },
];

// Simulate authentication API call
export async function validateUser(email: string, password: string): Promise<User | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const user = MOCK_USERS.find(
    user => user.email.toLowerCase() === email.toLowerCase() && user.password === password
  );
  
  if (user) {
    // Return user without password (never return passwords)
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
  
  return null;
} 