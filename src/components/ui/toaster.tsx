
import { Toast, Toaster as ToasterProvider } from "sonner";

export function Toaster() {
  return (
    <ToasterProvider
      position="top-right"
      richColors
      expand={false}
      duration={4000}
    />
  );
}
