
import { toast as sonnerToast, type ExternalToast } from "sonner";
import React from "react";

// Define a custom toast type that includes title and description
export interface ToastProps extends ExternalToast {
  title?: React.ReactNode;
  description?: React.ReactNode;
}

// Our custom toast function that translates between our props and sonner props
const customToast = (props: ToastProps) => {
  if (typeof props === 'string' || React.isValidElement(props)) {
    return sonnerToast(props);
  }

  const { title, description, ...restProps } = props;
  
  // If we have both title and description, use them together
  if (title && description) {
    return sonnerToast(
      <div>
        {typeof title === 'string' ? <p className="font-medium">{title}</p> : title}
        {typeof description === 'string' ? <p className="text-sm opacity-90">{description}</p> : description}
      </div>,
      restProps
    );
  }
  
  // If we just have title, use that
  if (title) {
    return sonnerToast(title, restProps);
  }
  
  // If we just have description, use that
  if (description) {
    return sonnerToast(description, restProps);
  }
  
  // Fallback to regular toast behavior
  return sonnerToast("", restProps);
};

// Add all the methods from sonner toast to our custom toast
type SonnerToastType = typeof sonnerToast;
interface CustomToastType extends SonnerToastType {
  (props: ToastProps): ReturnType<SonnerToastType>;
}

// Create our enhanced toast function with all sonner methods
const enhancedToast = customToast as unknown as CustomToastType;

// Copy all the methods from sonnerToast to our enhancedToast
Object.keys(sonnerToast).forEach((key) => {
  const methodKey = key as keyof typeof sonnerToast;
  if (typeof sonnerToast[methodKey] === 'function') {
    (enhancedToast as any)[methodKey] = sonnerToast[methodKey];
  }
});

// Create a custom hook to use the toast
export const useToast = () => {
  return {
    toast: enhancedToast
  };
};

// Export our toast instance for direct use
export const toast = enhancedToast;

// Export a type for toast data for components that use the toaster
export type Toast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};
