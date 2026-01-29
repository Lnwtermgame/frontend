# SEAGM-Inspired Digital Top-up Platform Blueprint

This document outlines a comprehensive UI/UX blueprint for a digital top-up platform inspired by SEAGM.com, featuring a Windows 11-inspired design aesthetic.

## Tech Stack
- **Next.js**: Framework for server-rendered React applications
- **React**: Frontend library
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **Lucide**: Modern icon library

## Development Approach
- **Frontend-First**: Building the UI/UX first without backend integration
- **Mock Data**: Using static JSON files for product data, user data, and order history
- **Client-Side State**: Leveraging React state management via Context API or Zustand
- **Local Storage**: Persisting cart and user preferences in browser storage
- **Simulated Authentication**: Building auth UI flows without actual backend validation
- **Future API Integration Points**: Clearly documented areas for future backend integration

## Design Philosophy
- Clean, rounded, Windows 11-inspired design with soft shadows and glass-like effects
- Responsive layout (desktop-first, mobile adaptive)
- Emphasis on user clarity and modern UX best practices

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── account/
│   │   ├── dashboard/page.tsx
│   │   ├── orders/page.tsx
│   │   └── payments/page.tsx
│   ├── cart/page.tsx
│   ├── categories/
│   │   ├── [category]/page.tsx
│   │   └── page.tsx
│   ├── checkout/page.tsx
│   ├── orders/
│   │   └── [orderId]/page.tsx
│   ├── products/
│   │   └── [productId]/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   ├── main-nav.tsx
│   │   ├── mobile-nav.tsx
│   │   └── site-header.tsx
│   ├── ui/
│   │   └── [shadcn components]
│   ├── account/
│   │   ├── order-history.tsx
│   │   ├── payment-methods.tsx
│   │   └── profile-info.tsx
│   ├── cart/
│   │   ├── cart-item.tsx
│   │   └── cart-summary.tsx
│   ├── checkout/
│   │   ├── payment-selector.tsx
│   │   └── promo-code.tsx
│   ├── home/
│   │   ├── featured-games.tsx
│   │   ├── hero-banner.tsx
│   │   └── promotions.tsx
│   ├── products/
│   │   ├── game-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── search-filter.tsx
│   │   ├── server-selector.tsx
│   │   └── top-up-form.tsx
│   └── orders/
│       └── order-status.tsx
├── lib/
│   ├── utils.ts
│   ├── fonts.ts
│   ├── hooks/
│   │   ├── use-cart.ts
│   │   ├── use-auth.ts
│   │   └── use-local-storage.ts
│   └── context/
│       ├── cart-context.tsx
│       └── auth-context.tsx
├── mocks/
│   ├── products.json
│   ├── categories.json
│   ├── users.json
│   └── orders.json
├── public/
└── styles/
    └── globals.css
```

## Page-by-Page Blueprint

### Homepage (`app/page.tsx`)

```tsx
// Main layout with hero, featured games, and promotions
import { FeaturedGames, HeroBanner, Promotions } from "@/components/home";
import { getFeaturedProducts } from "@/lib/data"; // This will import mock data in frontend-only mode

export default async function HomePage() {
  // In frontend-only mode, this loads from mock data
  const featuredProducts = await getFeaturedProducts();
  
  return (
<div className="container mx-auto px-4 py-8">
  <HeroBanner />
      <FeaturedGames products={featuredProducts} />
  <Promotions />
</div>
  );
}
```

Components:
- `HeroBanner`: Full-width carousel with glass effect (backdrop-blur)
- `FeaturedGames`: Grid of popular games using Card component
- `Promotions`: Special offers section with accent colors

### Category Page (`app/categories/[category]/page.tsx`)

```tsx
// Game category display with filters and search
<div className="container mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold mb-6">{category.name}</h1>
  <SearchFilter />
  <ProductGrid products={products} />
