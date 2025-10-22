import { domainsQuery, siteBySlugQuery, siteRedirectQuery } from '@automattic/api-queries';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import { useAuth } from '../../app/auth';
import { siteRoute, siteSettingsRedirectRoute } from '../../app/router/sites';
import { DataViewsCard } from '../../components/dataviews-card';
import { Notice } from '../../components/notice';
import { PageHeader } from '../../components/page-header';
import PageLayout from '../../components/page-layout';
import { AddDomainButton } from '../../domains/add-domain-button';
import { useActions, useFields, DEFAULT_LAYOUTS, SITE_CONTEXT_VIEW } from '../../domains/dataviews';
import PrimaryDomainSelector from './primary-domain-selector';
import type { DomainsView } from '../../domains/dataviews';
import type { DomainSummary } from '@automattic/api-core';

function getDomainId( domain: DomainSummary ) {
	return `${ domain.domain }-${ domain.blog_id }`;
}

function SiteDomains() {
	const { siteSlug } = siteRoute.useParams();
	const { user } = useAuth();
	const { data: site } = useSuspenseQuery( siteBySlugQuery( siteSlug ) );
	const { data: siteDomains, isLoading } = useQuery( {
		...domainsQuery(),
		select: ( data ) => {
			return data.filter( ( domain ) => domain.blog_id === site.ID );
		},
	} );
	const { data: redirect, isLoading: isRedirectLoading } = useQuery( siteRedirectQuery( site.ID ) );
	const hasRedirect = redirect && Object.keys( redirect ).length > 0;

	const fields = useFields( {
		site,
	} );

	const actions = useActions( { user, sites: [ site ] } );

	const [ view, setView ] = useState< DomainsView >( () => ( {
		...SITE_CONTEXT_VIEW,
		type: 'table',
	} ) );

	const { data: filteredData, paginationInfo } = filterSortAndPaginate(
		siteDomains ?? [],
		view,
		fields
	);

	return (
		<PageLayout
			header={
				<PageHeader
					title={ __( 'Domains' ) }
					actions={ <AddDomainButton siteSlug={ site.slug } /> }
				/>
			}
		>
			{ ! isLoading && ! isRedirectLoading && siteDomains && ! hasRedirect && (
				<PrimaryDomainSelector domains={ siteDomains } site={ site } user={ user } />
			) }
			{ hasRedirect && (
				<Notice variant="warning">
					{ createInterpolateElement(
						__(
							'This site <site/> and all domains attached to it will redirect to <redirect/>. If you want to change that <link>click here</link>.'
						),
						{
							site: <b>{ site.slug }</b>,
							redirect: <b>{ redirect.location }</b>,
							link: (
								<Link
									to={ siteSettingsRedirectRoute.fullPath }
									params={ { siteSlug: site.slug } }
								/>
							),
						}
					) }
				</Notice>
			) }
			<DataViewsCard>
				<DataViews< DomainSummary >
					data={ filteredData || [] }
					fields={ fields }
					onChangeView={ ( nextView ) => setView( () => nextView as DomainsView ) }
					view={ view }
					actions={ actions }
					search
					paginationInfo={ paginationInfo }
					getItemId={ getDomainId }
					isLoading={ isLoading }
					defaultLayouts={ DEFAULT_LAYOUTS }
				/>
			</DataViewsCard>
		</PageLayout>
	);
}

export default SiteDomains;
