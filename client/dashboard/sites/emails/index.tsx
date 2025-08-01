import { useQuery } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { siteBySlugQuery } from '../../app/queries/site';
import { siteRoute } from '../../app/router';
import { PageHeader } from '../../components/page-header';
import PageLayout from '../../components/page-layout';

function SiteEmails() {
	const { siteSlug } = siteRoute.useParams();
	const { data: site } = useQuery( siteBySlugQuery( siteSlug ) );

	if ( ! site ) {
		return;
	}

	return <PageLayout header={ <PageHeader title={ __( 'Emails' ) } /> }>TBD</PageLayout>;
}

export default SiteEmails;
