import config from '@automattic/calypso-config';
import {
	START_WRITING_FLOW,
	CONNECT_DOMAIN_FLOW,
	DOMAIN_FLOW,
	NEW_HOSTED_SITE_FLOW,
	TRANSFERRING_HOSTED_SITE_FLOW,
	DOMAIN_TRANSFER,
	GOOGLE_TRANSFER,
	HUNDRED_YEAR_DOMAIN_TRANSFER,
	REBLOGGING_FLOW,
	SITE_MIGRATION_FLOW,
	ENTREPRENEUR_FLOW,
	ONBOARDING_FLOW,
	HUNDRED_YEAR_DOMAIN_FLOW,
	EXAMPLE_FLOW,
	AI_SITE_BUILDER_FLOW,
	AI_SITE_BUILDER_SPEC_FLOW,
	ONBOARDING_UNIFIED_FLOW,
	DOMAIN_AND_PLAN_FLOW,
} from '@automattic/onboarding';
import type { Flow, FlowV2 } from '../declarative-flow/internals/types';

const availableFlows: Record< string, () => Promise< { default: FlowV2< any > } > > = {
	[ NEW_HOSTED_SITE_FLOW ]: () =>
		import(
			/* webpackChunkName: "new-hosted-site-flow" */ './flows/new-hosted-site-flow/new-hosted-site-flow'
		),

	[ ONBOARDING_FLOW ]: () =>
		import( /* webpackChunkName: "onboarding-flow" */ './flows/onboarding/onboarding' ),

	[ SITE_MIGRATION_FLOW ]: () =>
		import(
			/* webpackChunkName: "site-migration-flow" */ './flows/site-migration-flow/site-migration-flow'
		),

	[ EXAMPLE_FLOW ]: () =>
		import( /* webpackChunkName: "example-flow" */ './flows/00-example-flow/example' ),

	[ ONBOARDING_UNIFIED_FLOW ]: () =>
		import(
			/* webpackChunkName: "onboarding-unified-flow" */ './flows/onboarding-unified/onboarding-unified'
		),

	[ DOMAIN_FLOW ]: () => import( /* webpackChunkName: "domain-flow" */ './flows/domain/domain' ),

	[ AI_SITE_BUILDER_SPEC_FLOW ]: () =>
		import(
			/* webpackChunkName: "ai-site-builder-spec-flow" */ './flows/ai-site-builder-spec/ai-site-builder-spec'
		),
};

/**
 * These flows use FlowV1 API. Which is deprecated and they should be upgraded to FlowV2.
 */
export const deprecatedV1Flows: Record< string, () => Promise< { default: Flow } > > = {
	'site-setup': () =>
		import( /* webpackChunkName: "site-setup-flow" */ './flows/site-setup-flow/site-setup-flow' ),

	'copy-site': () =>
		import( /* webpackChunkName: "copy-site-flow" */ './flows/copy-site/copy-site' ),

	newsletter: () =>
		import( /* webpackChunkName: "newsletter-flow" */ './flows/newsletter/newsletter' ),

	[ ENTREPRENEUR_FLOW ]: () =>
		import(
			/* webpackChunkName: "entrepreneur-flow" */ './flows/entrepreneur-flow/entrepreneur-flow'
		),

	'readymade-template': () =>
		import(
			/* webpackChunkName: "readymade-template-flow" */ './flows/readymade-template/readymade-template'
		),

	'update-design': () =>
		import( /* webpackChunkName: "update-design-flow" */ './flows/update-design/update-design' ),

	'update-options': () =>
		import( /* webpackChunkName: "update-options-flow" */ './flows/update-options/update-options' ),

	[ DOMAIN_AND_PLAN_FLOW ]: () =>
		import(
			/* webpackChunkName: "domain-and-plan-flow" */ './flows/domain-and-plan/domain-and-plan'
		),

	build: () => import( /* webpackChunkName: "build-flow" */ './flows/build/build' ),

	write: () => import( /* webpackChunkName: "write-flow" */ './flows/write/write' ),

	[ START_WRITING_FLOW ]: () =>
		import( /* webpackChunkName: "start-writing-flow" */ './flows/start-writing/start-writing' ),

	[ CONNECT_DOMAIN_FLOW ]: () =>
		import( /* webpackChunkName: "connect-domain" */ './flows/connect-domain/connect-domain' ),

	[ TRANSFERRING_HOSTED_SITE_FLOW ]: () =>
		import(
			/* webpackChunkName: "transferring-hosted-site-flow" */ './flows/transferring-hosted-site-flow/transferring-hosted-site-flow'
		),

	[ DOMAIN_TRANSFER ]: () =>
		import( /* webpackChunkName: "domain-transfer" */ './flows/domain-transfer/domain-transfer' ),

	[ GOOGLE_TRANSFER ]: () =>
		import( /* webpackChunkName: "google-transfer" */ './flows/google-transfer/google-transfer' ),

	[ 'plugin-bundle' ]: () =>
		import(
			/* webpackChunkName: "plugin-bundle-flow" */ './flows/plugin-bundle-flow/plugin-bundle-flow'
		),

	[ 'hundred-year-plan' ]: () =>
		import(
			/* webpackChunkName: "hundred-year-plan" */ './flows/hundred-year-plan/hundred-year-plan'
		),

	'domain-user-transfer': () =>
		import(
			/* webpackChunkName: "domain-user-transfer-flow" */ './flows/domain-user-transfer/domain-user-transfer'
		),

	[ REBLOGGING_FLOW ]: () =>
		import( /* webpackChunkName: "reblogging-flow" */ './flows/reblogging/reblogging' ),
};

const aiSiteBuilderFlows: Record< string, () => Promise< { default: FlowV2< any > } > > =
	config.isEnabled( 'calypso/ai-site-builder-flow' )
		? {
				[ AI_SITE_BUILDER_FLOW ]: () => import( './flows/ai-site-builder/ai-site-builder' ),
		  }
		: {};

const hundredYearDomainFlow: Record< string, () => Promise< { default: Flow } > > = {
	[ HUNDRED_YEAR_DOMAIN_FLOW ]: () =>
		import(
			/* webpackChunkName: "hundred-year-domain" */ './flows/hundred-year-domain/hundred-year-domain'
		),
	[ HUNDRED_YEAR_DOMAIN_TRANSFER ]: () =>
		import(
			/* webpackChunkName: "hundred-year-domain-transfer" */ './flows/hundred-year-domain-transfer/hundred-year-domain-transfer'
		),
};

export default {
	...availableFlows,
	...deprecatedV1Flows,
	...hundredYearDomainFlow,
	...aiSiteBuilderFlows,
};
