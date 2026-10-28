import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number | string;
  name: string;
  price?: string;
  numericPrice: number;
  quantity: number;
  image?: string;
  category?: string;
  description?: string;
  portion?: string;
  flavor?: string;
  catalogModel?: string;
  isCake?: boolean;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: {
    id: number | string;
    name: string;
    price?: string;
    numericPrice: number;
    image?: string;
    category?: string;
    description?: string;
    portion?: string;
    flavor?: string;
    catalogModel?: string;
    isCake?: boolean;
  }, quantity?: number) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'le_ci_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Erreur sauvegarde panier', e);
    }
  }, [items]);

  const addToCart = (product: {
    id: number | string;
    name: string;
    price?: string;
    numericPrice: number;
    image?: string;
    category?: string;
    description?: string;
    portion?: string;
    flavor?: string;
    catalogModel?: string;
    isCake?: boolean;
  }, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => String(item.id) === String(product.id));
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price || `${product.numericPrice.toLocaleString('fr-FR')} FCFA`,
          numericPrice: product.numericPrice,
          quantity,
          image: product.image,
          category: product.category,
          description: product.description,
          portion: product.portion,
          flavor: product.flavor,
          catalogModel: product.catalogModel,
          isCake: product.isCake
        }
      ];
    });
  };

  const removeFromCart = (id: number | string) => {
    setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const updateQuantity = (id: number | string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (String(item.id) === String(id)) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.numericPrice * item.quantity), 0);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        isOpen,
        openCart,
        closeCart,
        toggleCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
