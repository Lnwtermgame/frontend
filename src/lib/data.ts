import products from '../mocks/products.json';
import categories from '../mocks/categories.json';
import orders from '../mocks/orders.json';
import users from '../mocks/users.json';

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

export async function getCategoryBySlug(slug: string) {
  // Simulate API request delay
  await delay(300);
  
  const category = categories.find(c => c.slug === slug);
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  return category;
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

export async function getOrderById(id: string) {
  // Simulate API request delay
  await delay(400);
  
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  return order;
}

export async function getUserByEmail(email: string) {
  // Simulate API request delay
  await delay(500);
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}

export async function validateUser(email: string, password: string) {
  // Simulate API request delay
  await delay(800);
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return null;
  }
  
  // Don't return password in response
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
} 