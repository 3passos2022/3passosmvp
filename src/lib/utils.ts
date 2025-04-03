import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseCurrencyInput(value: string): number {
  // Remove currency symbols, spaces and replace comma with dot
  const sanitized = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const number = parseFloat(sanitized);
  return isNaN(number) ? 0 : number;
}

// Format date to a readable string
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Add Google Maps types to fix TypeScript errors
declare global {
  interface Window {
    google: {
      maps: {
        Geocoder: new () => {
          geocode: (
            request: { address: string },
            callback: (
              results: Array<{
                geometry: {
                  location: {
                    lat: () => number;
                    lng: () => number;
                  };
                };
                formatted_address?: string;
              }>,
              status: string
            ) => void
          ) => void;
        };
        LatLng: new (lat: number, lng: number) => {
          lat: () => number;
          lng: () => number;
        };
        geometry: {
          spherical: {
            computeDistanceBetween: (from: any, to: any) => number;
          };
        };
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: { types?: string[] }
          ) => {
            addListener: (
              event: string,
              callback: () => void
            ) => void;
            getPlace: () => {
              geometry?: {
                location: {
                  lat: () => number;
                  lng: () => number;
                };
              };
              formatted_address: string;
            };
          };
        };
      };
    };
  }
}
