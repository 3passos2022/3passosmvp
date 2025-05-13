
import { Toaster as SonnerToaster } from "sonner";

// Export just the Sonner toaster for simplicity
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      expand={false}
      duration={4000}
    />
  );
}
