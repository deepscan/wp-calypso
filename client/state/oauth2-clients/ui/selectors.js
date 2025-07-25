import { getOAuth2Client } from 'calypso/state/oauth2-clients/selectors';

import 'calypso/state/oauth2-clients/init';

/**
 * Returns the ID of the current OAuth2 client.
 * @param  {Object}  state  Global state tree
 * @returns {?number}        Current OAuth2 client ID
 */
export function getCurrentOAuth2ClientId( state ) {
	return state.oauth2Clients?.ui.currentClientId;
}

/**
 * Gets the OAuth2 client data.
 * @param  {Object}   state  Global state tree
 * @returns {{ title: string; icon: string; name: string; } | null} OAuth2 client data
 */
export const getCurrentOAuth2Client = ( state ) => {
	const currentClientId = getCurrentOAuth2ClientId( state );

	if ( ! currentClientId ) {
		return null;
	}

	return getOAuth2Client( state, currentClientId );
};

/**
 * Determines if the OAuth2 layout should be used.
 * @param  {Object}   state  Global state tree
 * @returns {boolean}         Whether the OAuth2 layout should be used.
 */
export const showOAuth2Layout = ( state ) => !! getCurrentOAuth2ClientId( state );
