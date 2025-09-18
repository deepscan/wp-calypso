import { calculateUnread } from '@automattic/odie-client/src/data/use-get-unread-conversations';
import { ZendeskConversation } from '@automattic/odie-client/src/types';
import React from 'react';
import { useGetHistoryChats } from '../hooks';
import { HelpCenterSupportChatMessage } from './help-center-support-chat-message';
import { getLastMessage } from './utils';

import './help-center-recent-conversations.scss';

const HelpCenterRecentConversations: React.FC = () => {
	const { recentConversations } = useGetHistoryChats();

	if ( ! recentConversations?.length ) {
		return null;
	}

	const recentConversation = recentConversations[ 0 ];

	const lastMessage = getLastMessage( {
		conversation: recentConversation,
	} );

	if ( ! lastMessage ) {
		return null;
	}

	const { numberOfUnreadMessages } = calculateUnread( [
		recentConversation as ZendeskConversation,
	] );

	return (
		<HelpCenterSupportChatMessage
			numberOfUnreadMessages={ numberOfUnreadMessages }
			sectionName="recent_conversations"
			key={ recentConversation.id }
			message={ lastMessage }
			conversation={ recentConversation }
			homePageVersion
		/>
	);
};

export default HelpCenterRecentConversations;
