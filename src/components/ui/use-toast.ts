
// Re-export from our simplified implementation
import { useToast, toast, type Toast } from "@/hooks/use-toast";

export { useToast, toast, type Toast };

// No longer using ToastProps, simplified API
export type ToastProps = Toast & {
  id?: string;
};
