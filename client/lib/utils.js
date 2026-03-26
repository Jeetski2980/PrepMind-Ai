import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// combines class names and resolves Tailwind conflicts into one final string
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
