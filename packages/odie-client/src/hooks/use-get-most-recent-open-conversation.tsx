import { HelpCenterSelect } from '@automattic/data-stores';
import { HELP_CENTER_STORE } from '@automattic/help-center/src/stores';
import { useGetSupportInteractions } from '@automattic/odie-client/src/data';
import { useSelect } from '@wordpress/data';
import Smooch from 'smooch';

export const useGetMostRecentOpenConversation = () => {
	let mostRecentSupportInteractionId = null;
	let totalNumberOfConversations = 0;

	const { isChatLoaded } = useSelect(
		( select ) => ( {
			isChatLoaded: ( select( HELP_CENTER_STORE ) as HelpCenterSelect ).getIsChatLoaded(),
		} ),
		[]
	);

	const { data: supportInteractions, isLoading } = useGetSupportInteractions( 'zendesk' );

	if ( supportInteractions?.length && isChatLoaded && ! isLoading ) {
		const allConversations = Smooch?.getConversations?.() ?? [];

		const filteredConversations = allConversations.filter( ( conversation ) =>
			supportInteractions.some(
				( interaction ) => interaction.uuid === conversation.metadata?.supportInteractionId
			)
		);

		const sortedConversations = filteredConversations.sort( ( conversationA, conversationB ) => {
			const aCreatedAt = conversationA?.metadata?.createdAt;
			const bCreatedAt = conversationB?.metadata?.createdAt;
			if (
				aCreatedAt &&
				bCreatedAt &&
				typeof aCreatedAt === 'number' &&
				typeof bCreatedAt === 'number'
			) {
				return new Date( bCreatedAt ).getTime() - new Date( aCreatedAt ).getTime();
			}
			return 0;
		} );

		if ( sortedConversations?.length > 0 ) {
			mostRecentSupportInteractionId = sortedConversations[ 0 ]?.metadata?.supportInteractionId;
			totalNumberOfConversations = sortedConversations.length;
		}
	}
	return { mostRecentSupportInteractionId, totalNumberOfConversations };
};