</div>
```

Components:
- `SearchFilter`: Combines shadcn/ui Input, Select, and Button with Lucide icons
- `ProductGrid`: Responsive grid of GameCard components

### Product Detail Page (`app/products/[productId]/page.tsx`)

```tsx
// Product information and top-up options
import { ServerSelector, TopUpForm } from "@/components/products";
import { getProductById } from "@/lib/data";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@/components/ui";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: { productId: string } }) {
  try {
    // In frontend-only mode, this loads from mock data
    const product = await getProductById(params.productId);
    
    return (
<div className="container mx-auto px-4 py-8">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="rounded-xl overflow-hidden shadow-lg">
      <img src={product.image} alt={product.name} />
      <div className="p-6 bg-white/80 backdrop-blur">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-gray-600">{product.description}</p>
      </div>
    </div>
    <div>
      <Card className="p-6 bg-white/90 backdrop-blur rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle>Top-up Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerSelector servers={product.servers} />
          <TopUpForm product={product} />
        </CardContent>
        <CardFooter>
          <Button className="w-full">Add to Cart</Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</div>
    );
  } catch (error) {
    // Handle product not found gracefully
    notFound();
  }
}
```

Components:
- `ServerSelector`: shadcn/ui Select component for choosing game server
- `TopUpForm`: Form with Input for amount, price display, and quantity selection

### Checkout Page (`app/checkout/page.tsx`)

```tsx
// Payment processing with order summary
<div className="container mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold mb-6">Checkout</h1>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2">
      <Card className="mb-6 rounded-xl shadow-lg bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentSelector />
        </CardContent>
      </Card>
      <Card className="rounded-xl shadow-lg bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle>Promo Code</CardTitle>
        </CardHeader>
        <CardContent>
          <PromoCode />
        </CardContent>
      </Card>
    </div>
    <div>
      <CartSummary />
      <Button className="w-full mt-4">Complete Purchase</Button>
    </div>
  </div>
</div>
```

Components:
- `PaymentSelector`: Tabs of payment options with icons
- `PromoCode`: Input with apply button
- `CartSummary`: Order details with subtotal and fees

### Order Tracking (`app/orders/[orderId]/page.tsx`)

```tsx
// Order status visualization
<div className="container mx-auto px-4 py-8">
  <Card className="rounded-xl shadow-lg bg-white/90 backdrop-blur">
    <CardHeader>
      <CardTitle className="flex justify-between">
        Order #{order.id}
        <Badge>{order.status}</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <OrderStatus order={order} />
    </CardContent>
    <CardFooter>
      <Button variant="outline" className="flex items-center">
        <MessageCircle className="mr-2 h-4 w-4" />
        Contact Support
      </Button>
    </CardFooter>
  </Card>
</div>
```

Components:
- `OrderStatus`: Steps component showing order progress
- `Badge`: Status indicator with appropriate color

### Account Dashboard (`app/account/dashboard/page.tsx`)

```tsx
// User account overview
<div className="container mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold mb-6">Account Dashboard</h1>
  <Tabs defaultValue="overview">
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="orders">Orders</TabsTrigger>
      <TabsTrigger value="payments">Payment Methods</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">
      <ProfileInfo />
    </TabsContent>
    <TabsContent value="orders">
      <OrderHistory />
    </TabsContent>
    <TabsContent value="payments">
      <PaymentMethods />
    </TabsContent>
  </Tabs>
</div>
```

Components:
- `ProfileInfo`: User details with edit capability
- `OrderHistory`: Table of past orders
- `PaymentMethods`: Saved payment options

## Core Components Implementation

### Header (`components/layout/header.tsx`)

```tsx
// Site navigation with glass effect
<header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
  <div className="container flex items-center justify-between h-16 px-4">
    <Link href="/" className="flex items-center space-x-2">
      <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
      <span className="font-bold">TopUpHub</span>
    </Link>
    <MainNav />
    <div className="flex items-center space-x-4">
      <Button variant="ghost" size="icon">
        <Search className="h-5 w-5" />
      </Button>
      <Link href="/cart">
        <Button variant="ghost" size="icon">
          <ShoppingCart className="h-5 w-5" />
          <span className="sr-only">Cart</span>
        </Button>
      </Link>
      <UserButton />
    </div>
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <MobileNav />
      </SheetContent>
    </Sheet>
  </div>
