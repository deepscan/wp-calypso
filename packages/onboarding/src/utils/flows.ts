export const ACCOUNT_FLOW = 'account';
export const NEWSLETTER_FLOW = 'newsletter';
export const HOSTING_LP_FLOW = 'hosting-start';
export const NEW_HOSTED_SITE_FLOW = 'new-hosted-site';
export const TRANSFERRING_HOSTED_SITE_FLOW = 'transferring-hosted-site';
export const CONNECT_DOMAIN_FLOW = 'connect-domain';
export const DOMAIN_FLOW = 'domain';
export const ENTREPRENEUR_FLOW = 'entrepreneur';
export const FREE_FLOW = 'free';
export const SITE_MIGRATION_FLOW = 'site-migration';
export const COPY_SITE_FLOW = 'copy-site';
export const BUILD_FLOW = 'build';
export const WRITE_FLOW = 'write';
export const START_WRITING_FLOW = 'start-writing';
export const SITE_SETUP_FLOW = 'site-setup';
export const WITH_THEME_FLOW = 'with-theme';

export const READYMADE_TEMPLATE_FLOW = 'readymade-template';

export const UPDATE_DESIGN_FLOW = 'update-design';
export const DOMAIN_UPSELL_FLOW = 'domain-upsell';
export const DOMAIN_TRANSFER = 'domain-transfer';
export const GOOGLE_TRANSFER = 'google-transfer';
export const HUNDRED_YEAR_DOMAIN_TRANSFER = 'hundred-year-domain-transfer';
export const HUNDRED_YEAR_DOMAIN_FLOW = 'hundred-year-domain';
export const HUNDRED_YEAR_PLAN_FLOW = 'hundred-year-plan';
export const BLOG_FLOW = 'blog';
export const REBLOGGING_FLOW = 'reblogging';
export const DOMAIN_FOR_GRAVATAR_FLOW = 'domain-for-gravatar';
export const ONBOARDING_FLOW = 'onboarding';
export const EXAMPLE_FLOW = 'example';
export const DIFM_FLOW = 'do-it-for-me';
export const DIFM_FLOW_STORE = 'do-it-for-me-store';
export const WEBSITE_DESIGN_SERVICES = 'website-design-services';
export const ONBOARDING_UNIFIED_FLOW = 'onboarding-unified';
export const AI_SITE_BUILDER_FLOW = 'ai-site-builder';
export const PLAYGROUND_FLOW = 'playground';

export const isNewsletterFlow = ( flowName: string | null | undefined ) => {
	return Boolean( flowName && NEWSLETTER_FLOW === flowName );
};

export const isTailoredSignupFlow = ( flowName: string | null ) => {
	return Boolean( flowName && isNewsletterFlow( flowName ) );
};

export const isEntrepreneurSignupFlow = ( flowName: string | null ) => {
	return Boolean( flowName && ENTREPRENEUR_FLOW === flowName );
};

export const isHostingSignupFlow = ( flowName: string | null ) => {
	return Boolean( flowName && HOSTING_LP_FLOW === flowName );
};

export const isNewHostedSiteCreationFlow = ( flowName: string | null ) => {
	return Boolean( flowName && NEW_HOSTED_SITE_FLOW === flowName );
};

export const isTransferringHostedSiteCreationFlow = ( flowName: string | null ) => {
	return Boolean( flowName && TRANSFERRING_HOSTED_SITE_FLOW === flowName );
};

export const isAnyHostingFlow = ( flowName?: string | null ) => {
	return Boolean(
		flowName &&
			[ HOSTING_LP_FLOW, NEW_HOSTED_SITE_FLOW, TRANSFERRING_HOSTED_SITE_FLOW ].includes( flowName )
	);
};

export const isCopySiteFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ COPY_SITE_FLOW ].includes( flowName ) );
};

export const isEntrepreneurFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ ENTREPRENEUR_FLOW ].includes( flowName ) );
};

export const isNewSiteMigrationFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ SITE_MIGRATION_FLOW ].includes( flowName ) );
};

export const isBuildFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ BUILD_FLOW ].includes( flowName ) );
};

export const isWriteFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ WRITE_FLOW ].includes( flowName ) );
};

export const isUpdateDesignFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ UPDATE_DESIGN_FLOW ].includes( flowName ) );
};

export const isStartWritingFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ START_WRITING_FLOW ].includes( flowName ) );
};

export const isOnboardingFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ ONBOARDING_FLOW ].includes( flowName ) );
};

export const isDomainUpsellFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ DOMAIN_UPSELL_FLOW ].includes( flowName ) );
};

export const isReadymadeFlow = ( flowName: string | null ) => flowName === READYMADE_TEMPLATE_FLOW;

export const isWithThemeFlow = ( flowName: string | null ) => {
	const WITH_THEME_FLOWS = [ WITH_THEME_FLOW ];
	return !! flowName && WITH_THEME_FLOWS.includes( flowName );
};

export const isSiteSetupFlow = ( flowName: string | null ) => {
	return !! flowName && SITE_SETUP_FLOW === flowName;
};

export const ecommerceFlowRecurTypes = {
	YEARLY: 'yearly',
	MONTHLY: 'monthly',
	'2Y': '2Y',
	'3Y': '3Y',
};

export const isDomainForGravatarFlow = ( flowName: string | null | undefined ) => {
	return Boolean( flowName && [ DOMAIN_FOR_GRAVATAR_FLOW ].includes( flowName ) );
};

export const isHundredYearPlanFlow = ( flowName: string | null | undefined ) => {
	return Boolean( flowName && [ HUNDRED_YEAR_PLAN_FLOW ].includes( flowName ) );
};

export const isHundredYearDomainFlow = ( flowName: string | null | undefined ) => {
	return Boolean( flowName && [ HUNDRED_YEAR_DOMAIN_FLOW ].includes( flowName ) );
};

export const isDIFMFlow = ( flowName: string | null ) => {
	return Boolean(
		flowName && [ DIFM_FLOW, DIFM_FLOW_STORE, WEBSITE_DESIGN_SERVICES ].includes( flowName )
	);
};

export const isAIBuilderFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ AI_SITE_BUILDER_FLOW ].includes( flowName ) );
};

export const isPlaygroundFlow = ( flowName: string | null ) => {
	return Boolean( flowName && [ PLAYGROUND_FLOW ].includes( flowName ) );
};
