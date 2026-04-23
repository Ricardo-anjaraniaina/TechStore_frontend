import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stockQuantity: number;
  categoryName: string;
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId: number;
}

interface BackendCartItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface BackendCartResponse {
  userId: number;
  items: BackendCartItem[];
  totalItems: number;
  totalPrice: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function mapBackendItem(item: BackendCartItem): CartItem {
  return {
    cartItemId: item.id,
    id: item.productId,
    name: item.productName,
    description: '',
    price: item.price,
    imageUrl: item.productImage,
    stockQuantity: 0,
    categoryName: '',
    quantity: item.quantity,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const data = await api.get<BackendCartResponse>('/cart');
      setCart((data.items ?? []).map(mapBackendItem));
    } catch {
      // not authenticated or empty cart
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) fetchCart();
  }, []);

  const addToCart = async (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      await updateQuantity(product.id, existing.quantity + 1);
    } else {
      await api.post('/cart/items', { productId: product.id, quantity: 1 });
      await fetchCart();
    }
  };

  const removeFromCart = async (productId: number) => {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;
    await api.delete(`/cart/items/${item.cartItemId}`);
    setCart((prev) => prev.filter((i) => i.id !== productId));
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) { await removeFromCart(productId); return; }
    const item = cart.find((i) => i.id === productId);
    if (!item) return;
    await api.put(`/cart/items/${item.cartItemId}?quantity=${quantity}`, {});
    setCart((prev) => prev.map((i) => i.id === productId ? { ...i, quantity } : i));
  };

  const clearCart = () => { setCart([]); };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, refreshCart: fetchCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
