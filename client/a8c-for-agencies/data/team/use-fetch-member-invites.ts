import { UseQueryResult, useQuery } from '@tanstack/react-query';
import wpcom from 'calypso/lib/wp';
import { useSelector } from 'calypso/state';
import { getActiveAgencyId } from 'calypso/state/a8c-for-agencies/agency/selectors';

type MemberInvite = {
	id: number;
	email: string;
	status: string;
	expiresAt: number;
	createdAt: number;
	avatar?: string;
	displayName?: string;
};

type MemberInviteAPIResponse = {
	id: number;
	email: string;
	status: string;
	expires_at: string;
	created_at: string;
	avatar_url?: string;
	username?: string;
};

export default function useFetchMemberInvites(): UseQueryResult< MemberInvite[], unknown > {
	const agencyId = useSelector( getActiveAgencyId );

	return useQuery( {
		queryKey: [ 'a4a-member-invites', agencyId ],
		queryFn: () =>
			wpcom.req.get( {
				apiNamespace: 'wpcom/v2',
				path: `/agency/${ agencyId }/user-invites`,
			} ),
		select: ( data ) => {
			return data?.map( ( invite: MemberInviteAPIResponse ) => ( {
				id: invite.id,
				email: invite.email,
				status: invite.status,
				expiresAt: new Date( invite.expires_at ),
				createdAt: new Date( invite.created_at ),
				avatar: invite.avatar_url,
				displayName: invite.username,
			} ) );
		},
		enabled: !! agencyId,
	} );
}
