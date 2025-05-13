
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      position="bottom-right" 
      toastOptions={{
        classNames: {
          title: "text-foreground font-medium text-sm",
          description: "text-muted-foreground text-sm",
          error: "bg-destructive text-destructive-foreground border-destructive",
          success: "bg-green-50 text-green-800 border-green-200",
        }
      }}
    />
  );
}
