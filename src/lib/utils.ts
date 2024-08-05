import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function sluggify(str: string) {
    str = str.toLowerCase();

    // Replace special characters with spaces
    str = str.replace(/[^a-z0-9\s-]/g, "");

    // Replace multiple spaces or hyphens with a single hyphen
    str = str.replace(/[\s-]+/g, "-");

    // Trim hyphens from the start and end of the string
    str = str.replace(/^-+|-+$/g, "");

    return str;
}
