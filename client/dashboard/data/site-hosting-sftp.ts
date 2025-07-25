import wpcom from 'calypso/lib/wp';

export interface SftpUser {
	username: string;
	password: string;
}

export async function fetchSftpUsers( siteId: number ): Promise< SftpUser[] > {
	const { users } = await wpcom.req.get( {
		path: `/sites/${ siteId }/hosting/ssh-users`,
		apiNamespace: 'wpcom/v2',
	} );

	return users.map( ( username: string ) => ( {
		username,
	} ) );
}

export async function createSftpUser( siteId: number ): Promise< SftpUser > {
	return wpcom.req.post( {
		path: `/sites/${ siteId }/hosting/ssh-user`,
		apiNamespace: 'wpcom/v2',
	} );
}

export async function resetSftpPassword(
	siteId: number,
	sshUsername: string
): Promise< SftpUser > {
	return wpcom.req.post( {
		path: `/sites/${ siteId }/hosting/ssh-user/${ sshUsername }/reset-password`,
		apiNamespace: 'wpcom/v2',
	} );
}
