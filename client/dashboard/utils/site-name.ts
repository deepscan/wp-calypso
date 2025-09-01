import { __ } from '@wordpress/i18n';
import { getSiteStatus } from './site-status';
import { getSiteDisplayUrl } from './site-url';
import type { Site } from '@automattic/api-core';

export function getSiteDisplayName( site: Site ) {
	const status = getSiteStatus( site );
	if ( status === 'migration_pending' || status === 'migration_started' ) {
		return __( 'Incoming Migration' );
	}
	return site.name || getSiteDisplayUrl( site );
}
