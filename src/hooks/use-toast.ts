
// Simple re-export of sonner toast for our application
import { toast } from "sonner";

// Re-export sonner toast with our application's defaults
export { toast };

// Simplified hook that returns the toast function
export function useToast() {
  return {
    toast
  };
}

// Export Toast type for TypeScript support
export type Toast = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
};
