
import { useToast as useToastHook, toast } from "@/hooks/use-toast";

// Re-export the toast hook and function to be used throughout the app
export const useToast = useToastHook;
export { toast };
