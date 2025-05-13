
import { toast as sonnerToast } from "sonner";

// Define ToastProps to include all the properties being used in the project
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

// Define the Toast type
export type Toast = ToastProps & {
  id: string;
};

// Simple toast function that avoids JSX syntax in TypeScript
function createToast(props: ToastProps | string) {
  if (typeof props === 'string') {
    return sonnerToast(props);
  }
  
  const { title, description, variant, duration, ...options } = props;
  
  // Map our variant to sonner's type
  let type: "success" | "error" | "info" | "warning" | undefined = undefined;
  if (variant === "destructive") {
    type = "error";
  }
  
  // Use sonner's built-in title/description pattern
  return sonnerToast(title || '', {
    description,
    duration,
    type,
    ...options
  });
}

// Add required methods to our toast function
const toast = Object.assign(createToast, {
  success: (props: ToastProps | string) => {
    if (typeof props === 'string') {
      return sonnerToast.success(props);
    }
    const { title, description, duration, ...options } = props;
    return sonnerToast.success(title || '', { description, duration, ...options });
  },
  error: (props: ToastProps | string) => {
    if (typeof props === 'string') {
      return sonnerToast.error(props);
    }
    const { title, description, duration, ...options } = props;
    return sonnerToast.error(title || '', { description, duration, ...options });
  },
  info: (props: ToastProps | string) => {
    if (typeof props === 'string') {
      return sonnerToast.info(props);
    }
    const { title, description, duration, ...options } = props;
    return sonnerToast.info(title || '', { description, duration, ...options });
  },
  warning: (props: ToastProps | string) => {
    if (typeof props === 'string') {
      return sonnerToast.warning(props);
    }
    const { title, description, duration, ...options } = props;
    return sonnerToast.warning(title || '', { description, duration, ...options });
  },
  // Copy other methods from sonnerToast
  promise: sonnerToast.promise,
  loading: sonnerToast.loading,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
  message: sonnerToast.message,
});

// Export hook to match shadcn's API
export const useToast = () => {
  return {
    toast
  };
};

export { toast };