</header>
```

### GameCard (`components/products/game-card.tsx`)

```tsx
// Product card with Windows 11 style
export function GameCard({ game }) {
  return (
    <Link href={`/products/${game.id}`}>
      <div className="group rounded-xl bg-white/80 backdrop-blur shadow-lg overflow-hidden transition-all hover:shadow-xl">
        <div className="aspect-video relative overflow-hidden">
          <img 
            src={game.image} 
            alt={game.name} 
            className="object-cover w-full h-full transition-transform group-hover:scale-105" 
          />
        </div>
        <div className="p-4">
          <h3 className="font-medium line-clamp-1">{game.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline">{game.platform}</Badge>
            <span className="font-bold text-primary">${game.startingPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### TopUpForm (`components/products/top-up-form.tsx`)

```tsx
// Form for selecting top-up amount
export function TopUpForm({ product }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="amount">Top-up Amount</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select amount" />
          </SelectTrigger>
          <SelectContent>
            {product.denominations.map((amount) => (
              <SelectItem key={amount.id} value={amount.id}>
                {amount.value} {product.currency} - ${amount.price}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center">
          <Button variant="outline" size="icon">
            <Minus className="h-4 w-4" />
          </Button>
          <Input 
            id="quantity" 
            type="number" 
            value="1" 
            className="w-16 text-center mx-2" 
          />
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <div className="flex justify-between mb-2">
          <span>Price:</span>
          <span className="font-bold">${product.price}</span>
        </div>
      </div>
    </div>
  );
}
```

## Design System Notes

### Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      colors: {
        primary: '#0078d4', // Windows blue
        background: {
          DEFAULT: '#f9f9f9',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### Glass Effect Utility Classes

```css
/* globals.css */
.glass {
  @apply bg-white/80 backdrop-blur-md;
}

.glass-card {
  @apply rounded-xl bg-white/80 backdrop-blur-md shadow-glass;
}
```

### Icon System

Use Lucide icons throughout the application for consistency:
- `<Search />` for search functionality
- `<ShoppingCart />` for cart
- `<User />` for account
- `<CreditCard />` for payments
- `<Package />` for orders
- `<ChevronRight />` for navigation
- `<Check />` for confirmation

## Responsive Design Strategy

- Use grid with responsive columns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Implement a mobile navigation drawer using shadcn's Sheet component
- Stack layouts vertically on mobile: `flex-col md:flex-row`
- Adjust padding and font sizes: `text-lg md:text-xl lg:text-2xl`
- Use dynamic spacing: `space-y-4 md:space-y-6 lg:space-y-8` 

## Frontend-Only Implementation Details

### Mock Data Structure

```js
// mocks/products.json
[
  {
    "id": "1",
    "name": "Mobile Legends",
    "image": "/images/games/mobile-legends.jpg",
    "description": "Top up your Mobile Legends diamonds quickly and securely.",
    "platform": "Mobile",
    "startingPrice": 0.99,
    "currency": "Diamonds",
    "denominations": [
      { "id": "1", "value": 100, "price": 1.99 },
      { "id": "2", "value": 300, "price": 4.99 },
      { "id": "3", "value": 500, "price": 9.99 }
    ],
    "servers": [
      { "id": "1", "name": "Asia Server" },
      { "id": "2", "name": "NA Server" },
      { "id": "3", "name": "EU Server" }
    ],
    "categoryId": "1"
  }
]

// mocks/categories.json
[
  {
    "id": "1",
    "name": "Mobile Games",
    "slug": "mobile-games",
    "image": "/images/categories/mobile-games.jpg"
  }
]
```

### Data Fetching Utilities

```tsx
// lib/data.ts
import products from '../mocks/products.json';
import categories from '../mocks/categories.json';
import orders from '../mocks/orders.json';

// Simulate network delay for realistic UX testing
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getProducts(categoryId?: string) {
  // Simulate API request delay
  await delay(800);
  
  if (categoryId) {
    return products.filter(product => product.categoryId === categoryId);
  }
  
  return products;
}

export async function getProductById(id: string) {
  // Simulate API request delay
  await delay(500);
  
  const product = products.find(p => p.id === id);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  return product;
}

export async function getCategories() {
  // Simulate API request delay
  await delay(600);
  
  return categories;
}

export async function getFeaturedProducts() {
  // Simulate API request delay
  await delay(800);
  
  // In a real backend, this would be products with featured=true
  // For mock data, we'll just return the first 4 products
  return products.slice(0, 4);
}

export async function getUserOrders(userId: string) {
  // Simulate API request delay
  await delay(700);
  
  return orders.filter(order => order.userId === userId);
}
```

### State Management

```tsx
// lib/context/cart-context.tsx
export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const localStorageCart = useLocalStorage('cart', cart);
  
  // Add item to cart
  const addItem = (product: Product, quantity: number, options: any) => {
    // Implementation
  };
  
  // Remove item from cart
  const removeItem = (id: string) => {
    // Implementation
  };
  
  // Calculate totals
  const getTotals = () => {
    // Implementation
  };
  
  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, getTotals }}>
      {children}
    </CartContext.Provider>
  );
}
```

### Mock Authentication

```tsx
// lib/context/auth-context.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate login
  const login = async (email: string, password: string) => {
    // In frontend-only mode, we validate against mock data
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUsers = await import('../../mocks/users.json');
    const user = mockUsers.find(u => u.email === email);
    
    if (user && user.password === password) {
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    
    setIsLoading(false);
    return false;
  };
  
  // Simulate logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Future Backend Integration Points

The following components and pages are designed with future API integration in mind:

1. **Product Listings**: Will fetch from `/api/products` endpoint
2. **User Authentication**: Will integrate with `/api/auth/*` endpoints
3. **Cart Management**: Will sync with backend via `/api/cart` endpoints
4. **Checkout Process**: Will process orders via `/api/checkout`
5. **Order History**: Will fetch from `/api/orders` endpoint

Each component that uses mock data is structured to make the transition to real API calls seamless by:
- Using the same data structures expected from the backend
- Implementing loading states already
- Handling error scenarios
- Using async/await patterns that match real API request flows 