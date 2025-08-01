import { useQuery } from '@tanstack/react-query';
import wpcomRequest from 'wpcom-proxy-request';

export const useScheduledUpdatesVerifyPathQuery = (
	siteId: number,
	path: string,
	queryOptions = {}
) => {
	return useQuery( {
		queryKey: [ 'verify-path', siteId, path ],
		queryFn: (): Promise< { available: boolean } > =>
			wpcomRequest( {
				path: `/sites/${ siteId }/scheduled-updates/verify-path-status?path=${ path }`,
				method: 'GET',
				apiNamespace: 'wpcom/v2',
			} ),
		enabled: !! siteId && !! path,
		retry: false,
		...queryOptions,
	} );
};
