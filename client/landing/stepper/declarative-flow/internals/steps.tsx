export const STEPS = {
	BLOGGER_STARTING_POINT: {
		slug: 'bloggerStartingPoint',
		asyncComponent: () => import( './steps-repository/blogger-starting-point' ),
	},

	BUSINESS_INFO: {
		slug: 'businessInfo',
		asyncComponent: () => import( './steps-repository/business-info' ),
	},

	AUTOMATED_COPY_SITE: {
		slug: 'automated-copy',
		asyncComponent: () => import( './steps-repository/automated-copy-site' ),
	},

	CELEBRATION: {
		slug: 'celebration-step',
		asyncComponent: () => import( './steps-repository/celebration-step' ),
	},

	CHECK_SITES: {
		slug: 'check-sites',
		asyncComponent: () => import( './steps-repository/sites-checker' ),
	},

	COURSES: { slug: 'courses', asyncComponent: () => import( './steps-repository/courses' ) },

	DESIGN_CHOICES: {
		slug: 'design-choices',
		asyncComponent: () => import( './steps-repository/design-choices' ),
	},

	DESIGN_SETUP: {
		slug: 'design-setup',
		asyncComponent: () => import( './steps-repository/design-setup' ),
	},

	DIFM_STARTING_POINT: {
		slug: 'difmStartingPoint',
		asyncComponent: () => import( './steps-repository/difm-starting-point' ),
	},

	DOMAIN_CONTACT_INFO: {
		slug: 'domain-contact-info',
		asyncComponent: () => import( './steps-repository/domain-contact-info' ),
	},

	DOMAIN_TRANSFER_INTRO: {
		slug: 'intro',
		asyncComponent: () => import( './steps-repository/domain-transfer-intro' ),
	},

	DOMAIN_TRANSFER_DOMAINS: {
		slug: 'domains',
		asyncComponent: () => import( './steps-repository/domain-transfer-domains' ),
	},

	DOMAINS: {
		slug: 'domains',
		asyncComponent: () => import( './steps-repository/domains' ),
	},

	DOMAIN_SEARCH: {
		slug: 'domains',
		asyncComponent: () => import( './steps-repository/domain-search' ),
	},

	ERROR: { slug: 'error', asyncComponent: () => import( './steps-repository/error-step' ) },

	NEWSLETTER_SETUP: {
		slug: 'newsletterSetup',
		asyncComponent: () => import( './steps-repository/newsletter-setup' ),
	},

	NEWSLETTER_GOALS: {
		slug: 'newsletterGoals',
		asyncComponent: () => import( './steps-repository/newsletter-goals' ),
	},

	SUBSCRIBERS: {
		slug: 'subscribers',
		asyncComponent: () => import( './steps-repository/subscribers' ),
	},

	FREE_POST_SETUP: {
		slug: 'freePostSetup',
		asyncComponent: () => import( './steps-repository/free-post-setup' ),
	},

	GOALS: { slug: 'goals', asyncComponent: () => import( './steps-repository/goals' ) },

	GENERATE_CONTENT: {
		slug: 'generateContent',
		asyncComponent: () => import( './steps-repository/readymade-template-generate-content' ),
	},

	IMPORT: { slug: 'import', asyncComponent: () => import( './steps-repository/import' ) },

	IMPORT_LIST: {
		slug: 'importList',
		asyncComponent: () => import( './steps-repository/import-list' ),
	},

	IMPORT_READY: {
		slug: 'importReady',
		asyncComponent: () => import( './steps-repository/import-ready' ),
	},

	IMPORT_READY_NOT: {
		slug: 'importReadyNot',
		asyncComponent: () => import( './steps-repository/import-ready-not' ),
	},

	IMPORT_READY_PREVIEW: {
		slug: 'importReadyPreview',
		asyncComponent: () => import( './steps-repository/import-ready-preview' ),
	},

	IMPORT_READY_WPCOM: {
		slug: 'importReadyWpcom',
		asyncComponent: () => import( './steps-repository/import-ready-wpcom' ),
	},

	IMPORTER_BLOGGER: {
		slug: 'importerBlogger',
		asyncComponent: () => import( './steps-repository/importer-blogger' ),
	},

	IMPORTER_MEDIUM: {
		slug: 'importerMedium',
		asyncComponent: () => import( './steps-repository/importer-medium' ),
	},

	IMPORTER_PLAYGROUND: {
		slug: 'importerPlayground',
		asyncComponent: () => import( './steps-repository/playground/components/playground-setup' ),
	},

	IMPORTER_SQUARESPACE: {
		slug: 'importerSquarespace',
		asyncComponent: () => import( './steps-repository/importer-squarespace' ),
	},

	IMPORTER_SUBSTACK: {
		slug: 'importerSubstack',
		asyncComponent: () => import( './steps-repository/importer-substack' ),
	},

	IMPORTER_WIX: {
		slug: 'importerWix',
		asyncComponent: () => import( './steps-repository/importer-wix' ),
	},

	IMPORTER_WORDPRESS: {
		slug: 'importerWordpress',
		asyncComponent: () => import( './steps-repository/importer-wordpress' ),
	},

	INTENT: {
		slug: 'intent',
		asyncComponent: () => import( './steps-repository/intent-step' ),
	},

	NEW_OR_EXISTING_SITE: {
		slug: 'new-or-existing-site',
		asyncComponent: () => import( './steps-repository/new-or-existing-site' ),
	},

	LAUNCH_BIG_SKY: {
		slug: 'launch-big-sky',
		asyncComponent: () => import( './steps-repository/launch-big-sky' ),
	},

	SITE_SPEC: {
		slug: 'site-spec',
		asyncComponent: () => import( './steps-repository/site-spec' ),
	},

	LAUNCHPAD: { slug: 'launchpad', asyncComponent: () => import( './steps-repository/launchpad' ) },

	OPTIONS: {
		slug: 'options',
		asyncComponent: () => import( './steps-repository/site-options' ),
	},

	PLANS: { slug: 'plans', asyncComponent: () => import( './steps-repository/plans' ) },

	PROCESSING: {
		slug: 'processing',
		asyncComponent: () => import( './steps-repository/processing-step' ),
	},

	/** Temporary step until we allow passing props to steps */
	PROCESSING_COPY_SITE_FLOW: {
		slug: 'processing-copy',
		asyncComponent: () => import( './steps-repository/processing-step-copy-site-flow' ),
	},

	SITE_CREATION_STEP: {
		slug: 'create-site',
		asyncComponent: () => import( './steps-repository/create-site' ),
	},

	SITE_LAUNCH: {
		slug: 'site-launch',
		asyncComponent: () => import( './steps-repository/site-launch' ),
	},

	SITE_PICKER: {
		slug: 'site-picker',
		asyncComponent: () => import( './steps-repository/site-picker-list' ),
	},

	STORE_ADDRESS: {
		slug: 'storeAddress',
		asyncComponent: () => import( './steps-repository/store-address' ),
	},

	TRIAL_ACKNOWLEDGE: {
		slug: 'trialAcknowledge',
		asyncComponent: () => import( './steps-repository/trial-acknowledge' ),
	},

	VERIFY_EMAIL: {
		slug: 'verifyEmail',
		asyncComponent: () => import( './steps-repository/import-verify-email' ),
	},

	BUNDLE_CONFIRM: {
		slug: 'bundleConfirm',
		asyncComponent: () => import( './steps-repository/bundle-confirm' ),
	},

	BUNDLE_INSTALL_PLUGINS: {
		slug: 'bundleInstallPlugins',
		asyncComponent: () => import( './steps-repository/bundle-install-plugins' ),
	},

	BUNDLE_TRANSFER: {
		slug: 'bundleTransfer',
		asyncComponent: () => import( './steps-repository/bundle-transfer' ),
	},

	WAIT_FOR_ATOMIC: {
		slug: 'waitForAtomic',
		asyncComponent: () => import( './steps-repository/wait-for-atomic' ),
	},

	WAIT_FOR_PLUGIN_INSTALL: {
		slug: 'waitForPluginInstall',
		asyncComponent: () => import( './steps-repository/wait-for-plugin-install' ),
	},

	SITE_MIGRATION_INSTRUCTIONS: {
		slug: 'site-migration-instructions',
		asyncComponent: () => import( './steps-repository/site-migration-instructions' ),
	},

	SITE_MIGRATION_STARTED: {
		slug: 'site-migration-started',
		asyncComponent: () => import( './steps-repository/site-migration-started' ),
	},

	SITE_MIGRATION_CREDENTIALS: {
		slug: 'site-migration-credentials',
		asyncComponent: () => import( './steps-repository/site-migration-credentials' ),
	},

	SITE_MIGRATION_FALLBACK_CREDENTIALS: {
		slug: 'site-migration-fallback-credentials',
		asyncComponent: () => import( './steps-repository/site-migration-fallback-credentials' ),
	},

	SITE_MIGRATION_APPLICATION_PASSWORD_AUTHORIZATION: {
		slug: 'site-migration-application-password-authorization',
		asyncComponent: () =>
			import( './steps-repository/site-migration-application-password-authorization' ),
	},

	SITE_MIGRATION_IDENTIFY: {
		slug: 'site-migration-identify',
		asyncComponent: () => import( './steps-repository/site-migration-identify' ),
	},

	SITE_MIGRATION_IMPORT_OR_MIGRATE: {
		slug: 'site-migration-import-or-migrate',
		asyncComponent: () => import( './steps-repository/site-migration-import-or-migrate' ),
	},

	SITE_MIGRATION_OTHER_PLATFORM_DETECTED_IMPORT: {
		slug: 'other-platform-detected',
		asyncComponent: () =>
			import( './steps-repository/site-migration-other-platform-detected-import' ),
	},

	SITE_MIGRATION_HOW_TO_MIGRATE: {
		slug: 'site-migration-how-to-migrate',
		asyncComponent: () => import( './steps-repository/site-migration-how-to-migrate' ),
	},

	SITE_MIGRATION_UPGRADE_PLAN: {
		slug: 'site-migration-upgrade-plan',
		asyncComponent: () => import( './steps-repository/site-migration-upgrade-plan' ),
	},

	SITE_MIGRATION_ALREADY_WPCOM: {
		slug: 'already-wpcom',
		asyncComponent: () => import( './steps-repository/site-migration-already-wpcom' ),
	},
	SITE_MIGRATION_SUPPORT_INSTRUCTIONS: {
		slug: 'migration-support-instructions',
		asyncComponent: () => import( './steps-repository/site-migration-support-instructions' ),
	},

	PICK_SITE: {
		slug: 'sitePicker',
		asyncComponent: () => import( './steps-repository/site-picker' ),
	},

	POST_CHECKOUT_ONBOARDING: {
		slug: 'post-checkout-onboarding',
		asyncComponent: () => import( './steps-repository/post-checkout/post-checkout-onboarding' ),
	},

	SEGMENTATION_SURVEY: {
		slug: 'segmentation-survey',
		asyncComponent: () => import( './steps-repository/segmentation-survey' ),
	},
	PLATFORM_IDENTIFICATION: {
		slug: 'platform-identification',
		asyncComponent: () => import( './steps-repository/platform-identification' ),
	},
	UNIFIED_DOMAINS: {
		slug: 'domains',
		asyncComponent: () =>
			import(
				/* webpackChunkName: 'async-step-unified-domains' */ './steps-repository/unified-domains'
			),
	},
	UNIFIED_PLANS: {
		slug: 'plans',
		asyncComponent: () =>
			import(
				/* webpackChunkName: 'async-step-unified-plans' */ './steps-repository/unified-plans'
			),
	},

	USE_MY_DOMAIN: {
		slug: 'use-my-domain',
		asyncComponent: () =>
			import(
				/* webpackChunkName: 'async-step-use-my-domain' */ './steps-repository/use-my-domain'
			),
	},

	GET_CURRENT_THEME_SOFTWARE_SETS: {
		slug: 'getCurrentThemeSoftwareSets',
		asyncComponent: () => import( './steps-repository/get-current-theme-software-sets' ),
	},

	CHECK_FOR_PLUGINS: {
		slug: 'checkForPlugins',
		asyncComponent: () => import( './steps-repository/check-for-plugins' ),
	},

	HUNDRED_YEAR_PLAN_DIY_OR_DIFM: {
		slug: 'diy-or-difm',
		asyncComponent: () => import( './steps-repository/hundred-year-plan-diy-or-difm' ),
	},

	HUNDRED_YEAR_PLAN_THANK_YOU: {
		slug: 'thank-you',
		asyncComponent: () => import( './steps-repository/hundred-year-plan-thank-you' ),
	},

	HUNDRED_YEAR_PLAN_SITE_PICKER: {
		slug: 'site-picker',
		asyncComponent: () => import( './steps-repository/hundred-year-plan-site-picker' ),
	},

	HUNDRED_YEAR_PLAN_SETUP: {
		slug: 'setup',
		asyncComponent: () => import( './steps-repository/hundred-year-plan-setup' ),
	},

	SETUP_BLOG: {
		slug: 'setup-blog',
		asyncComponent: () => import( './steps-repository/setup-blog' ),
	},

	PLAYGROUND: {
		slug: 'playground',
		asyncComponent: () => import( './steps-repository/playground' ),
	},
} as const;

/**
 * Define steps that are only used by the Stepper framework. Any flow should avoid include these steps as much as possible.
 */
export const PRIVATE_STEPS = {
	USER: {
		slug: 'user',
		asyncComponent: () =>
			import( /* webpackChunkName: "stepper-user-step" */ './steps-repository/__user' ),
	},
} as const;
