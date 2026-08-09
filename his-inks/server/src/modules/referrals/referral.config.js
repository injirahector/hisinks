/**
 * Referral commission configuration
 *
 * Change COMMISSION_RATE here to adjust the referral reward percentage
 * across the entire application. All service logic reads from this file.
 *
 * COMMISSION_RATE = 0.05 means 5 % of the qualifying tattoo's agreed price.
 */

const COMMISSION_RATE = parseFloat(process.env.REFERRAL_COMMISSION_RATE || '0.05');

module.exports = { COMMISSION_RATE };
