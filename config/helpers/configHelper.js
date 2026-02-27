/**
 * ═══════════════════════════════════════════════════════════════
 * Config Helper - Deep-Merge Utility
 * ═══════════════════════════════════════════════════════════════
 */

const _ = require('lodash');

/**
 * Deep-merge a base config with environment overrides.
 * Arrays are replaced (not concatenated) to allow full override.
 */
function deepMerge(base, overrides) {
    return _.mergeWith({}, base, overrides, (objValue, srcValue) => {
        if (Array.isArray(srcValue)) {
            return srcValue; // Replace arrays entirely
        }
    });
}

module.exports = { deepMerge };
