import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import wpcomRequest from 'wpcom-proxy-request';
import { useSiteSlugParam } from 'calypso/landing/stepper/hooks/use-site-slug-param';
import { ApiError, CredentialsFormData } from '../types';

interface AutomatedMigrationAPIResponse {
	success: boolean;
}

interface AutomatedMigrationBody {
	migration_type: 'credentials' | 'backup';
	blog_url: string;
	from_url?: string;
	username?: string;
	password?: string;
	backup_file_location?: string;
	notes?: string;
	bypass_verification?: boolean;
}

export const useSiteMigrationCredentialsMutation = <
	TData = AutomatedMigrationAPIResponse,
	TError = ApiError,
>(
	options: UseMutationOptions< TData, TError, CredentialsFormData > = {}
) => {
	const siteSlug = useSiteSlugParam();

	return useMutation< TData, TError, CredentialsFormData >( {
		mutationFn: ( {
			from_url,
			username,
			password,
			notes,
			migrationType,
			backupFileLocation,
			bypassVerification,
		}: CredentialsFormData ) => {
			let body: AutomatedMigrationBody = {
				migration_type: migrationType,
				blog_url: siteSlug ?? '',
				notes,
			};

			if ( migrationType === 'credentials' ) {
				body = {
					...body,
					from_url,
					username,
					password,
					bypass_verification: bypassVerification,
				};
			} else {
				// In case of backup, we need to send the backup file location.
				body = {
					...body,
					from_url: backupFileLocation,
				};
			}

			return wpcomRequest( {
				path: `sites/${ siteSlug }/automated-migration`,
				apiNamespace: 'wpcom/v2/',
				apiVersion: '2',
				method: 'POST',
				body,
			} );
		},
		...options,
	} );
};
