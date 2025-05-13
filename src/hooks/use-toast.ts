
// Create a new hook to wrap the toast functionality
import { toast as sonnerToast } from "sonner";

// Extend with your custom toast hook functionality
export const useToast = () => {
  return {
    toast: sonnerToast
  };
};

// Re-export toast function for direct use
export const toast = sonnerToast;
