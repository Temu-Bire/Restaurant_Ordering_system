import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CartProvider, CartContext } from './CartContext';
import type { FoodItem } from '../../menu/types';

const mockFoodAvailable: FoodItem = {
  id: 'food-1',
  name: 'Shiro Tegamino',
  price: 250,
  category: 'Traditional',
  available: true,
  description: 'Classic Ethiopian chickpea stew',
};

const mockFoodUnavailable: FoodItem = {
  id: 'food-2',
  name: 'Special Tibs',
  price: 450,
  category: 'Meat Dishes',
  available: false,
  description: 'Sautéed beef with onions and peppers',
};

describe('CartContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  const useTestCart = () => {
    const context = React.useContext(CartContext);
    if (!context) throw new Error('Outside CartProvider');
    return context;
  };

  it('starts with empty cart', () => {
    const { result } = renderHook(() => useTestCart(), { wrapper });
    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });

  it('allows adding an available food item', () => {
    const { result } = renderHook(() => useTestCart(), { wrapper });

    act(() => {
      const added = result.current.addItem(mockFoodAvailable);
      expect(added).toBe(true);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].id).toBe('food-1');
    expect(result.current.subtotal).toBe(250);
  });

  it('rejects adding an unavailable food item', () => {
    const { result } = renderHook(() => useTestCart(), { wrapper });

    act(() => {
      const added = result.current.addItem(mockFoodUnavailable);
      expect(added).toBe(false);
    });

    expect(result.current.count).toBe(0);
    expect(result.current.items).toEqual([]);
  });

  it('increments item quantity when added repeatedly', () => {
    const { result } = renderHook(() => useTestCart(), { wrapper });

    act(() => {
      result.current.addItem(mockFoodAvailable);
      result.current.addItem(mockFoodAvailable);
    });

    expect(result.current.count).toBe(2);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.subtotal).toBe(500);
  });

  it('decreases quantity and removes item when count reaches 0', () => {
    const { result } = renderHook(() => useTestCart(), { wrapper });

    act(() => {
      result.current.addItem(mockFoodAvailable);
    });
    expect(result.current.count).toBe(1);

    act(() => {
      result.current.decrease('food-1');
    });
    expect(result.current.count).toBe(0);
    expect(result.current.items).toEqual([]);
  });

  it('clears all items on clear()', () => {
    const { result } = renderHook(() => useTestCart(), { wrapper });

    act(() => {
      result.current.addItem(mockFoodAvailable);
      result.current.clear();
    });

    expect(result.current.count).toBe(0);
    expect(result.current.items).toEqual([]);
  });
});
