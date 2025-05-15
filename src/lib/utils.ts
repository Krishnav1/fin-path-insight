import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 * @param value - Number to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | null | undefined, currency = 'USD'): string {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a large number with abbreviations (K, M, B, T)
 * @param value - Number to format
 * @returns Formatted string with abbreviation
 */
export function formatLargeNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000_000).toFixed(2)}T`;
  } else if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(2)}B`;
  } else if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(2)}M`;
  } else if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(2)}K`;
  } else {
    return `${sign}${absValue.toFixed(2)}`;
  }
}

/**
 * Format a number as a percentage
 * @param value - Decimal value to format (e.g., 0.25 for 25%)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100); // Convert from percentage to decimal
}

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string
 * @param format - Format style ('short', 'medium', 'long')
 * @returns Formatted date string
 */
export function formatDate(dateString: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    let options: Intl.DateTimeFormatOptions;
    
    switch (format) {
      case 'short':
        options = { month: 'short', day: 'numeric', year: 'numeric' };
        break;
      case 'long':
        options = { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        break;
      case 'medium':
      default:
        options = { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error';
  }
}
