import { translate } from 'i18n-calypso';
import { HOSTING_CLEAR_CACHE_REQUEST } from 'calypso/state/action-types';
import {
	composeAnalytics,
	recordGoogleEvent,
	recordTracksEvent,
} from 'calypso/state/analytics/actions';
import { registerHandlers } from 'calypso/state/data-layer/handler-registry';
import { http } from 'calypso/state/data-layer/wpcom-http/actions';
import { dispatchRequest } from 'calypso/state/data-layer/wpcom-http/utils';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';

export const clearObjectCacheSuccessNoticeId = 'hosting-clear-wordpress-cache';

const clearWordPressCache = ( action ) =>
	http(
		{
			method: 'POST',
			path: `/sites/${ action.siteId }/hosting/clear-cache`,
			apiNamespace: 'wpcom/v2',
			body: {
				reason: action.reason,
			},
		},
		action
	);

export const hostingClearWordPressCacheTracking = ( result ) =>
	composeAnalytics(
		recordGoogleEvent(
			'Hosting Configuration',
			'Clicked "Clear WordPress Cache" Button in Miscellaneous box',
			`Clear WordPress Cache`,
			result
		),
		recordTracksEvent( 'calypso_hosting_configuration_clear_wordpress_cache', { result } )
	);

const clearWordPressCacheSuccess = () => {
	return [
		hostingClearWordPressCacheTracking( true ),
		successNotice( translate( 'Successfully cleared object cache.' ), {
			id: clearObjectCacheSuccessNoticeId,
			duration: 5000,
		} ),
	];
};

const clearWordPressCacheError = () => {
	return [
		hostingClearWordPressCacheTracking( false ),
		errorNotice( translate( 'Failed to clear object cache.' ), {
			id: clearObjectCacheSuccessNoticeId,
		} ),
	];
};

registerHandlers( 'state/data-layer/wpcom/sites/hosting/clear-cache.js', {
	[ HOSTING_CLEAR_CACHE_REQUEST ]: [
		dispatchRequest( {
			fetch: clearWordPressCache,
			onSuccess: clearWordPressCacheSuccess,
			onError: clearWordPressCacheError,
		} ),
	],
} );
