/**
 * ═══════════════════════════════════════════════════════════════
 * DateHelper - Date & Time Utilities
 * ═══════════════════════════════════════════════════════════════
 *
 * Uses dayjs (lightweight, immutable, modern replacement for moment.js).
 *
 * @module DateHelper
 */

const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const isBetween = require('dayjs/plugin/isBetween');

dayjs.extend(relativeTime);
dayjs.extend(isBetween);

/**
 * Static utility class providing date and time manipulation methods.
 * All methods are static — do not instantiate this class.
 * Powered by dayjs with relativeTime and isBetween plugins.
 *
 * @class DateHelper
 * @description Provides a comprehensive set of static helpers for formatting,
 * comparing, and manipulating dates and times. Accepts date strings, Date objects,
 * or Unix timestamps anywhere a date parameter is expected.
 *
 * @example
 * const { DateHelper } = require('./helpers/DateHelper');
 *
 * // Get current date/time
 * DateHelper.now();            // '2026-02-28 14:30:00'
 * DateHelper.today();          // '2026-02-28'
 *
 * // Date arithmetic
 * DateHelper.addDays(7);       // '2026-03-07'
 * DateHelper.subtractDays(30); // '2026-01-29'
 *
 * // Comparison & difference
 * DateHelper.diffInDays('2026-12-31', '2026-01-01'); // 364
 * DateHelper.isBefore('2026-01-01', '2026-06-01');   // true
 */
class DateHelper {
    /**
     * Returns the current date and time formatted according to the given format string.
     *
     * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - A dayjs-compatible format token string.
     * @returns {string} The current date/time as a formatted string.
     *
     * @example
     * DateHelper.now();                  // '2026-02-28 14:30:00'
     * DateHelper.now('YYYY/MM/DD');      // '2026/02/28'
     * DateHelper.now('hh:mm A');         // '02:30 PM'
     */
    static now(format = 'YYYY-MM-DD HH:mm:ss') {
        return dayjs().format(format);
    }

    /**
     * Returns today's date formatted according to the given format string.
     * Convenience wrapper around {@link DateHelper.now} with a date-only default format.
     *
     * @param {string} [format='YYYY-MM-DD'] - A dayjs-compatible format token string.
     * @returns {string} Today's date as a formatted string.
     *
     * @example
     * DateHelper.today();             // '2026-02-28'
     * DateHelper.today('MM/DD/YYYY'); // '02/28/2026'
     * DateHelper.today('DD-MMM-YY');  // '28-Feb-26'
     */
    static today(format = 'YYYY-MM-DD') {
        return dayjs().format(format);
    }

    /**
     * Returns the current Unix timestamp in milliseconds.
     *
     * @returns {number} Milliseconds elapsed since the Unix epoch (January 1, 1970 00:00:00 UTC).
     *
     * @example
     * const ts = DateHelper.timestamp(); // 1772246400000
     * console.log(typeof ts);            // 'number'
     */
    static timestamp() {
        return Date.now();
    }

    /**
     * Returns the current date and time as an ISO 8601 string.
     *
     * @returns {string} An ISO 8601 formatted UTC date/time string (e.g. '2026-02-28T14:30:00.000Z').
     *
     * @example
     * DateHelper.isoNow(); // '2026-02-28T14:30:00.000Z'
     */
    static isoNow() {
        return new Date().toISOString();
    }

    /**
     * Formats a given date value according to the specified format string.
     *
     * @param {string|Date|number} date - The date to format. Accepts a date string, Date object, or Unix timestamp.
     * @param {string} [format='YYYY-MM-DD'] - A dayjs-compatible format token string.
     * @returns {string} The formatted date string.
     *
     * @example
     * DateHelper.format('2026-02-28');                    // '2026-02-28'
     * DateHelper.format(new Date(), 'MMM DD, YYYY');      // 'Feb 28, 2026'
     * DateHelper.format('2026-12-25', 'DD/MM/YYYY');      // '25/12/2026'
     */
    static format(date, format = 'YYYY-MM-DD') {
        return dayjs(date).format(format);
    }

    /**
     * Adds the specified number of days to a date and returns the result as a formatted string.
     *
     * @param {number} days - The number of days to add.
     * @param {string|Date|number} [fromDate=new Date()] - The starting date. Defaults to the current date.
     * @param {string} [format='YYYY-MM-DD'] - A dayjs-compatible format token string for the output.
     * @returns {string} The resulting date as a formatted string.
     *
     * @example
     * DateHelper.addDays(5);                                  // '2026-03-05'
     * DateHelper.addDays(10, '2026-01-01');                   // '2026-01-11'
     * DateHelper.addDays(1, '2026-02-28', 'MM/DD/YYYY');     // '03/01/2026'
     */
    static addDays(days, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return dayjs(fromDate).add(days, 'day').format(format);
    }

