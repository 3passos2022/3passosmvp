
import { toast as sonnerToast } from "sonner";

// Import ExternalToast from sonner directly
import type { ExternalToast } from "sonner";

// Define our custom Toast type that extends ExternalToast
export interface Toast extends ExternalToast {
  variant?: "default" | "destructive" | "success";
  duration?: number;
  description?: React.ReactNode;
}

// Export ToastProps as our custom Toast interface
export type ToastProps = Toast;

// Define a custom useToast hook that extends sonner's functionality
export function useToast() {
  return {
    toast: ({ variant, description, ...props }: ToastProps) => {
      // Map our variant to sonner's style
      if (variant === "destructive") {
        return sonnerToast.error(props.title, {
          description,
          ...props,
        });
      } else if (variant === "success") {
        return sonnerToast.success(props.title, {
          description,
          ...props,
        });
      } else {
        return sonnerToast(props.title, {
          description,
          ...props,
        });
      }
    },
    dismiss: sonnerToast.dismiss,
    success: (title: string, props?: Omit<ToastProps, "title" | "variant">) => 
      sonnerToast.success(title, props),
    error: (title: string, props?: Omit<ToastProps, "title" | "variant">) => 
      sonnerToast.error(title, props),
    warning: (title: string, props?: Omit<ToastProps, "title" | "variant">) => 
      sonnerToast(title, { ...props, style: { backgroundColor: "var(--warning)" } }),
    info: (title: string, props?: Omit<ToastProps, "title" | "variant">) => 
      sonnerToast.info(title, props),
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
