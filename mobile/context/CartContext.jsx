import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = 'techline_cart';

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case 'RESTORE':
      return action.payload;

    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload;
      const existing = state.find(i => i.productId === product._id);
      if (existing) {
        return state.map(i =>
          i.productId === product._id
            ? { ...i, quantity: i.quantity + quantity, subtotal: (i.quantity + quantity) * i.unitPrice }
            : i
        );
      }
      return [
        ...state,
        {
          productId:   product._id,
          productCode: product.code,
          productName: product.name,
          category:    product.category  || '',
          warrantyMonths: (product.warrantyPeriod || 0) * 12,
          unitPrice:   product.unitPrice,
          quantity,
          subtotal:    product.unitPrice * quantity,
        },
      ];
    }

    case 'REMOVE_ITEM':
      return state.filter(i => i.productId !== action.payload);

    case 'UPDATE_QTY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) return state.filter(i => i.productId !== productId);
      return state.map(i =>
        i.productId === productId
          ? { ...i, quantity, subtotal: i.unitPrice * quantity }
          : i
      );
    }

    case 'CLEAR':
      return [];

    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [items, dispatch] = useReducer(cartReducer, []);

  // Restore cart from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then(raw => {
      if (raw) {
        try { dispatch({ type: 'RESTORE', payload: JSON.parse(raw) }); } catch {}
      }
    });
  }, []);

  // Persist cart whenever items change
  useEffect(() => {
    AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  // ── Computed values ────────────────────────────────────────────────────────
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const grandTotal = items.reduce((sum, i) => sum + i.subtotal, 0);

  // ── Actions ────────────────────────────────────────────────────────────────
  const addToCart    = (product, qty = 1) => dispatch({ type: 'ADD_ITEM',    payload: { product, quantity: qty } });
  const removeFromCart = (productId)      => dispatch({ type: 'REMOVE_ITEM', payload: productId });
  const updateQty    = (productId, qty)   => dispatch({ type: 'UPDATE_QTY',  payload: { productId, quantity: qty } });
  const clearCart    = ()                 => dispatch({ type: 'CLEAR' });

  return (
    <CartContext.Provider value={{ items, totalItems, grandTotal, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

export default CartContext;
