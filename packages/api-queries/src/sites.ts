import { fetchSites, SITE_FIELDS, SITE_OPTIONS } from '@automattic/api-core';
import { queryOptions } from '@tanstack/react-query';
import type { FetchSitesFilters, FetchSitesOptions } from '@automattic/api-core';

export const sitesQueryKey = [ 'sites', SITE_FIELDS, SITE_OPTIONS ];

export const sitesQuery = (
	siteFilters: FetchSitesFilters,
	fetchSitesOptions: FetchSitesOptions = { site_visibility: 'visible', include_a8c_owned: false }
) =>
	queryOptions( {
		queryKey: [ ...sitesQueryKey, siteFilters, fetchSitesOptions ],
		queryFn: () => fetchSites( siteFilters, fetchSitesOptions ),
	} );
