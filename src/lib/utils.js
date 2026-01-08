import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')                // Elimina acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .replace(/\s+/g, '-')            // Cambia espacios por guiones
    .replace(/[^\w-]+/g, '')         // Elimina caracteres no deseados
    .replace(/--+/g, '-')            // Elimina guiones dobles
    .replace(/^-+/, '')              // Elimina guiones al inicio
    .replace(/-+$/, '');             // Elimina guiones al final
};
