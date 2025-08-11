import { isWpComPersonalPlan, isWpComPremiumPlan } from '@automattic/calypso-products';
import page from '@automattic/calypso-router';
import titlecase from 'to-title-case';
import { recordPageView } from 'calypso/lib/analytics/page-view';
import { navigate } from 'calypso/lib/navigate';
import { sectionify } from 'calypso/lib/route';
import { canCurrentUser } from 'calypso/state/selectors/can-current-user';
import isSiteWpcomAtomic from 'calypso/state/selectors/is-site-wpcom-atomic';
import { getSiteOption, getSiteUrl } from 'calypso/state/sites/selectors';
import getSitePlan from 'calypso/state/sites/selectors/get-site-plan';
import { getSelectedSite, getSelectedSiteId } from 'calypso/state/ui/selectors';

export function redirectToJetpackNewsletterSettingsIfNeeded( context, next ) {
	const state = context.store.getState();
	const siteId = getSelectedSiteId( state );
	const siteUrl = getSiteUrl( state, siteId );

	const isAtomic = isSiteWpcomAtomic( state, siteId );
	const hasClassicAdminInterfaceStyle =
		getSiteOption( state, siteId, 'wpcom_admin_interface' ) === 'wp-admin';

	// Check if site has Personal or Premium plan
	const sitePlan = getSitePlan( state, siteId );
	const isPersonalOrPremiumPlan =
		sitePlan &&
		( isWpComPersonalPlan( sitePlan.product_slug ) || isWpComPremiumPlan( sitePlan.product_slug ) );

	// Only redirect if it's atomic with classic admin interface AND not Personal/Premium plan
	if ( hasClassicAdminInterfaceStyle && isAtomic && ! isPersonalOrPremiumPlan ) {
		navigate( `${ siteUrl }/wp-admin/admin.php?page=jetpack#/newsletter` );
		return;
	}

	next();
}

/**
 * Redirects to the general settings page when Remove Duplicate Views experiment is enabled.
 * Example: /settings/start-site-transfer/:site -> /sites/settings/site/${ context.params.site }/transfer-site
 * @param {*} context
 * @param {*} next
 * @returns
 */
export const redirectToolsIfRemoveDuplicateViewsExperimentEnabled = async ( context, next ) => {
	const slug = context.path.split( '/' )[ 2 ];
	if ( ! slug ) {
		return next();
	}
	const URL_MAP = {
		'delete-site': 'delete-site',
		'start-over': 'reset-site',
		'start-site-transfer': 'transfer-site',
	};
	if ( ! URL_MAP[ slug ] ) {
		return next();
	}

	const queryParams = context.querystring ? `?${ context.querystring }` : '';
	return page.redirect(
		`/sites/settings/site/${ context.params.site_id }/${ URL_MAP[ slug ] }${ queryParams }`
	);
};

/**
 * Redirect /settings to /sites/settings/site when the Remove Duplicate Views experiment is enabled.
 *
 * Previously /settings redirected to /settings/general which now redirects to /wp-admin/options-general.php
 *
 * This is to maintain previous behavior by providing HE's with a consistent location, `/settings`, to link
 * to for visibility and site launching options.
 *
 * When the experiment is over:
 * - /settings can always redirect to /sites/settings/site
 * - /settings/general can always redirect to /wp-admin/options-general.php
 */
export const redirectSettingsIfDuplciatedViewsEnabled = async () => {
	return page.redirect( `/sites/settings/site` );
};

export async function siteSettings( context, next ) {
	let analyticsPageTitle = 'Site Settings';
	const basePath = sectionify( context.path );
	const section = sectionify( context.path ).split( '/' )[ 2 ];
	const state = context.store.getState();
	const site = getSelectedSite( state );
	const siteId = getSelectedSiteId( state );
	const canManageOptions = canCurrentUser( state, siteId, 'manage_options' );

	// if site loaded, but user cannot manage site, redirect
	if ( site && ! canManageOptions ) {
		page.redirect( '/stats' );
		return;
	}

	// analytics tracking
	if ( 'undefined' !== typeof section ) {
		analyticsPageTitle += ' > ' + titlecase( section );
	}
	recordPageView( basePath + '/:site', analyticsPageTitle );

	next();
}

export function setScroll( context, next ) {
	window.scroll( 0, 0 );
	next();
}
