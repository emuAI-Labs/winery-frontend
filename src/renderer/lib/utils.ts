import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// eslint-disable-next-line import/prefer-default-export -- shadcn/ui convention: `cn` is always a named export
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
