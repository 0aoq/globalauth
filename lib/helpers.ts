/**
 * @file Handle helper functions
 * @name helpers.ts
 * @author 0aoq <hkau@oxvs.net>
 * @license MIT
 */

/**
 * @function log
 *
 * @param {string} character
 * @param {string} data
 * @returns {void}
 */
export function log(character: string, data: string): void {
    console.log(`\x1b[1m${character} ~ \x1b[1m\x1b[32m${data}\x1b[0m`);
}

// default export
export default {};
