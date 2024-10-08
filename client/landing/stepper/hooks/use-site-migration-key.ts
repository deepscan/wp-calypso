import config from '@automattic/calypso-config';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import wpcom from 'calypso/lib/wp';

interface ApiResponse {
	migration_key: string;
}

const isWhiteLabeledPluginEnabled = () => {
	return config.isEnabled( 'migration-flow/enable-white-labeled-plugin' );
};

const getMigrationKey = async ( siteId: number ): Promise< ApiResponse > => {
	if ( isWhiteLabeledPluginEnabled() ) {
		return wpcom.req.get(
			`/sites/${ siteId }/atomic-migration-status/wpcom-migration-key?http_envelope=1`,
			{
				apiNamespace: 'wpcom/v2',
			}
		);
	}

	return wpcom.req.get(
		`/sites/${ siteId }/atomic-migration-status/migrate-guru-key?http_envelope=1`,
		{
			apiNamespace: 'wpcom/v2',
		}
	);
};

type Options = {
	enabled?: UseQueryOptions[ 'enabled' ];
	retry?: UseQueryOptions[ 'retry' ];
};

export const useSiteMigrationKey = ( siteId?: number, options?: Options ) => {
	return useQuery( {
		queryKey: [ 'site-migration-key', siteId ],
		queryFn: () => getMigrationKey( siteId! ),
		retry: options?.retry ?? false,
		retryDelay: 5000,
		enabled: !! siteId && ( options?.enabled ?? true ),
		select: ( data ) => ( { migrationKey: data?.migration_key } ),
		refetchOnWindowFocus: false,
	} );
};
