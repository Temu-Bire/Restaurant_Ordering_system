import { api } from "../../../lib/apiClient";
import type { DeliveryConfig, DeliveryQuote, DeliveryQuoteRequest, DeliveryTier } from "../types";

export async function getDeliveryConfig(): Promise<DeliveryConfig> {
  return api.get<DeliveryConfig>("/delivery/config");
}

export async function updateDeliveryConfig(
  data: Partial<DeliveryConfig>
): Promise<DeliveryConfig> {
  return api.patch<DeliveryConfig>("/delivery/config", data);
}

export async function getDeliveryTiers(): Promise<DeliveryTier[]> {
  return api.get<DeliveryTier[]>("/delivery/tiers");
}

export async function createDeliveryTier(data: {
  minDistance: number;
  maxDistance: number;
  fee: number;
}): Promise<DeliveryTier> {
  return api.post<DeliveryTier>("/delivery/tiers", data);
}

export async function updateDeliveryTier(
  id: string,
  data: Partial<{ minDistance: number; maxDistance: number; fee: number }>
): Promise<DeliveryTier> {
  return api.patch<DeliveryTier>(`/delivery/tiers/${id}`, data);
}

export async function deleteDeliveryTier(id: string): Promise<void> {
  await api.delete(`/delivery/tiers/${id}`);
}

export async function getDeliveryQuote(
  req: DeliveryQuoteRequest
): Promise<DeliveryQuote> {
  return api.post<DeliveryQuote>("/delivery/quote", req);
}
