/* eslint-disable no-restricted-imports */
import { calculateUnread } from '@automattic/odie-client/src/data/use-get-unread-conversations';
import { Spinner } from '@wordpress/components';
import { useI18n } from '@wordpress/react-i18n';
import { useChatStatus, useGetHistoryChats } from '../hooks';
import { HelpCenterSupportChatMessage } from './help-center-support-chat-message';
import { EmailFallbackNotice } from './notices';
import { getLastMessage } from './utils';
import './help-center-chat-history.scss';
import type {
	Conversations,
	SupportInteraction,
	ZendeskConversation,
} from '@automattic/odie-client';

const Conversations = ( {
	conversations,
	isLoadingInteractions,
}: {
	conversations: Conversations;
	supportInteractions: SupportInteraction[];
	isLoadingInteractions?: boolean;
} ) => {
	const { __ } = useI18n();

	if ( isLoadingInteractions && ! conversations.length ) {
		return (
			<div className="help-center-chat-history__no-results">
				<Spinner />
			</div>
		);
	}

	if ( ! conversations.length ) {
		return (
			<div className="help-center-chat-history__no-results">
				{ __( 'Nothing found…', __i18n_text_domain__ ) }
			</div>
		);
	}

	return (
		<>
			{ conversations.map( ( conversation ) => {
				const { numberOfUnreadMessages } = calculateUnread( [
					conversation as ZendeskConversation,
				] );
				const lastMessage = getLastMessage( { conversation } );

				if ( ! lastMessage ) {
					return null;
				}

				return (
					<HelpCenterSupportChatMessage
						sectionName="chat_history"
						key={ conversation.id }
						message={ lastMessage }
						conversation={ conversation }
						numberOfUnreadMessages={ numberOfUnreadMessages }
					/>
				);
			} ) }
		</>
	);
};

export const HelpCenterChatHistory = () => {
	const { supportInteractions, isLoadingInteractions, recentConversations } = useGetHistoryChats();
	const { forceEmailSupport } = useChatStatus();

	return (
		<>
			{ forceEmailSupport && <EmailFallbackNotice /> }
			<Conversations
				conversations={ recentConversations }
				supportInteractions={ supportInteractions }
				isLoadingInteractions={ isLoadingInteractions }
			/>
		</>
	);
};
