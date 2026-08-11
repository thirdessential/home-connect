/**
 * Order Management API Integration Utility
 * Handles all order update, cancellation, and admin operations
 */

import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

// Order API endpoints
export const orderAPI = {
  /**
   * Update existing wholesale order quantity
   * @param dealId - The wholesale deal ID
   * @param orderId - The order ID to update
   * @param newQuantity - New quantity (can be 0 to cancel)
   * @returns Updated order data
   */
  async updateOrderQuantity(
    dealId: string,
    orderId: string,
    newQuantity: number
  ) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/orders/wholesale/${dealId}/${orderId}/quantity`,
        { newQuantity },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating order quantity:", error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Cancel a wholesale order (set quantity to 0 and status to cancelled)
   * @param dealId - The wholesale deal ID
   * @param orderId - The order ID to cancel
   * @returns Cancellation confirmation
   */
  async cancelOrder(dealId: string, orderId: string) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/orders/wholesale/${dealId}/${orderId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error cancelling order:", error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Update order status (approve, reject, etc.)
   * @param dealId - The wholesale deal ID
   * @param orderId - The order ID
   * @param status - New status (approved, rejected, cancelled, etc.)
   * @param rejectionReason - Reason for rejection (optional)
   * @param rejectionDetails - Additional rejection details (optional)
   * @returns Updated order with new status
   */
  async updateOrderStatus(
    dealId: string,
    orderId: string,
    status: "approved" | "rejected" | "cancelled" | "delivered" | "pending",
    rejectionReason?: string,
    rejectionDetails?: string
  ) {
    try {
      const payload: any = { status };
      if (rejectionReason) payload.rejectionReason = rejectionReason;
      if (rejectionDetails) payload.rejectionDetails = rejectionDetails;

      const response = await axios.patch(
        `${API_BASE_URL}/api/orders/wholesale/${dealId}/${orderId}/status`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating order status:", error.response?.data);
      throw error.response?.data || error;
    }
  },
};

// Deal API endpoints
export const dealAPI = {
  /**
   * Cancel a wholesale deal (only by creator)
   * @param dealId - The deal ID to cancel
   * @param userId - The user ID (creator) cancelling the deal
   * @returns Cancellation confirmation with new deal status
   */
  async cancelDeal(dealId: string, userId: string) {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/wholesale-deal/${dealId}/cancel`,
        { userId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error cancelling deal:", error.response?.data);
      throw error.response?.data || error;
    }
  },
};

// Helper function to handle order quantity update with success/error handling
export async function updateOrderWithValidation(
  dealId: string,
  orderId: string,
  newQuantity: number,
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  try {
    const result = await orderAPI.updateOrderQuantity(
      dealId,
      orderId,
      newQuantity
    );
    onSuccess?.(result);
    return result;
  } catch (error: any) {
    const errorMessage =
      error?.message ||
      error?.data?.message ||
      "Failed to update order quantity";
    onError?.({ message: errorMessage, error });
    throw error;
  }
}

// Helper function to handle order cancellation with confirmation
export async function cancelOrderWithConfirmation(
  dealId: string,
  orderId: string,
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  try {
    const result = await orderAPI.cancelOrder(dealId, orderId);
    onSuccess?.(result);
    return result;
  } catch (error: any) {
    const errorMessage =
      error?.message || error?.data?.message || "Failed to cancel order";
    onError?.({ message: errorMessage, error });
    throw error;
  }
}

// Helper function to handle order status updates (approve/reject)
export async function updateOrderStatusWithValidation(
  dealId: string,
  orderId: string,
  status: "approved" | "rejected" | "cancelled" | "delivered" | "pending",
  rejectionReason?: string,
  rejectionDetails?: string,
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  try {
    const result = await orderAPI.updateOrderStatus(
      dealId,
      orderId,
      status,
      rejectionReason,
      rejectionDetails
    );
    onSuccess?.(result);
    return result;
  } catch (error: any) {
    const errorMessage =
      error?.message ||
      error?.data?.message ||
      `Failed to ${status} order`;
    onError?.({ message: errorMessage, error });
    throw error;
  }
}
