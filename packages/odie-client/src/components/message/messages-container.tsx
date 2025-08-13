import { HelpCenterSelect } from '@automattic/data-stores';
import { useResetSupportInteraction } from '@automattic/help-center/src/hooks/use-reset-support-interaction';
import { HELP_CENTER_STORE } from '@automattic/help-center/src/stores';
import { getShortDateString } from '@automattic/i18n-utils';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import clx from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { NavigationType, useNavigationType, useSearchParams } from 'react-router-dom';
import { getOdieInitialMessage } from '../../constants';
import { useOdieAssistantContext } from '../../context';
import {
	useAutoScroll,
	useCreateZendeskConversation,
	useZendeskMessageListener,
	useUpdateDocumentTitle,
} from '../../hooks';
import { useHelpCenterChatScroll } from '../../hooks/use-help-center-chat-scroll';
import {
	interactionHasZendeskEvent,
	interactionHasEnded,
	hasCSATMessage,
	hasSubmittedCSATRating,
} from '../../utils';
import useViewMostRecentOpenConversationNotice from '../notices/use-view-most-recent-conversation-notice';
import { JumpToRecent } from './jump-to-recent';
import { ThinkingPlaceholder } from './thinking-placeholder';
import ChatMessage from '.';
import type { Chat, CurrentUser } from '../../types';

const ChatDate = ( { chat }: { chat: Chat } ) => {
	// chat.messages[ 1 ] contains the first user interaction, therefore the date, otherwise the current date.
	const chatDate =
		chat.messages.length > 1 ? chat.messages[ 1 ]?.created_at || Date.now() : Date.now();
	const currentDate = getShortDateString( chatDate as number );
	return <div className="odie-chat__date">{ currentDate }</div>;
};

interface ChatMessagesProps {
	currentUser: CurrentUser;
}

