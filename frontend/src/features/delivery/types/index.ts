export interface DeliveryConfig {
  deliveryEnabled: boolean;
  restaurantAddress: string;
  restaurantLat: number;
  restaurantLng: number;
  maxDeliveryDistanceKm: number;
  minDeliveryOrderAmount: number;
}

export interface DeliveryTier {
  id: string;
  minDistance: number;
  maxDistance: number;
  fee: number;
}

export interface DeliveryQuoteRequest {
  latitude: number;
  longitude: number;
  subtotal?: number;
}

export interface DeliveryQuote {
  eligible: boolean;
  distanceKm: number;
  fee: number;
  minOrderMet: boolean;
  minOrderAmount: number;
  maxDistanceKm: number;
  message?: string;
}
