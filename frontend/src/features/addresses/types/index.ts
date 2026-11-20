export type AddressLabel = "home" | "work" | "other";

export interface DeliveryAddress {
  id: string;
  label: AddressLabel;
  recipientName: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  landmark?: string;
  building?: string;
  apartment?: string;
  deliveryInstructions?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface CreateAddressInput {
  label?: AddressLabel;
  recipientName: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  landmark?: string;
  building?: string;
  apartment?: string;
  deliveryInstructions?: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}