    /**
     * Subtracts the specified number of days from a date and returns the result as a formatted string.
     *
     * @param {number} days - The number of days to subtract.
     * @param {string|Date|number} [fromDate=new Date()] - The starting date. Defaults to the current date.
     * @param {string} [format='YYYY-MM-DD'] - A dayjs-compatible format token string for the output.
     * @returns {string} The resulting date as a formatted string.
     *
     * @example
     * DateHelper.subtractDays(7);                              // '2026-02-21'
     * DateHelper.subtractDays(30, '2026-03-15');               // '2026-02-13'
     * DateHelper.subtractDays(1, '2026-03-01', 'DD-MMM-YYYY');// '28-Feb-2026'
     */
    static subtractDays(days, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return dayjs(fromDate).subtract(days, 'day').format(format);
    }

    /**
     * Adds the specified number of months to a date and returns the result as a formatted string.
     *
     * @param {number} months - The number of months to add.
     * @param {string|Date|number} [fromDate=new Date()] - The starting date. Defaults to the current date.
     * @param {string} [format='YYYY-MM-DD'] - A dayjs-compatible format token string for the output.
     * @returns {string} The resulting date as a formatted string.
     *
     * @example
     * DateHelper.addMonths(3);                             // '2026-05-28'
     * DateHelper.addMonths(1, '2026-01-31');               // '2026-02-28'
     * DateHelper.addMonths(6, '2026-06-15', 'YYYY/MM/DD');// '2026/12/15'
     */
    static addMonths(months, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return dayjs(fromDate).add(months, 'month').format(format);
    }

    /**
     * Adds the specified number of years to a date and returns the result as a formatted string.
     *
     * @param {number} years - The number of years to add.
     * @param {string|Date|number} [fromDate=new Date()] - The starting date. Defaults to the current date.
     * @param {string} [format='YYYY-MM-DD'] - A dayjs-compatible format token string for the output.
     * @returns {string} The resulting date as a formatted string.
     *
     * @example
     * DateHelper.addYears(1);                              // '2027-02-28'
     * DateHelper.addYears(5, '2026-06-15');                // '2031-06-15'
     * DateHelper.addYears(2, '2026-02-28', 'MM/DD/YYYY'); // '02/28/2028'
     */
    static addYears(years, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return dayjs(fromDate).add(years, 'year').format(format);
    }

    /**
     * Calculates the difference between two dates in whole days.
     * The result is positive when dateA is after dateB, and negative when dateA is before dateB.
     *
     * @param {string|Date|number} dateA - The first (later) date.
     * @param {string|Date|number} dateB - The second (earlier) date.
     * @returns {number} The difference in days (truncated, not rounded).
     *
     * @example
     * DateHelper.diffInDays('2026-12-31', '2026-01-01'); // 364
     * DateHelper.diffInDays('2026-01-01', '2026-12-31'); // -364
     * DateHelper.diffInDays('2026-03-01', '2026-02-28'); // 1
     */
    static diffInDays(dateA, dateB) {
        return dayjs(dateA).diff(dayjs(dateB), 'day');
    }

    /**
     * Calculates the difference between two dates in whole hours.
     * The result is positive when dateA is after dateB, and negative when dateA is before dateB.
     *
     * @param {string|Date|number} dateA - The first (later) date/time.
     * @param {string|Date|number} dateB - The second (earlier) date/time.
     * @returns {number} The difference in hours (truncated, not rounded).
     *
     * @example
     * DateHelper.diffInHours('2026-02-28T18:00:00', '2026-02-28T06:00:00'); // 12
     * DateHelper.diffInHours('2026-03-01', '2026-02-28');                   // 24
     */
    static diffInHours(dateA, dateB) {
        return dayjs(dateA).diff(dayjs(dateB), 'hour');
    }

    /**
     * Calculates the difference between two dates in whole minutes.
     * The result is positive when dateA is after dateB, and negative when dateA is before dateB.
     *
     * @param {string|Date|number} dateA - The first (later) date/time.
     * @param {string|Date|number} dateB - The second (earlier) date/time.
     * @returns {number} The difference in minutes (truncated, not rounded).
     *
     * @example
     * DateHelper.diffInMinutes('2026-02-28T10:30:00', '2026-02-28T10:00:00'); // 30
     * DateHelper.diffInMinutes('2026-02-28T12:00:00', '2026-02-28T11:45:00'); // 15
     */
    static diffInMinutes(dateA, dateB) {
        return dayjs(dateA).diff(dayjs(dateB), 'minute');
    }

    /**
     * Checks whether dateA is chronologically before dateB.
     *
     * @param {string|Date|number} dateA - The date to check.
     * @param {string|Date|number} dateB - The date to compare against.
     * @returns {boolean} `true` if dateA is before dateB, `false` otherwise.
     *
     * @example
     * DateHelper.isBefore('2026-01-01', '2026-06-01'); // true
     * DateHelper.isBefore('2026-12-31', '2026-01-01'); // false
     * DateHelper.isBefore('2026-05-15', '2026-05-15'); // false
     */
    static isBefore(dateA, dateB) {
        return dayjs(dateA).isBefore(dateB);
    }

