/**
 * ═══════════════════════════════════════════════════════════════
 * DateHelper - Date & Time Utilities
 * ═══════════════════════════════════════════════════════════════
 */

const moment = require('moment');

class DateHelper {
    static now(format = 'YYYY-MM-DD HH:mm:ss') {
        return moment().format(format);
    }

    static today(format = 'YYYY-MM-DD') {
        return moment().format(format);
    }

    static timestamp() {
        return Date.now();
    }

    static isoNow() {
        return new Date().toISOString();
    }

    static format(date, format = 'YYYY-MM-DD') {
        return moment(date).format(format);
    }

    static addDays(days, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return moment(fromDate).add(days, 'days').format(format);
    }

    static subtractDays(days, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return moment(fromDate).subtract(days, 'days').format(format);
    }

    static addMonths(months, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return moment(fromDate).add(months, 'months').format(format);
    }

    static addYears(years, fromDate = new Date(), format = 'YYYY-MM-DD') {
        return moment(fromDate).add(years, 'years').format(format);
    }

    static diffInDays(dateA, dateB) {
        return moment(dateA).diff(moment(dateB), 'days');
    }

    static diffInHours(dateA, dateB) {
        return moment(dateA).diff(moment(dateB), 'hours');
    }

    static diffInMinutes(dateA, dateB) {
        return moment(dateA).diff(moment(dateB), 'minutes');
    }

    static isBefore(dateA, dateB) {
        return moment(dateA).isBefore(dateB);
    }

    static isAfter(dateA, dateB) {
        return moment(dateA).isAfter(dateB);
    }

    static isBetween(date, startDate, endDate) {
        return moment(date).isBetween(startDate, endDate);
    }

    static startOfDay(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
        return moment(date).startOf('day').format(format);
    }

    static endOfDay(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
        return moment(date).endOf('day').format(format);
    }

    static getMonthName(date = new Date()) {
        return moment(date).format('MMMM');
    }

    static getDayOfWeek(date = new Date()) {
        return moment(date).format('dddd');
    }

    /**
     * Create a human-readable relative timestamp (e.g. "2 hours ago").
     */
    static timeAgo(date) {
        return moment(date).fromNow();
    }

    /**
     * Generate a unique timestamp string for filenames.
     */
    static fileTimestamp() {
        return moment().format('YYYY-MM-DD_HH-mm-ss');
    }
}

module.exports = { DateHelper };
