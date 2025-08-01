import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import wp from 'calypso/lib/wp';

export const USE_STAGING_SITE_LOCK_QUERY_KEY = 'staging-site-lock';
export const useGetLockQuery = (
	siteId: number,
	options?: Omit<
		UseQueryOptions< boolean | null, unknown, boolean, ( string | number )[] >,
		'queryKey' | 'queryFn'
	>
) => {
	return useQuery( {
		queryKey: [ USE_STAGING_SITE_LOCK_QUERY_KEY, siteId ],
		queryFn: (): boolean | null =>
			wp.req.get( {
				path: `/sites/${ siteId }/staging-site/lock`,
				apiNamespace: 'wpcom/v2',
			} ),
		enabled: !! siteId,
		refetchInterval: options?.refetchInterval ?? false,
		meta: {
			persist: false,
		},
		staleTime: 10 * 1000,
	} );
};
