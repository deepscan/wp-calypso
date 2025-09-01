import { siteAgencyBlogQuery, siteSettingsQuery } from '@automattic/api-queries';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { home } from '@wordpress/icons';
import RouterLinkSummaryButton from '../../components/router-link-summary-button';
import type { Site } from '@automattic/api-core';
import type { Density } from '@automattic/components/src/summary-button/types';

export default function AgencySettingsSummary( {
	site,
	density,
}: {
	site: Site;
	density?: Density;
} ) {
	const { data: siteSettings } = useQuery( siteSettingsQuery( site.ID ) );
	const { data: agencyBlog } = useQuery( {
		...siteAgencyBlogQuery( site.ID ),
		enabled: site.is_wpcom_atomic,
	} );

	if ( ! agencyBlog ) {
		return null;
	}

	const isWpcomFeaturesDisabled =
		siteSettings?.is_fully_managed_agency_site || site.is_a4a_dev_site;

	return (
		<RouterLinkSummaryButton
			to={ `/sites/${ site.slug }/settings/agency` }
			title={ __( 'Agency settings' ) }
			density={ density }
			decoration={ <Icon icon={ home } /> }
			badges={ [
				isWpcomFeaturesDisabled
					? {
							text: __( 'WordPress.com features disabled' ),
					  }
					: {
							text: __( 'WordPress.com features enabled' ),
							intent: 'info',
					  },
			] }
		/>
	);
}
