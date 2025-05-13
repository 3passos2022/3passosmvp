
import { Toaster as SonnerToaster } from "sonner";
import { Toaster as ShadcnToaster } from "@/hooks/use-toast";

// Export both toasters for flexibility
export function Toaster() {
  return (
    <>
      <SonnerToaster
        position="top-right"
        richColors
        expand={false}
        duration={4000}
      />
      <ShadcnToaster />
    </>
  );
}
