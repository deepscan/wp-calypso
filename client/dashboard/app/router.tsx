import {
	Router,
	createRoute,
	createRootRoute,
	redirect,
	createLazyRoute,
	lazyRouteComponent,
} from '@tanstack/react-router';
import { HostingFeatures } from '../data/constants';
import { fetchTwoStep } from '../data/me';
import { canViewHundredYearPlanSettings, canViewWordPressSettings } from '../sites/features';
import { hasHostingFeature } from '../utils/site-features';
import NotFound from './404';
import UnknownError from './500';
import { domainsQuery } from './queries/domains';
import { emailsQuery } from './queries/emails';
import { isAutomatticianQuery } from './queries/me-a8c';
import { rawUserPreferencesQuery } from './queries/me-preferences';
import { profileQuery } from './queries/me-profile';
import { siteByIdQuery, siteBySlugQuery } from './queries/site';
import { siteLastFiveActivityLogEntriesQuery } from './queries/site-activity-log';
import { siteAgencyBlogQuery } from './queries/site-agency';
import { siteLastBackupQuery } from './queries/site-backups';
import { siteEdgeCacheStatusQuery } from './queries/site-cache';
import { siteDefensiveModeSettingsQuery } from './queries/site-defensive-mode';
import { siteDomainsQuery } from './queries/site-domains';
import { siteJetpackModulesQuery } from './queries/site-jetpack-module';
import { siteJetpackSettingsQuery } from './queries/site-jetpack-settings';
import { sitePHPVersionQuery } from './queries/site-php-version';
import { siteCurrentPlanQuery } from './queries/site-plans';
import { sitePreviewLinksQuery } from './queries/site-preview-links';
import { sitePrimaryDataCenterQuery } from './queries/site-primary-data-center';
import { sitePurchaseQuery } from './queries/site-purchases';
import { siteScanQuery } from './queries/site-scan';
import { siteSettingsQuery } from './queries/site-settings';
import { siteSftpUsersQuery } from './queries/site-sftp';
import { siteSshAccessStatusQuery } from './queries/site-ssh';
import { siteStaticFile404SettingQuery } from './queries/site-static-file-404';
import { siteWordPressVersionQuery } from './queries/site-wordpress-version';
import { sitesQuery } from './queries/sites';
import { queryClient } from './query-client';
import Root from './root';
import type { AppConfig } from './context';
import type { AnyRoute } from '@tanstack/react-router';

interface RouteContext {
	config?: AppConfig;
}

const rootRoute = createRootRoute( { component: Root } );

const indexRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: '/',
	beforeLoad: ( { context }: { context: RouteContext } ) => {
		if ( context.config ) {
			throw redirect( { to: context.config.mainRoute } );
		}
	},
} );

const overviewRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: 'overview',
} ).lazy( () =>
	import( '../agency-overview' ).then( ( d ) =>
		createLazyRoute( 'agency-overview' )( {
			component: d.default,
		} )
	)
);

const sitesRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: 'sites',
	loader: async () => {
		// Preload the default sites list response without blocking.
		queryClient.ensureQueryData( sitesQuery() );

		await Promise.all( [
			queryClient.ensureQueryData( isAutomatticianQuery() ),
			queryClient.ensureQueryData( rawUserPreferencesQuery() ),
		] );
	},
	validateSearch: ( search ) => {
		// Deserialize the view search param if it exists on the first page load.
		if ( typeof search.view === 'string' ) {
			let parsedView;
			try {
				parsedView = JSON.parse( search.view );
			} catch ( e ) {
				// pass
			}
			return { ...search, view: parsedView };
		}
		return search;
	},
} ).lazy( () =>
	import( '../sites' ).then( ( d ) =>
		createLazyRoute( 'sites' )( {
			component: d.default,
		} )
	)
);

const siteRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: 'sites/$siteSlug',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		const otherEnvironmentSiteId = site.is_wpcom_staging_site
			? site.options?.wpcom_production_blog_id
			: site.options?.wpcom_staging_blog_ids?.[ 0 ];
		if ( otherEnvironmentSiteId ) {
			await queryClient.ensureQueryData( siteByIdQuery( otherEnvironmentSiteId ) );
		}
	},
	errorComponent: lazyRouteComponent( () => import( '../sites/site/error' ) ),
} ).lazy( () =>
	import( '../sites/site' ).then( ( d ) =>
		createLazyRoute( 'site' )( {
			component: d.default,
		} )
	)
);

const siteOverviewRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: '/',
	loader: async ( { params: { siteSlug }, preload } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( preload ) {
			Promise.all( [
				queryClient.ensureQueryData( siteCurrentPlanQuery( site.ID ) ),
				queryClient.ensureQueryData( siteLastFiveActivityLogEntriesQuery( site.ID ) ),
				hasHostingFeature( site, HostingFeatures.SCAN ) &&
					queryClient.ensureQueryData( siteScanQuery( site.ID ) ),
				hasHostingFeature( site, HostingFeatures.BACKUPS ) &&
					queryClient.ensureQueryData( siteLastBackupQuery( site.ID ) ),
				site.is_a4a_dev_site && queryClient.ensureQueryData( sitePreviewLinksQuery( site.ID ) ),
			] ).then( ( [ currentPlan ] ) => {
				if ( currentPlan.id ) {
					queryClient.ensureQueryData( sitePurchaseQuery( site.ID, currentPlan.id ) );
				}
			} );
		}
	},
} ).lazy( () =>
	import( '../sites/overview' ).then( ( d ) =>
		createLazyRoute( 'site-overview' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteDeploymentsRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'deployments',
} ).lazy( () =>
	import( '../sites/deployments' ).then( ( d ) =>
		createLazyRoute( 'site-deployments' )( {
			component: d.default,
		} )
	)
);

const siteMonitoringRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'monitoring',
} ).lazy( () =>
	import( '../sites/monitoring' ).then( ( d ) =>
		createLazyRoute( 'site-monitoring' )( {
			component: d.default,
		} )
	)
);

const siteLogsRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'logs',
} ).lazy( () =>
	import( '../sites/logs' ).then( ( d ) =>
		createLazyRoute( 'site-logs' )( {
			component: d.default,
		} )
	)
);

const siteBackupsRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'backups',
} ).lazy( () =>
	import( '../sites/backups' ).then( ( d ) =>
		createLazyRoute( 'site-backups' )( {
			component: d.default,
		} )
	)
);

const siteDomainsRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'domains',
} ).lazy( () =>
	import( '../sites/domains' ).then( ( d ) =>
		createLazyRoute( 'site-domains' )( {
			component: d.default,
		} )
	)
);

const siteEmailsRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'emails',
} ).lazy( () =>
	import( '../sites/emails' ).then( ( d ) =>
		createLazyRoute( 'site-emails' )( {
			component: d.default,
		} )
	)
);

const sitePerformanceRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'performance',
} ).lazy( () =>
	import( '../sites/performance' ).then( ( d ) =>
		createLazyRoute( 'site-performance' )( {
			component: d.default,
		} )
	)
);

const siteSettingsRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		queryClient.ensureQueryData( siteSettingsQuery( site.ID ) );
	},
} ).lazy( () =>
	import( '../sites/settings' ).then( ( d ) =>
		createLazyRoute( 'site-settings' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsSiteVisibilityRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/site-visibility',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		Promise.all( [
			queryClient.ensureQueryData( siteSettingsQuery( site.ID ) ),
			queryClient.ensureQueryData( siteDomainsQuery( site.ID ) ),
		] );
	},
} ).lazy( () =>
	import( '../sites/settings-site-visibility' ).then( ( d ) =>
		createLazyRoute( 'site-settings-site-visibility' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsSubscriptionGiftingRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/subscription-gifting',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		queryClient.ensureQueryData( siteSettingsQuery( site.ID ) );
	},
} ).lazy( () =>
	import( '../sites/settings-subscription-gifting' ).then( ( d ) =>
		createLazyRoute( 'site-settings-subscription-gifting' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsWordPressRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/wordpress',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( canViewWordPressSettings( site ) ) {
			await queryClient.ensureQueryData( siteWordPressVersionQuery( site.ID ) );
		}
	},
} ).lazy( () =>
	import( '../sites/settings-wordpress' ).then( ( d ) =>
		createLazyRoute( 'site-settings-wordpress' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsPHPRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/php',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( hasHostingFeature( site, HostingFeatures.PHP ) ) {
			await queryClient.ensureQueryData( sitePHPVersionQuery( site.ID ) );
		}
	},
} ).lazy( () =>
	import( '../sites/settings-php' ).then( ( d ) =>
		createLazyRoute( 'site-settings-php' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsDatabaseRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/database',
} ).lazy( () =>
	import( '../sites/settings-database' ).then( ( d ) =>
		createLazyRoute( 'site-settings-database' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsAgencyRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/agency',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( site.is_wpcom_atomic ) {
			await queryClient.ensureQueryData( siteAgencyBlogQuery( site.ID ) );
		}
	},
} ).lazy( () =>
	import( '../sites/settings-agency' ).then( ( d ) =>
		createLazyRoute( 'site-settings-agency' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsHundredYearPlanRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/hundred-year-plan',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( canViewHundredYearPlanSettings( site ) ) {
			await queryClient.ensureQueryData( siteSettingsQuery( site.ID ) );
		}
	},
} ).lazy( () =>
	import( '../sites/settings-hundred-year-plan' ).then( ( d ) =>
		createLazyRoute( 'site-settings-hundred-year-plan' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsPrimaryDataCenterRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/primary-data-center',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( hasHostingFeature( site, HostingFeatures.PRIMARY_DATA_CENTER ) ) {
			await queryClient.ensureQueryData( sitePrimaryDataCenterQuery( site.ID ) );
		}
	},
} ).lazy( () =>
	import( '../sites/settings-primary-data-center' ).then( ( d ) =>
		createLazyRoute( 'site-settings-primary-data-center' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsStaticFile404Route = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/static-file-404',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( hasHostingFeature( site, HostingFeatures.STATIC_FILE_404 ) ) {
			await queryClient.ensureQueryData( siteStaticFile404SettingQuery( site.ID ) );
		}
	},
} ).lazy( () =>
	import( '../sites/settings-static-file-404' ).then( ( d ) =>
		createLazyRoute( 'site-settings-static-file-404' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsCachingRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/caching',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( hasHostingFeature( site, HostingFeatures.CACHING ) ) {
			await queryClient.ensureQueryData( siteEdgeCacheStatusQuery( site.ID ) );
		}
	},
} ).lazy( () =>
	import( '../sites/settings-caching' ).then( ( d ) =>
		createLazyRoute( 'site-settings-caching' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsDefensiveModeRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/defensive-mode',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( hasHostingFeature( site, HostingFeatures.DEFENSIVE_MODE ) ) {
			await queryClient.ensureQueryData( siteDefensiveModeSettingsQuery( site.ID ) );
		}
	},
} ).lazy( () =>
	import( '../sites/settings-defensive-mode' ).then( ( d ) =>
		createLazyRoute( 'site-settings-defensive-mode' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsSftpSshRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/sftp-ssh',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		return Promise.all( [
			hasHostingFeature( site, HostingFeatures.SFTP ) &&
				queryClient.ensureQueryData( siteSftpUsersQuery( site.ID ) ),
			hasHostingFeature( site, HostingFeatures.SSH ) &&
				queryClient.ensureQueryData( siteSshAccessStatusQuery( site.ID ) ),
		] );
	},
} ).lazy( () =>
	import( '../sites/settings-sftp-ssh' ).then( ( d ) =>
		createLazyRoute( 'site-settings-sftp-ssh' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const siteSettingsTransferSiteRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/transfer-site',
} ).lazy( () =>
	import( '../sites/settings-transfer-site' ).then( ( d ) =>
		createLazyRoute( 'site-settings-transfer-site' )( {
			component: () => (
				<d.default siteSlug={ siteRoute.useParams().siteSlug } context="dashboard_v2" />
			),
		} )
	)
);

const siteSettingsWebApplicationFirewallRoute = createRoute( {
	getParentRoute: () => siteRoute,
	path: 'settings/web-application-firewall',
	loader: async ( { params: { siteSlug } } ) => {
		const site = await queryClient.ensureQueryData( siteBySlugQuery( siteSlug ) );
		if ( hasHostingFeature( site, HostingFeatures.SECURITY_SETTINGS ) ) {
			await Promise.all( [
				queryClient.ensureQueryData( siteJetpackModulesQuery( site.ID ) ),
				queryClient.ensureQueryData( siteJetpackSettingsQuery( site.ID ) ),
			] );
		}
	},
} ).lazy( () =>
	import( '../sites/settings-web-application-firewall' ).then( ( d ) =>
		createLazyRoute( 'site-settings-web-application-firewall' )( {
			component: () => <d.default siteSlug={ siteRoute.useParams().siteSlug } />,
		} )
	)
);

const domainsRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: 'domains',
	loader: () => queryClient.ensureQueryData( domainsQuery() ),
} ).lazy( () =>
	import( '../domains' ).then( ( d ) =>
		createLazyRoute( 'domains' )( {
			component: d.default,
		} )
	)
);

const emailsRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: 'emails',
	loader: () => queryClient.ensureQueryData( emailsQuery() ),
} ).lazy( () =>
	import( '../emails' ).then( ( d ) =>
		createLazyRoute( 'emails' )( {
			component: d.default,
		} )
	)
);

const meRoute = createRoute( {
	getParentRoute: () => rootRoute,
	path: 'me',
	loader: () => queryClient.ensureQueryData( profileQuery() ),
	beforeLoad: async ( { cause } ) => {
		if ( cause !== 'enter' ) {
			return;
		}
		const twoStep = await fetchTwoStep();
		if ( twoStep.two_step_reauthorization_required ) {
			const currentPath = window.location.pathname;
			const loginUrl = `/me/reauth-required?redirect_to=${ encodeURIComponent( currentPath ) }`;
			window.location.href = loginUrl;
		}
	},
} ).lazy( () =>
	import( '../me' ).then( ( d ) =>
		createLazyRoute( 'me' )( {
			component: d.default,
		} )
	)
);

const profileRoute = createRoute( {
	getParentRoute: () => meRoute,
	path: 'profile',
} ).lazy( () =>
	import( '../me/profile' ).then( ( d ) =>
		createLazyRoute( 'profile' )( {
			component: d.default,
		} )
	)
);

const billingRoute = createRoute( {
	getParentRoute: () => meRoute,
	path: 'billing',
} ).lazy( () =>
	import( '../me/billing' ).then( ( d ) =>
		createLazyRoute( 'billing' )( {
			component: d.default,
		} )
	)
);

const billingHistoryRoute = createRoute( {
	getParentRoute: () => meRoute,
	path: 'billing/billing-history',
} ).lazy( () =>
	import( '../me/billing-history' ).then( ( d ) =>
		createLazyRoute( 'billing-history' )( {
			component: d.default,
		} )
	)
);

const activeSubscriptionsRoute = createRoute( {
	getParentRoute: () => meRoute,
	path: 'billing/active-subscriptions',
} ).lazy( () =>
	import( '../me/active-subscriptions' ).then( ( d ) =>
		createLazyRoute( 'active-subscriptions' )( {
			component: d.default,
		} )
	)
);

const paymentMethodsRoute = createRoute( {
	getParentRoute: () => meRoute,
	path: 'billing/payment-methods',
} ).lazy( () =>
	import( '../me/payment-methods' ).then( ( d ) =>
		createLazyRoute( 'payment-methods' )( {
			component: d.default,
		} )
	)
);

const taxDetailsRoute = createRoute( {
	getParentRoute: () => meRoute,
	path: 'billing/tax-details',
} ).lazy( () =>
	import( '../me/tax-details' ).then( ( d ) =>
		createLazyRoute( 'tax-details' )( {
			component: d.default,
		} )
	)
);

const securityRoute = createRoute( {
	getParentRoute: () => meRoute,
	path: 'security',
} ).lazy( () =>
	import( '../me/security' ).then( ( d ) =>
		createLazyRoute( 'security' )( {
			component: d.default,
		} )
	)
);

const privacyRoute = createRoute( {
	getParentRoute: () => meRoute,
	path: 'privacy',
} ).lazy( () =>
	import( '../me/privacy' ).then( ( d ) =>
		createLazyRoute( 'privacy' )( {
			component: d.default,
		} )
	)
);

const notificationsRoute = createRoute( {
	getParentRoute: () => meRoute,
	path: 'notifications',
} ).lazy( () =>
	import( '../me/notifications' ).then( ( d ) =>
		createLazyRoute( 'notifications' )( {
			component: d.default,
		} )
	)
);

