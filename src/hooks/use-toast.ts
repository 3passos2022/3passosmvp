
import { toast as sonnerToast } from 'sonner';

// Define the ToastProps type based on sonner's interface
export interface ToastProps {
  title?: string;
  description?: string | React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
  action?: React.ReactNode;
  // Add any other properties that might be needed
}

// Define the Toast type
export type Toast = {
  id: string;
  title?: string;
  description?: string | React.ReactNode;
  // Additional properties as needed
};

// Create a wrapper function that normalizes our API with sonner
export function toast(props: ToastProps): void;
export function toast(title: string, props?: Omit<ToastProps, 'title'>): void;
export function toast(titleOrProps: string | ToastProps, props?: Omit<ToastProps, 'title'>): void {
  if (typeof titleOrProps === 'string') {
    const title = titleOrProps;
    const options = props || {};
    if (options.variant === 'destructive') {
      sonnerToast.error(title, options);
    } else {
      sonnerToast(title, options);
    }
    return;
  }
  
  const { title, description, variant, ...options } = titleOrProps;
  
  // Handle variants
  if (variant === "destructive") {
    sonnerToast.error(title || '', {
      description,
      ...options
    });
    return;
  }
  
  // Default toast
  sonnerToast(title || '', {
    description,
    ...options
  });
}

// Add success, error, and other methods
toast.success = (title: string, props?: Omit<ToastProps, 'title'>) => {
  sonnerToast.success(title, props);
};

toast.error = (title: string, props?: Omit<ToastProps, 'title'>) => {
  sonnerToast.error(title, props);
};

toast.info = (title: string, props?: Omit<ToastProps, 'title'>) => {
  sonnerToast.info(title, props);
};

toast.warning = (title: string, props?: Omit<ToastProps, 'title'>) => {
  sonnerToast.warning(title, props);
};

export const useToast = () => {
  return {
    toast
  };
};
