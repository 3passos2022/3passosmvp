
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
