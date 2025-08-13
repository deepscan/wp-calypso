import { recordTracksEvent } from '@automattic/calypso-analytics';
import { useResetSupportInteraction } from '@automattic/help-center/src/hooks/use-reset-support-interaction';
import { HELP_CENTER_STORE } from '@automattic/help-center/src/stores';
import { useSelect } from '@wordpress/data';
import { createContext, useCallback, useContext, useState } from 'react';
import { useOdieBroadcastWithCallbacks } from '../data';
import { useGetCombinedChat } from '../hooks';
import { isOdieAllowedBot, getIsRequestingHumanSupport } from '../utils';
import type {
	Chat,
	Message,
	OdieAllowedBots,
	ChatStatus,
	OdieAssistantContextInterface,
	OdieAssistantProviderProps,
} from '../types';
import type { HelpCenterSelect } from '@automattic/data-stores';

const noop = () => {};

export const emptyChat: Chat = {
	supportInteractionId: null,
	odieId: null,
	conversationId: null,
	messages: [],
	wpcomUserId: null,
	provider: 'odie',
	status: 'loading',
};

// Create a default new context
export const OdieAssistantContext = createContext< OdieAssistantContextInterface >( {
	addMessage: noop,
	botName: 'Wapuu',
	botNameSlug: 'wpcom-support-chat' as OdieAllowedBots,
	chat: emptyChat,
	canConnectToZendesk: false,
	isLoadingCanConnectToZendesk: false,
	clearChat: noop,
	currentUser: { display_name: 'Me' },
	experimentVariationName: null,
	hasUserEverEscalatedToHumanSupport: false,
	isChatLoaded: false,
	isMinimized: false,
	isUserEligibleForPaidSupport: false,
	odieBroadcastClientId: '',
	setChat: noop,
	setChatStatus: noop,
	setExperimentVariationName: noop,
	setMessageLikedStatus: noop,
	trackEvent: noop,
	forceEmailSupport: false,
	setNotice: noop,
	notices: {},
	sectionName: '',
} );

// Custom hook to access the OdieAssistantContext
export const useOdieAssistantContext = () => useContext( OdieAssistantContext );

// Generate random client id
export const odieBroadcastClientId = Math.random().toString( 36 ).substring( 2, 15 );

/**
 * Provider for the Odie Assistant context.
 */