const createRouteTree = ( config: AppConfig ) => {
	const children = [];

	children.push( indexRoute );

	if ( config.supports.overview ) {
		children.push( overviewRoute );
	}

	if ( config.supports.sites ) {
		const siteChildren: AnyRoute[] = [
			siteOverviewRoute,
			siteSettingsRoute,
			siteSettingsSiteVisibilityRoute,
			siteSettingsSubscriptionGiftingRoute,
			siteSettingsDatabaseRoute,
			siteSettingsWordPressRoute,
			siteSettingsPHPRoute,
			siteSettingsAgencyRoute,
			siteSettingsHundredYearPlanRoute,
			siteSettingsPrimaryDataCenterRoute,
			siteSettingsStaticFile404Route,
			siteSettingsCachingRoute,
			siteSettingsDefensiveModeRoute,
			siteSettingsTransferSiteRoute,
			siteSettingsSftpSshRoute,
			siteSettingsWebApplicationFirewallRoute,
		];

		if ( config.supports.sites.deployments ) {
			siteChildren.push( siteDeploymentsRoute );
		}

		if ( config.supports.sites.performance ) {
			siteChildren.push( sitePerformanceRoute );
		}

		if ( config.supports.sites.monitoring ) {
			siteChildren.push( siteMonitoringRoute );
		}

		if ( config.supports.sites.logs ) {
			siteChildren.push( siteLogsRoute );
		}

		if ( config.supports.sites.backups ) {
			siteChildren.push( siteBackupsRoute );
		}

		if ( config.supports.sites.domains ) {
			siteChildren.push( siteDomainsRoute );
		}

		if ( config.supports.sites.emails ) {
			siteChildren.push( siteEmailsRoute );
		}

		children.push( sitesRoute, siteRoute.addChildren( siteChildren ) );
	}

	if ( config.supports.domains ) {
		children.push( domainsRoute );
	}

	if ( config.supports.emails ) {
		children.push( emailsRoute );
	}

	if ( config.supports.me ) {
		children.push(
			meRoute.addChildren( [
				profileRoute,
				billingRoute,
				billingHistoryRoute,
				activeSubscriptionsRoute,
				paymentMethodsRoute,
				taxDetailsRoute,
				securityRoute,
				privacyRoute,
				notificationsRoute,
			] )
		);
	}

	return rootRoute.addChildren( children );
};

export const getRouter = ( config: AppConfig ) => {
	const routeTree = createRouteTree( config );
	return new Router( {
		routeTree,
		basepath: config.basePath,
		defaultErrorComponent: UnknownError,
		defaultNotFoundComponent: NotFound,
		defaultPreload: 'intent',
		defaultPreloadStaleTime: 0,
		// Calling document.startViewTransition() ourselves is really tricky,
		// Tanstack Router knows how to do it best. Even though it says
		// "default", we can still customize it in CSS and add more transition
		// areas.
		defaultViewTransition: true,
	} );
};

export {
	rootRoute,
	indexRoute,
	overviewRoute,
	sitesRoute,
	siteRoute,
	siteOverviewRoute,
	siteDeploymentsRoute,
	sitePerformanceRoute,
	siteMonitoringRoute,
	siteLogsRoute,
	siteBackupsRoute,
	siteDomainsRoute,
	siteEmailsRoute,
	siteSettingsRoute,
	siteSettingsSiteVisibilityRoute,
	siteSettingsSubscriptionGiftingRoute,
	siteSettingsDatabaseRoute,
	siteSettingsWordPressRoute,
	siteSettingsPHPRoute,
	siteSettingsAgencyRoute,
	siteSettingsHundredYearPlanRoute,
	siteSettingsPrimaryDataCenterRoute,
	siteSettingsStaticFile404Route,
	siteSettingsCachingRoute,
	siteSettingsDefensiveModeRoute,
	siteSettingsTransferSiteRoute,
	siteSettingsSftpSshRoute,
	siteSettingsWebApplicationFirewallRoute,
	domainsRoute,
	emailsRoute,
	meRoute,
	profileRoute,
	billingRoute,
	billingHistoryRoute,
	activeSubscriptionsRoute,
	paymentMethodsRoute,
	taxDetailsRoute,
	securityRoute,
	privacyRoute,
	notificationsRoute,
};