export const MessagesContainer = ( { currentUser }: ChatMessagesProps ) => {
	const { chat, botNameSlug, isChatLoaded, isUserEligibleForPaidSupport, forceEmailSupport } =
		useOdieAssistantContext();
	const createZendeskConversation = useCreateZendeskConversation();
	const resetSupportInteraction = useResetSupportInteraction();
	const [ searchParams, setSearchParams ] = useSearchParams();
	const isForwardingToZendesk =
		searchParams.get( 'provider' ) === 'zendesk' && chat.provider !== 'zendesk';
	const [ hasForwardedToZendesk, setHasForwardedToZendesk ] = useState( false );
	const [ chatMessagesLoaded, setChatMessagesLoaded ] = useState( false );
	const [ shouldEnableAutoScroll, setShouldEnableAutoScroll ] = useState( true );
	const navType: NavigationType = useNavigationType();

	const messagesContainerRef = useRef< HTMLDivElement >( null );
	const scrollParentRef = useRef< HTMLElement | null >( null );

	useViewMostRecentOpenConversationNotice(
		chatMessagesLoaded && chat?.provider === 'odie' && ! forceEmailSupport
	);

	const { alreadyHasActiveZendeskChat, chatHasEnded } = useSelect( ( select ) => {
		const helpCenterSelect: HelpCenterSelect = select( HELP_CENTER_STORE );
		const currentInteraction = helpCenterSelect.getCurrentSupportInteraction();
		return {
			alreadyHasActiveZendeskChat:
				interactionHasZendeskEvent( currentInteraction ) &&
				! interactionHasEnded( currentInteraction ),
			chatHasEnded: interactionHasEnded( currentInteraction ),
		};
	}, [] );

	useZendeskMessageListener();
	const isScrolling = useAutoScroll( messagesContainerRef, shouldEnableAutoScroll );
	useHelpCenterChatScroll( chat?.supportInteractionId, scrollParentRef, ! shouldEnableAutoScroll );

	useEffect( () => {
		if ( navType === 'POP' && ( isChatLoaded || ! isUserEligibleForPaidSupport ) ) {
			setShouldEnableAutoScroll( false );
		}
	}, [ navType, isUserEligibleForPaidSupport, shouldEnableAutoScroll, isChatLoaded ] );

	useEffect( () => {
		if ( messagesContainerRef.current && scrollParentRef.current === null ) {
			scrollParentRef.current = messagesContainerRef.current?.closest(
				'.help-center__container-content'
			);
		}
	}, [ messagesContainerRef ] );
	useUpdateDocumentTitle();

	// prevent zd transfer for non-eligible users
	useEffect( () => {
		if ( isForwardingToZendesk && ! isUserEligibleForPaidSupport ) {
			searchParams.delete( 'provider' );
			setChatMessagesLoaded( true );
		}
	}, [ isForwardingToZendesk, isUserEligibleForPaidSupport, setChatMessagesLoaded ] );

	useEffect( () => {
		if ( isForwardingToZendesk || hasForwardedToZendesk ) {
			return;
		}

		( chat?.status === 'loaded' || chat?.status === 'closed' ) && setChatMessagesLoaded( true );
	}, [ chat?.status, isForwardingToZendesk, hasForwardedToZendesk ] );

	/**
	 * Handle the case where we are forwarding to Zendesk.
	 */
	useEffect( () => {
		if (
			isForwardingToZendesk &&
			! hasForwardedToZendesk &&
			! chat.conversationId &&
			createZendeskConversation &&
			resetSupportInteraction &&
			isChatLoaded &&
			! forceEmailSupport
		) {
			searchParams.delete( 'provider' );
			searchParams.set( 'direct-zd-chat', '1' );
			setSearchParams( searchParams );
			setHasForwardedToZendesk( true );

			// when forwarding to zd avoid creating new chats
			if ( alreadyHasActiveZendeskChat ) {
				setChatMessagesLoaded( true );
			} else {
				resetSupportInteraction().then( ( interaction ) => {
					createZendeskConversation( {
						avoidTransfer: true,
						interactionId: interaction?.uuid,
						createdFrom: 'direct_url',
					} ).then( () => {
						setChatMessagesLoaded( true );
					} );
				} );
			}
		}
	}, [
		isForwardingToZendesk,
		hasForwardedToZendesk,
		isChatLoaded,
		chat?.conversationId,
		resetSupportInteraction,
		createZendeskConversation,
		alreadyHasActiveZendeskChat,
	] );

	// Used to apply the correct styling on messages
	const isNextMessageFromSameSender = ( currentMessage: string, nextMessage: string ) => {
		return currentMessage === nextMessage;
	};

	const chatHasCSATMessage = hasCSATMessage( chat );
	const displayCSAT = chatHasCSATMessage && ! hasSubmittedCSATRating( chat );
	return (
		<div
			className={ clx( 'chatbox-messages', {
				'force-email-support': forceEmailSupport && chat.provider === 'zendesk',
			} ) }
			ref={ messagesContainerRef }
		>
			<div
				className="screen-reader-text"
				aria-live="polite"
				aria-atomic="false"
				aria-relevant="additions"
			>
				{ chat.messages.map( ( message, index ) => (
					<div key={ index }>
						{ [ 'bot', 'business' ].includes( message.role ) && message.content }
					</div>
				) ) }
			</div>
			<ChatDate chat={ chat } />
			<>
				<div
					className={ clx( 'chatbox-loading-chat__spinner', {
						'is-visible': ! chatMessagesLoaded || isScrolling,
					} ) }
				>
					<Spinner />
				</div>
				{ ( chat.odieId || chat.provider === 'odie' ) && (
					<ChatMessage
						message={ getOdieInitialMessage( botNameSlug ) }
						key={ 0 }
						currentUser={ currentUser }
						isNextMessageFromSameSender={ false }
						displayChatWithSupportLabel={ false }
					/>
				) }
				{ chat.messages.map( ( message, index ) => {
					const nextMessage = chat.messages[ index + 1 ];
					const displayChatWithSupportLabel =
						! nextMessage?.context?.flags?.show_contact_support_msg &&
						message.context?.flags?.show_contact_support_msg &&
						! chatHasEnded &&
						! message.context?.flags?.is_error_message;

					const displayChatWithSupportEndedLabel =
						! chatHasCSATMessage && ! nextMessage && chatHasEnded;

					return (
						<ChatMessage
							message={ message }
							key={ index }
							currentUser={ currentUser }
							isNextMessageFromSameSender={ isNextMessageFromSameSender(
								message.role,
								chat.messages[ index + 1 ]?.role
							) }
							displayChatWithSupportLabel={ displayChatWithSupportLabel }
							displayChatWithSupportEndedLabel={ displayChatWithSupportEndedLabel }
							displayCSAT={ displayCSAT }
						/>
					);
				} ) }
				<JumpToRecent containerReference={ messagesContainerRef } />

				{ chat.provider === 'odie' && chat.status === 'sending' && (
					<div className="odie-chatbox__action-message">
						<ThinkingPlaceholder />
					</div>
				) }
			</>
		</div>
	);
};