export const OdieAssistantProvider: React.FC< OdieAssistantProviderProps > = ( {
	botName = 'Wapuu assistant',
	isUserEligibleForPaidSupport = true,
	canConnectToZendesk = false,
	isLoadingCanConnectToZendesk = false,
	selectedSiteId,
	selectedSiteURL,
	userFieldMessage,
	userFieldFlowName,
	version = null,
	currentUser,
	forceEmailSupport = false,
	children,
	sectionName,
} ) => {
	const { botNameSlug, isMinimized, isChatLoaded } = useSelect( ( select ) => {
		const store = select( HELP_CENTER_STORE ) as HelpCenterSelect;

		const odieBotNameSlug = isOdieAllowedBot( store.getOdieBotNameSlug() )
			? store.getOdieBotNameSlug()
			: 'wpcom-support-chat';

		return {
			botNameSlug: odieBotNameSlug as OdieAllowedBots,
			isMinimized: store.getIsMinimized(),
			isChatLoaded: store.getIsChatLoaded(),
		};
	}, [] );

	const [ experimentVariationName, setExperimentVariationName ] = useState<
		string | null | undefined
	>( null );

	/**
	 * The main chat thread.
	 * This is where we manage the state of the chat.
	 */
	const { mainChatState, setMainChatState } = useGetCombinedChat(
		isUserEligibleForPaidSupport && canConnectToZendesk,
		isLoadingCanConnectToZendesk
	);

	const [ notices, setNotices ] = useState< Record< string, string | React.ReactNode > >( {} );

	/**
	 * Has the user ever escalated to get human support?
	 */
	const hasUserEverEscalatedToHumanSupport = mainChatState?.messages.some( ( message ) =>
		getIsRequestingHumanSupport( message )
	);

	/**
	 * Tracking event.
	 * Handler to make sure all requests are the same.
	 */
	const trackEvent = useCallback(
		( eventName: string, properties: Record< string, unknown > = {} ) => {
			recordTracksEvent( `calypso_odie_${ eventName }`, {
				...properties,
				chat_id: mainChatState?.odieId,
				bot_name_slug: botNameSlug,
			} );
		},
		[ botNameSlug, mainChatState ]
	);

	/**
	 * Reset the support interaction and clear the chat.
	 */
	const resetSupportInteraction = useResetSupportInteraction();
	const clearChat = useCallback( () => {
		trackEvent( 'chat_cleared', {} );
		setMainChatState( emptyChat );
		resetSupportInteraction();
	}, [ trackEvent, resetSupportInteraction, setMainChatState ] );

	/**
	 * Add a new message to the chat.
	 */
	const addMessage = ( message: Message | Message[] ) => {
		setMainChatState( ( prevChat ) => ( {
			...prevChat,
			messages: [ ...prevChat.messages, ...( Array.isArray( message ) ? message : [ message ] ) ],
		} ) );
	};

	/**
	 * Set the status of the chat.
	 */
	const setChatStatus = ( status: ChatStatus ) => {
		setMainChatState( ( prevChat ) => ( { ...prevChat, status } ) );
	};

	/**
	 * Set the liked status of a message.
	 */
	const setMessageLikedStatus = ( message: Message, liked: boolean ) => {
		setMainChatState( ( prevChat ) => {
			const messageIndex = prevChat.messages.findIndex( ( m ) => m === message );
			const updatedMessage = { ...message, liked };
			return {
				...prevChat,
				messages: [
					...prevChat.messages.slice( 0, messageIndex ),
					updatedMessage,
					...prevChat.messages.slice( messageIndex + 1 ),
				],
			};
		} );
	};

	useOdieBroadcastWithCallbacks( { addMessage }, odieBroadcastClientId );
	/**
	 * Set a notice with a specific ID.
	 * If noticeText is null, the notice with the given ID will be removed.
	 */
	const setNotice = useCallback(
		( noticeId: string, content: string | React.ReactNode | null ) => {
			setNotices( ( prevNotices ) => {
				if ( content === null ) {
					// Remove the notice if content is null
					const newNotices = { ...prevNotices };
					delete newNotices[ noticeId ];
					return newNotices;
				}

				// Add or update the notice
				return {
					...prevNotices,
					[ noticeId ]: content,
				};
			} );
		},
		[ setNotices ]
	);

	/**
	 * Version for Odie API.
	 * Set this query param to override the version in the request.
	 */
	const urlSearchParams = new URLSearchParams( window.location.search );
	const versionParams = urlSearchParams.get( 'version' );
	const overriddenVersion = versionParams || version;

	return (
		<OdieAssistantContext.Provider
			value={ {
				addMessage,
				sectionName,
				botName,
				botNameSlug,
				chat: mainChatState,
				setChat: setMainChatState,
				clearChat,
				currentUser,
				isChatLoaded,
				isMinimized,
				experimentVariationName,
				isUserEligibleForPaidSupport,
				canConnectToZendesk,
				isLoadingCanConnectToZendesk,
				hasUserEverEscalatedToHumanSupport,
				odieBroadcastClientId,
				notices,
				selectedSiteId,
				selectedSiteURL,
				userFieldMessage,
				userFieldFlowName,
				setChatStatus,
				setExperimentVariationName,
				setMessageLikedStatus,
				setNotice,
				trackEvent,
				version: overriddenVersion,
				forceEmailSupport,
			} }
		>
			{ children }
		</OdieAssistantContext.Provider>
	);
};