    /**
     * Checks whether dateA is chronologically after dateB.
     *
     * @param {string|Date|number} dateA - The date to check.
     * @param {string|Date|number} dateB - The date to compare against.
     * @returns {boolean} `true` if dateA is after dateB, `false` otherwise.
     *
     * @example
     * DateHelper.isAfter('2026-12-31', '2026-01-01'); // true
     * DateHelper.isAfter('2026-01-01', '2026-06-01'); // false
     * DateHelper.isAfter('2026-05-15', '2026-05-15'); // false
     */
    static isAfter(dateA, dateB) {
        return dayjs(dateA).isAfter(dateB);
    }

    /**
     * Checks whether a date falls between a start date and an end date (exclusive on both ends by default).
     * Uses the dayjs isBetween plugin.
     *
     * @param {string|Date|number} date - The date to check.
     * @param {string|Date|number} startDate - The beginning of the date range.
     * @param {string|Date|number} endDate - The end of the date range.
     * @returns {boolean} `true` if the date is between startDate and endDate, `false` otherwise.
     *
     * @example
     * DateHelper.isBetween('2026-06-15', '2026-01-01', '2026-12-31'); // true
     * DateHelper.isBetween('2027-03-01', '2026-01-01', '2026-12-31'); // false
     * DateHelper.isBetween('2026-01-01', '2026-01-01', '2026-12-31'); // false (exclusive)
     */
    static isBetween(date, startDate, endDate) {
        return dayjs(date).isBetween(startDate, endDate);
    }

    /**
     * Returns the start of the day (00:00:00) for the given date, formatted as a string.
     *
     * @param {string|Date|number} [date=new Date()] - The date for which to get the start of day. Defaults to the current date.
     * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - A dayjs-compatible format token string.
     * @returns {string} The start of the day as a formatted string.
     *
     * @example
     * DateHelper.startOfDay('2026-02-28');               // '2026-02-28 00:00:00'
     * DateHelper.startOfDay('2026-06-15', 'YYYY-MM-DD');// '2026-06-15'
     */
    static startOfDay(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
        return dayjs(date).startOf('day').format(format);
    }

    /**
     * Returns the end of the day (23:59:59) for the given date, formatted as a string.
     *
     * @param {string|Date|number} [date=new Date()] - The date for which to get the end of day. Defaults to the current date.
     * @param {string} [format='YYYY-MM-DD HH:mm:ss'] - A dayjs-compatible format token string.
     * @returns {string} The end of the day as a formatted string.
     *
     * @example
     * DateHelper.endOfDay('2026-02-28');               // '2026-02-28 23:59:59'
     * DateHelper.endOfDay('2026-06-15', 'YYYY-MM-DD');// '2026-06-15'
     */
    static endOfDay(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
        return dayjs(date).endOf('day').format(format);
    }

    /**
     * Returns the full name of the month for the given date (e.g. 'January', 'February').
     *
     * @param {string|Date|number} [date=new Date()] - The date to extract the month name from. Defaults to the current date.
     * @returns {string} The full month name.
     *
     * @example
     * DateHelper.getMonthName('2026-02-28');  // 'February'
     * DateHelper.getMonthName('2026-12-25');  // 'December'
     * DateHelper.getMonthName();              // current month name
     */
    static getMonthName(date = new Date()) {
        return dayjs(date).format('MMMM');
    }

    /**
     * Returns the full name of the day of the week for the given date (e.g. 'Monday', 'Saturday').
     *
     * @param {string|Date|number} [date=new Date()] - The date to extract the day of week from. Defaults to the current date.
     * @returns {string} The full day-of-week name.
     *
     * @example
     * DateHelper.getDayOfWeek('2026-02-28');  // 'Saturday'
     * DateHelper.getDayOfWeek('2026-12-25');  // 'Friday'
     * DateHelper.getDayOfWeek();              // current day name
     */
    static getDayOfWeek(date = new Date()) {
        return dayjs(date).format('dddd');
    }

    /**
     * Creates a human-readable relative timestamp describing how long ago the given date was
     * (e.g. "2 hours ago", "3 days ago", "a month ago"). Uses the dayjs relativeTime plugin.
     *
     * @param {string|Date|number} date - The past (or future) date to compare against now.
     * @returns {string} A human-readable relative time string.
     *
     * @example
     * // Assuming current date is 2026-02-28
     * DateHelper.timeAgo('2026-02-27'); // 'a day ago'
     * DateHelper.timeAgo('2026-02-21'); // '7 days ago'
     * DateHelper.timeAgo('2025-02-28'); // 'a year ago'
     */
    static timeAgo(date) {
        return dayjs(date).fromNow();
    }

    /**
     * Generates a filename-safe timestamp string based on the current date and time.
     * Uses underscores and hyphens instead of colons and spaces for filesystem compatibility.
     *
     * @returns {string} A timestamp string in the format 'YYYY-MM-DD_HH-mm-ss'.
     *
     * @example
     * DateHelper.fileTimestamp(); // '2026-02-28_14-30-00'
     *
     * // Typical usage for unique file names
     * const reportName = `test-report_${DateHelper.fileTimestamp()}.html`;
     * // 'test-report_2026-02-28_14-30-00.html'
     */
    static fileTimestamp() {
        return dayjs().format('YYYY-MM-DD_HH-mm-ss');
    }
}

module.exports = { DateHelper };
