import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for Lovable UI class merging — no styles defined here. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
