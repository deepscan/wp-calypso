import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import wp from 'calypso/lib/wp';

export const USE_STAGING_SITE_QUERY_KEY = 'staging-site';

export interface StagingSite {
	id: number;
	name: string;
	url: string;
	user_has_permission: boolean;
}

type StagingSiteOptions = Pick< UseQueryOptions< StagingSite[] >, 'enabled' >;

export const useStagingSite = ( siteId: number, options?: StagingSiteOptions ) => {
	return useQuery( {
		queryKey: [ USE_STAGING_SITE_QUERY_KEY, siteId ],
		queryFn: (): Promise< StagingSite[] > =>
			wp.req.get( {
				path: `/sites/${ siteId }/staging-site`,
				apiNamespace: 'wpcom/v2',
			} ),
		enabled: !! siteId && ( options?.enabled ?? true ),
		meta: {
			persist: false,
		},
		staleTime: 10 * 1000,
	} );
};
