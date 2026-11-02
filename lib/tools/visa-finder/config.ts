/**
 * Business switches for the visa finders. Agent (Ali) decisions live here so
 * they can be changed without touching the engine.
 */

/**
 * PRD open question #2: how to show 188, 187 and 489 which may be closed.
 *  "label" = show with a "Check current status" badge (default)
 *  "hide"  = remove from results entirely
 */
export const CLOSED_VISA_DISPLAY: "label" | "hide" = "label";

/** Date the visa data was last reviewed by the registered agent. */
export const CATALOGUE_REVIEWED_ON = "2026-11-02";
export const CATALOGUE_REVIEWED_BY = "Research draft: pending agent sign-off";

export const OMARA_REGISTER_URL = "https://portal.mara.gov.au/search-the-register-of-migration-agents/";
export const VISA_PRICING_ESTIMATOR_URL = "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-pricing-estimator";
export const BOOK_CONSULTATION_URL = "https://migrationrepublic.com.au/book-a-consultation/";
export const MARN = "2518961";
