// apps/api/src/common/utils/time.utils.ts

/**
 * Utility to handle dates with a fixed Brazilian (Brasília) offset (-03:00).
 * This prevents "ghost" shifts where dates are interpreted as UTC 00:00:00 
 * (which is 21:00 of the previous day in Brazil).
 */
export class TimeUtils {
  /**
   * Returns a Date object representing the start of the day (00:00:00) 
   * in America/Sao_Paulo (-03:00) for a given date string (YYYY-MM-DD).
   */
  static getStartOfDayBR(dateStr: string): Date {
    // Format: YYYY-MM-DDT00:00:00-03:00
    // This explicitly tells the parser that this is midnight in Brazil.
    return new Date(`${dateStr}T00:00:00-03:00`);
  }

  /**
   * Returns a Date object representing the end of the day (23:59:59.999) 
   * in America/Sao_Paulo (-03:00) for a given date string (YYYY-MM-DD).
   */
  static getEndOfDayBR(dateStr: string): Date {
    // Format: YYYY-MM-DDT23:59:59.999-03:00
    return new Date(`${dateStr}T23:59:59.999-03:00`);
  }

  /**
   * Converts a generic date string to a Date object assuming it refers to Brasília time,
   * but without forcing a specific time of day (useful for parsing timestamps if needed).
   */
  static fromBR(dateStr: string): Date {
    if (dateStr.includes('T')) {
      // If it already has time, ensure it has the offset if missing
      if (!/([+-]\d{2}:\d{2}|Z)$/.test(dateStr)) {
        return new Date(`${dateStr}-03:00`);
      }
      return new Date(dateStr);
    }
    return this.getStartOfDayBR(dateStr);
  }
}
