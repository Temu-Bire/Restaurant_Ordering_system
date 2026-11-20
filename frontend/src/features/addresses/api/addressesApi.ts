import { api } from "../../../lib/apiClient";
import type { CreateAddressInput, DeliveryAddress } from "../types";

export async function listAddresses(): Promise<DeliveryAddress[]> {
  return api.get<DeliveryAddress[]>("/addresses");
}

export async function createAddress(data: CreateAddressInput): Promise<DeliveryAddress> {
  return api.post<DeliveryAddress>("/addresses", data);
}

export async function updateAddress(
  id: string,
  data: Partial<CreateAddressInput>
): Promise<DeliveryAddress> {
  return api.patch<DeliveryAddress>(`/addresses/${id}`, data);
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/addresses/${id}`);
}

export async function setDefaultAddress(id: string): Promise<DeliveryAddress> {
  return api.patch<DeliveryAddress>(`/addresses/${id}/default`, {});
}
