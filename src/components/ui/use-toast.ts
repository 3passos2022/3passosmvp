
import { useToast as useToastHook } from "@/hooks/use-toast";

// Re-export the toast hook to be used throughout the app
export const useToast = useToastHook;
export { toast } from "@/hooks/use-toast";
export type { Toast, ToastProps } from "@/hooks/use-toast";
