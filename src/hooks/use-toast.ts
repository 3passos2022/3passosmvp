
import { toast as sonnerToast } from "sonner";
import type { ToastT } from "sonner";

// Define our custom Toast type that includes our variants
export interface Toast {
  id?: string | number;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

// Export ToastProps as our custom Toast interface
export type ToastProps = Toast;

// Define a custom useToast hook that extends sonner's functionality
export function useToast() {
  return {
    toast: (props: ToastProps) => {
      // Extract properties
      const { variant, title, description, ...rest } = props;
      
      // Map our variant to sonner's style
      if (variant === "destructive") {
        return sonnerToast.error(title, {
          description,
          ...rest,
        });
      } else if (variant === "success") {
        return sonnerToast.success(title, {
          description,
          ...rest,
        });
      } else {
        return sonnerToast(title, {
          description,
          ...rest,
        });
      }
    },
    dismiss: sonnerToast.dismiss,
  };
}

// Re-export toast for convenience
export const toast = {
  ...sonnerToast,
  // Add our custom methods that handle variants
  default: (title: string, props?: Omit<ToastProps, "title">) => 
    sonnerToast(title, props),
  success: (title: string, props?: Omit<ToastProps, "title">) => 
    sonnerToast.success(title, props),
  destructive: (title: string, props?: Omit<ToastProps, "title">) => 
    sonnerToast.error(title, props),
  error: (title: string, props?: Omit<ToastProps, "title">) => 
    sonnerToast.error(title, props),
  warning: (title: string, props?: Omit<ToastProps, "title">) => 
    sonnerToast(title, { ...props, style: { backgroundColor: "var(--warning)" } }),
  info: (title: string, props?: Omit<ToastProps, "title">) => 
    sonnerToast.info(title, props),
};
