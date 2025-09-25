import { translate } from 'i18n-calypso';
import * as React from 'react';
import SiteFavicon from 'calypso/blocks/site-favicon';
import { isMigrationInProgress } from 'calypso/data/site-migration';
import { navigate } from 'calypso/lib/navigate';
import { ThumbnailLink } from 'calypso/sites-dashboard/components/thumbnail-link';
import { isSitePreviewPaneEligible } from 'calypso/sites-dashboard/utils';
import { useSelector } from 'calypso/state';
import { canCurrentUser } from 'calypso/state/selectors/can-current-user';
import { useSiteAdminInterfaceData } from 'calypso/state/sites/hooks';
import type { SiteExcerptData } from '@automattic/sites';

export default function SiteIcon( {
	site,
	openSitePreviewPane,
	viewType,
	disableClick,
}: {
	site: SiteExcerptData;
	openSitePreviewPane?: (
		site: SiteExcerptData,
		source: 'site_field' | 'action' | 'list_row_click' | 'environment_switcher'
	) => void;
	viewType: 'list' | 'table' | 'grid' | 'breadcrumb' | 'pickerGrid';
	disableClick?: boolean;
} ) {
	const { adminUrl } = useSiteAdminInterfaceData( site.ID );
	const canManageOptions = useSelector( ( state ) =>
		canCurrentUser( state, site.ID, 'manage_options' )
	);

	const onClick = ( event: React.MouseEvent ) => {
		event.preventDefault();
		if ( site.is_deleted ) {
			return;
		}

		if ( isSitePreviewPaneEligible( site, canManageOptions ) ) {
			openSitePreviewPane && openSitePreviewPane( site, 'site_field' );
		} else {
			navigate( adminUrl );
		}
	};

	const isInProgress = isMigrationInProgress( site );
	const siteTitle = isInProgress ? translate( 'Incoming Migration' ) : site.title;

	const size = React.useMemo( () => {
		switch ( viewType ) {
			case 'list':
				return 52;
			case 'breadcrumb':
				return 24;
			default:
				return 32;
		}
	}, [ viewType ] );

	return (
		<ThumbnailLink
			title={ siteTitle }
			onClick={ disableClick ? undefined : onClick }
			className="sites-dataviews__site-icon"
		>
			<SiteFavicon
				className="sites-site-favicon"
				blogId={ site.ID }
				fallback={ isInProgress ? 'migration' : 'first-grapheme' }
				size={ size }
				lazy
				variant="primary"
			/>
		</ThumbnailLink>
	);
}
