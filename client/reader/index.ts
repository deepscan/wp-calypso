import config from '@automattic/calypso-config';
import page, { Context } from '@automattic/calypso-router';
import { getAnyLanguageRouteParam, getLanguageRouteParam } from '@automattic/i18n-utils';
import { addMiddleware } from 'redux-dynamic-middlewares';
import {
	makeLayout,
	redirectLoggedOut,
	redirectLoggedOutToSignup,
	render as clientRender,
	setSelectedSiteIdByOrigin,
} from 'calypso/controller';
import { RedirectRouteList, setupRedirectRoutes } from 'calypso/utils';
import {
	blogListing,
	feedDiscovery,
	feedListing,
	feedLookup,
	following,
	readA8C,
	readFollowingP2,
	redirectLoggedOutToDiscover,
	sidebar,
	blogDiscoveryByFeedId,
	siteSubscriptionsManager,
	siteSubscription,
	commentSubscriptionsManager,
	pendingSubscriptionsManager,
	setupReadRoutes,
} from './controller';
import { userProfile } from './user-profile/controller';

import './style.scss';

function forceTeamA8C( context: Context, next: () => void ): void {
	context.params.team = 'a8c';
	next();
}

export async function lazyLoadDependencies(): Promise< void > {
	const isBrowser = typeof window === 'object';
	if ( isBrowser && config.isEnabled( 'lasagna' ) && config.isEnabled( 'reader' ) ) {
		const lasagnaMiddleware = await import(
			/* webpackChunkName: "lasagnaMiddleware" */ 'calypso/state/lasagna/middleware.js'
		);
		addMiddleware( lasagnaMiddleware.default );
	}
}

export default async function (): Promise< void > {
	await lazyLoadDependencies();
	setupReadRoutes();

	if ( config.isEnabled( 'reader' ) ) {
		page(
			[ '/reader', '/reader/recent/:feed_id' ],
			redirectLoggedOutToDiscover,
			sidebar,
			setSelectedSiteIdByOrigin,
			following,
			makeLayout,
			clientRender
		);

		// Feed stream
		page(
			'/reader/feeds/:feed_id',
			blogDiscoveryByFeedId,
			redirectLoggedOutToSignup,
			sidebar,
			feedDiscovery,
			feedListing,
			makeLayout,
			clientRender
		);

		// Blog stream
		page(
			'/reader/blogs/:blog_id',
			redirectLoggedOutToSignup,
			sidebar,
			blogListing,
			makeLayout,
			clientRender
		);

		// User profile
		page(
			'/reader/users/id/:user_id',
			blogDiscoveryByFeedId,
			redirectLoggedOutToSignup,
			sidebar,
			userProfile,
			makeLayout,
			clientRender
		);

		page(
			[ '/reader/users/:user_login', '/reader/users/:user_login/:view' ],
			blogDiscoveryByFeedId,
			redirectLoggedOutToSignup,
			sidebar,
			userProfile,
			makeLayout,
			clientRender
		);

		page( '/reader/feeds/lookup/*', redirectLoggedOutToSignup, feedLookup );

		setupReaderRedirects();
	}

	// Automattic Employee Posts
	page(
		'/reader/a8c',
		redirectLoggedOut,
		sidebar,
		forceTeamA8C,
		readA8C,
		makeLayout,
		clientRender
	);

	// new P2 Posts
	page( '/reader/p2', redirectLoggedOut, sidebar, readFollowingP2, makeLayout, clientRender );

	// Sites subscription management
	page(
		'/reader/subscriptions',
		redirectLoggedOut,
		sidebar,
		siteSubscriptionsManager,
		makeLayout,
		clientRender
	);
	page(
		'/reader/subscriptions/comments',
		redirectLoggedOut,
		sidebar,
		commentSubscriptionsManager,
		makeLayout,
		clientRender
	);
	page(
		'/reader/subscriptions/pending',
		redirectLoggedOut,
		sidebar,
		pendingSubscriptionsManager,
		makeLayout,
		clientRender
	);
	page(
		'/reader/subscriptions/:subscription_id',
		redirectLoggedOut,
		sidebar,
		siteSubscription,
		makeLayout,
		clientRender
	);
	page(
		'/reader/site/subscription/:blog_id',
		redirectLoggedOut,
		sidebar,
		siteSubscription,
		makeLayout,
		clientRender
	);
}

/**
 * Setup redirects for the reader routes.
 */
function setupReaderRedirects(): void {
	const langParam = getLanguageRouteParam();
	const anyLangParam = getAnyLanguageRouteParam();

	const readerRedirectsList: RedirectRouteList[] = [
		{
			path: `/${ langParam }/reader`,
			getRedirect: () => '/reader',
		},
		{
			path: `/${ anyLangParam }/reader`,
			getRedirect: () => '/reader',
		},
		// Incomplete paths that should be redirected to `/reader`
		{
			path: '/reader/following',
			getRedirect: () => '/reader',
		},
		{
			path: '/reader/blogs',
			getRedirect: () => '/reader',
		},
		{
			path: '/reader/feeds',
			getRedirect: () => '/reader',
		},
		{
			path: '/reader/blog',
			getRedirect: () => '/reader',
		},
		{
			path: '/reader/post',
			getRedirect: () => '/reader',
		},
		{
			path: '/reader/feed',
			getRedirect: () => '/reader',
		},
		// Feed stream
		{
			path: '/reader/feeds/:feed_id/posts',
			regex: /^\/reader\/feeds\/([0-9]+)\/posts$/i,
			getRedirect: ( params?: Record< string, string > ) => `/reader/feeds/${ params?.feed_id }`,
		},
		// Blog stream
		{
			path: '/reader/blogs/:blog_id/posts',
			regex: /^\/reader\/blogs\/([0-9]+)\/posts$/i,
			getRedirect: ( params?: Record< string, string > ) => `/reader/blogs/${ params?.blog_id }`,
		},
	];

	setupRedirectRoutes( readerRedirectsList );
}
