/**
 * External dependencies
 */
import { Site, DomainSuggestions, Plans, Launch } from '@automattic/data-stores';

// TODO: Check Site store registration discrepancies between:
// - client/landing/gutenboarding/stores/site/index.ts
// - apps/editing-toolkit/editing-toolkit-plugin/common/data-stores/site.ts
const SITE_STORE = Site.register( { client_id: '', client_secret: '' } );

const PLANS_STORE = Plans.register();

const DOMAIN_SUGGESTIONS_STORE = DomainSuggestions.register();

const LAUNCH_STORE = Launch.register();

export { SITE_STORE, PLANS_STORE, DOMAIN_SUGGESTIONS_STORE, LAUNCH_STORE };

export type Plan = Plans.Plan;
export type PlanProduct = Plans.PlanProduct;
export type SiteDetailsPlan = Site.SiteDetailsPlan;
