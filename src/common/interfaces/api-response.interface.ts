/**
 * Standard API response interface for consistent structure across all endpoints
 * Ensures proper frontend integration with a consistent response format
 */
export interface ApiResponse<T = any> {
  /**
   * Response data when operation is successful
   */
  data?: T;
  
  /**
   * Error message when operation fails
   */
  error?: string;
}
