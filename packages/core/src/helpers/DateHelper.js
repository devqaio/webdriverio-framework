/**
 * ═══════════════════════════════════════════════════════════════
 * DateHelper - Date & Time Utilities
 * ═══════════════════════════════════════════════════════════════
 *
 * Uses dayjs (lightweight, immutable, modern replacement for moment.js).
 */

const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const isBetween = require('dayjs/plugin/isBetween');

dayjs.extend(relativeTime);
dayjs.extend(isBetween);

class DateHelper {
    static now(format = 'YYYY-MM-DD HH:mm:ss') {
        return dayjs().format(format);
    }

    static today(format = 'YYYY-MM-DD') {
        return dayjs().format(format);
    }

    static timestamp() {
        return Date.now();
    }

    static isoNow() {
        return new Date().toISOString();
    }

    static format(date, format = 'YYYY-MM-DD') {
        return dayjs(date).format(format);
    }

    static addDays(days, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return dayjs(fromDate).add(days, 'day').format(format);
    }

    static subtractDays(days, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return dayjs(fromDate).subtract(days, 'day').format(format);
    }

    static addMonths(months, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return dayjs(fromDate).add(months, 'month').format(format);
    }

    static addYears(years, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return dayjs(fromDate).add(years, 'year').format(format);
    }

    static diffInDays(dateA, dateB) {
        return dayjs(dateA).diff(dayjs(dateB), 'day');
    }

    static diffInHours(dateA, dateB) {
        return dayjs(dateA).diff(dayjs(dateB), 'hour');
    }

    static diffInMinutes(dateA, dateB) {
        return dayjs(dateA).diff(dayjs(dateB), 'minute');
    }

    static isBefore(dateA, dateB) {
        return dayjs(dateA).isBefore(dateB);
    }

    static isAfter(dateA, dateB) {
        return dayjs(dateA).isAfter(dateB);
    }

    static isBetween(date, startDate, endDate) {
        return dayjs(date).isBetween(startDate, endDate);
    }

    static startOfDay(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
        return dayjs(date).startOf('day').format(format);
    }

    static endOfDay(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
        return dayjs(date).endOf('day').format(format);
    }

    static getMonthName(date = new Date()) {
        return dayjs(date).format('MMMM');
    }

    static getDayOfWeek(date = new Date()) {
        return dayjs(date).format('dddd');
    }

    /**
     * Create a human-readable relative timestamp (e.g. "2 hours ago").
     */
    static timeAgo(date) {
        return dayjs(date).fromNow();
    }

    /**
     * Generate a unique timestamp string for filenames.
     */
    static fileTimestamp() {
        return dayjs().format('YYYY-MM-DD_HH-mm-ss');
    }
}

module.exports = { DateHelper };
