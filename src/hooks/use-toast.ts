
import { toast as sonnerToast, type Toast as SonnerToast, type ToastOptions } from "sonner";

export interface ToastProps extends ToastOptions {
  title?: string;
  description?: string;
}

export type Toast = ToastProps & {
  id: string;
};

// Simple toast function that avoids JSX syntax in TypeScript
function createToast(props: ToastProps | string) {
  if (typeof props === 'string') {
    return sonnerToast(props);
  }
  
  const { title, description, ...options } = props;
  
  // Use sonner's built-in title/description pattern instead of JSX
  return sonnerToast(title || '', {
    description,
    ...options
  });
}

// Add required methods to our toast function
const toast = Object.assign(createToast, {
  success: (props: ToastProps | string) => {
    if (typeof props === 'string') {
      return sonnerToast.success(props);
    }
    const { title, description, ...options } = props;
    return sonnerToast.success(title || '', { description, ...options });
  },
  error: (props: ToastProps | string) => {
    if (typeof props === 'string') {
      return sonnerToast.error(props);
    }
    const { title, description, ...options } = props;
    return sonnerToast.error(title || '', { description, ...options });
  },
  info: (props: ToastProps | string) => {
    if (typeof props === 'string') {
      return sonnerToast.info(props);
    }
    const { title, description, ...options } = props;
    return sonnerToast.info(title || '', { description, ...options });
  },
  warning: (props: ToastProps | string) => {
    if (typeof props === 'string') {
      return sonnerToast.warning(props);
    }
    const { title, description, ...options } = props;
    return sonnerToast.warning(title || '', { description, ...options });
  },
  // Copy other methods from sonnerToast
  promise: sonnerToast.promise,
  loading: sonnerToast.loading,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
  message: sonnerToast.message,
});

export const useToast = () => {
  return {
    toast
  };
};

export { toast };
