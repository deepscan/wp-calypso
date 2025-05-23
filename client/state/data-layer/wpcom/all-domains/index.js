import { translate } from 'i18n-calypso';
import { ALL_DOMAINS_REQUEST } from 'calypso/state/action-types';
import {
	getAllDomainsRequestFailure,
	getAllDomainsRequestSuccess,
} from 'calypso/state/all-domains/actions';
import { registerHandlers } from 'calypso/state/data-layer/handler-registry';
import { http } from 'calypso/state/data-layer/wpcom-http/actions';
import { dispatchRequest } from 'calypso/state/data-layer/wpcom-http/utils';
import { errorNotice } from 'calypso/state/notices/actions';

export const getAllDomains = ( action ) => {
	return http( { path: '/all-domains', method: 'GET' }, action );
};

export const getAllDomainsError = ( action, error ) => {
	return [
		errorNotice( translate( 'Failed to retrieve all domains' ) ),
		getAllDomainsRequestFailure( error ),
	];
};

export const getAllDomainsSuccess = ( action, response ) => {
	if ( response ) {
		return getAllDomainsRequestSuccess( response.domains );
	}
	return getAllDomainsError( action, 'Failed to retrieve your domains. No response was received' );
};

registerHandlers( 'state/data-layer/wpcom/all-domains/index.js', {
	[ ALL_DOMAINS_REQUEST ]: [
		dispatchRequest( {
			fetch: getAllDomains,
			onSuccess: getAllDomainsSuccess,
			onError: getAllDomainsError,
		} ),
	],
} );
