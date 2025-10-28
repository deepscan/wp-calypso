/* eslint-disable no-restricted-imports */
import { HelpCenterSelect } from '@automattic/data-stores';
import { useGetOdieConversations } from '@automattic/odie-client/src/data/use-get-odie-conversations';
import { useGetSupportInteractions } from '@automattic/odie-client/src/data/use-get-support-interactions';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import {
	filterAndUpdateConversationsWithStatus,
	getLastMessage,
	getZendeskConversations,
} from '../components/utils';
import { HELP_CENTER_STORE } from '../stores';
import type {
	Conversations,
	OdieConversation,
	SupportInteraction,
	ZendeskConversation,
} from '@automattic/odie-client';

interface UseGetHistoryChatsResult {
	supportInteractions: SupportInteraction[];
	isLoadingInteractions: boolean;
	recentConversations: Conversations;
	archivedConversations: Conversations;
}

/**
 * Retrieves the date when the last message from the specified conversation was received.
 * @returns The timestamp in milliseconds (e.g. 1745936539027), or 0 if not available
 */
const getLastMessageReceived = ( conversation: OdieConversation | ZendeskConversation ) => {
	// For Zendesk conversations, use lastUpdatedAt directly
	if ( 'lastUpdatedAt' in conversation ) {
		return ( conversation.lastUpdatedAt || 0 ) * 1000;
	}

	// For Odie conversations, get the last message timestamp
	const lastMessage = getLastMessage( { conversation } );
	return ( lastMessage?.received || 0 ) * 1000;
};

/**
 * Returns Odie conversations that do not have any corresponding Zendesk support interaction.
 * Updates the Odie conversations with the support interaction id and status.
 */
const getAndUpdateOdieConversationsWithSupportInteractions = (
	odieConversations: OdieConversation[] = [],
	odieSupportInteractions: SupportInteraction[]
): OdieConversation[] => {
	const odieSupportInteractionsWithoutZendesk = odieSupportInteractions.filter(
		( interaction ) => ! interaction.events?.some( ( event ) => event.event_source === 'zendesk' )
	);

	const eventExternalIds = new Set(
		odieSupportInteractionsWithoutZendesk
			.flatMap( ( interaction ) => interaction.events || [] )
			.filter( ( event ) => event.event_source === 'odie' )
			.map( ( event ) => event.event_external_id )
	);

	const odieConversationsWithoutZendesk = odieConversations.filter( ( conversation ) =>
		eventExternalIds.has( conversation.id )
	);

	return odieConversationsWithoutZendesk.map( ( conversation ) => {
		const supportInteraction = odieSupportInteractions.find( ( interaction ) =>
			interaction.events.some(
				( event ) => event.event_source === 'odie' && event.event_external_id === conversation.id
			)
		);

		return {
			...conversation,
			metadata: {
				supportInteractionId: supportInteraction?.uuid || '',
				status: supportInteraction?.status || 'open',
				odieChatId: parseInt( conversation.id ),
				createdAt: supportInteraction?.start_date ? Date.parse( supportInteraction.start_date ) : 0,
			},
		};
	} );
};

/**
 * Checks whether the last message from the specified conversation is not empty nor a predefined '--' token.
 * Zendesk conversations are always considered valid.
 */
const isValidLastMessageContent = ( conversation: OdieConversation | ZendeskConversation ) => {
	// Skip validation for Zendesk conversations
	if ( 'lastUpdatedAt' in conversation ) {
		return true;
	}

	const lastMessage = getLastMessage( { conversation } );

	if ( ! lastMessage || lastMessage?.text === null || lastMessage?.text === undefined ) {
		return false;
	}

	// '--' is a token returned for Odie conversations that should be forwarded to human support
	return ! [ '', '--' ].includes( lastMessage.text.trim() );
};

/**
 * Splits conversations into recent and archived based on whether the last message was received within the past year.
 */
const splitConversationsByRecency = (
	conversations: ( OdieConversation | ZendeskConversation )[]
): { recent: Conversations; archived: Conversations } => {
	const oneYearAgoDate = new Date();
	oneYearAgoDate.setFullYear( oneYearAgoDate.getFullYear() - 1 );
	const oneYearAgo = oneYearAgoDate.getTime();

	const recent: Conversations = [];
	const archived: Conversations = [];

	conversations.forEach( ( conversation ) => {
		if ( getLastMessageReceived( conversation ) < oneYearAgo ) {
			archived.push( conversation );
		} else {
			recent.push( conversation );
		}
	} );

	return { recent, archived };
};

export const useGetHistoryChats = (): UseGetHistoryChatsResult => {
	const [ recentConversations, setRecentConversations ] = useState< Conversations >( [] );
	const [ archivedConversations, setArchivedConversations ] = useState< Conversations >( [] );

	const { isChatLoaded } = useSelect( ( select ) => {
		const store = select( HELP_CENTER_STORE ) as HelpCenterSelect;

		return {
			isChatLoaded: store.getIsChatLoaded(),
		};
	}, [] );

	const { data: otherSupportInteractions, isLoading: isLoadingOtherSupportInteractions } =
		useGetSupportInteractions( 'zendesk' );
	const { data: odieSupportInteractions, isLoading: isLoadingOdieSupportInteractions } =
		useGetSupportInteractions( 'odie' );
	const { data: odieConversations, isLoading: isLoadingOdieConversations } =
		useGetOdieConversations();

	const isLoadingInteractions =
		isLoadingOtherSupportInteractions ||
		isLoadingOdieSupportInteractions ||
		isLoadingOdieConversations;

	const supportInteractions: SupportInteraction[] = useMemo(
		() => [ ...( odieSupportInteractions || [] ), ...( otherSupportInteractions || [] ) ],
		[ odieSupportInteractions, otherSupportInteractions ]
	);

	useEffect( () => {
		if ( isLoadingInteractions ) {
			return;
		}

		const zendeskConversations = isChatLoaded ? getZendeskConversations() : [];

		// Merge Zendesk and Odie conversations, remove the ones with an invalid message, then sort them by recency
		const conversations = [
			...filterAndUpdateConversationsWithStatus( zendeskConversations, supportInteractions ),
			...getAndUpdateOdieConversationsWithSupportInteractions(
				odieConversations,
				odieSupportInteractions || []
			),
		]
			.filter( ( conversation ) => isValidLastMessageContent( conversation ) )
			.sort( ( a, b ) => getLastMessageReceived( b ) - getLastMessageReceived( a ) );

		const { recent, archived } = splitConversationsByRecency( conversations );
		setRecentConversations( recent );
		setArchivedConversations( archived );
	}, [
		isChatLoaded,
		isLoadingInteractions,
		odieSupportInteractions,
		otherSupportInteractions,
		odieConversations,
		supportInteractions,
	] );

	return {
		isLoadingInteractions,
		recentConversations,
		archivedConversations,
		supportInteractions,
	};
};
