/* eslint-disable no-restricted-imports */
import { HelpCenterSelect } from '@automattic/data-stores';
import { Card, CardHeader, CardBody, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { comment, Icon } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import { Link } from 'react-router-dom';
import SectionNav from 'calypso/components/section-nav';
import NavItem from 'calypso/components/section-nav/item';
import NavTabs from 'calypso/components/section-nav/tabs';
import { useGetHistoryChats } from '../hooks/use-get-history-chats';
import { HELP_CENTER_STORE } from '../stores';
import { HelpCenterSupportChatMessage } from './help-center-support-chat-message';
import { getLastMessage } from './utils';
import type { Conversations, SupportInteraction } from '@automattic/odie-client';

import './help-center-chat-history.scss';

// temporarily we want to show a simplified version of the chat history
// this bool controls it.
const simplifiedHistoryChat = true;

const TAB_STATES = {
	recent: 'recent',
	archived: 'archived',
};

const Conversations = ( {
	conversations,
	isLoadingInteractions,
}: {
	conversations: Conversations;
	supportInteractions: SupportInteraction[];
	isLoadingInteractions?: boolean;
} ) => {
	const { __ } = useI18n();

	if ( isLoadingInteractions ) {
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
					/>
				);
			} ) }
		</>
	);
};

export const HelpCenterChatHistory = () => {
	const { __ } = useI18n();
	const [ selectedTab, setSelectedTab ] = useState( TAB_STATES.recent );
	const { supportInteractions, isLoadingInteractions, recentConversations, archivedConversations } =
		useGetHistoryChats();

	const { unreadCount } = useSelect( ( select ) => {
		const store = select( HELP_CENTER_STORE ) as HelpCenterSelect;
		return {
			unreadCount: store.getUnreadCount(),
		};
	}, [] );

	// Temporarily simplified version
	if ( simplifiedHistoryChat ) {
		return (
			<Conversations
				conversations={ recentConversations }
				supportInteractions={ supportInteractions }
				isLoadingInteractions={ isLoadingInteractions }
			/>
		);
	}

	return (
		<div className="help-center-chat-history">
			<SectionNav>
				<NavTabs>
					<NavItem
						selected={ selectedTab === TAB_STATES.recent }
						onClick={ () => setSelectedTab( TAB_STATES.recent ) }
						count={ unreadCount > 0 ? unreadCount : undefined }
					>
						{ __( 'Recent', __i18n_text_domain__ ) }
					</NavItem>
					<NavItem
						selected={ selectedTab === TAB_STATES.archived }
						onClick={ () => setSelectedTab( TAB_STATES.archived ) }
					>
						{ __( 'Archived', __i18n_text_domain__ ) }
					</NavItem>
				</NavTabs>
			</SectionNav>

			{ selectedTab === TAB_STATES.recent && (
				<Conversations
					conversations={ recentConversations }
					supportInteractions={ supportInteractions }
				/>
			) }

			{ selectedTab === TAB_STATES.archived &&
				( archivedConversations?.length > 0 ? (
					<Conversations
						conversations={ archivedConversations }
						supportInteractions={ supportInteractions }
					/>
				) : (
					<EmptyArchivedConversations />
				) ) }
		</div>
	);

	function EmptyArchivedConversations() {
		return (
			<Card isBorderless size="small" className="help-center-chat-history__archive-no-results">
				<CardHeader className="help-center-chat-history__archive-no-results-header">
					<h4>{ __( 'Your Archive is Empty', __i18n_text_domain__ ) }</h4>
				</CardHeader>
				<CardBody className="help-center-chat-history__archive-no-results-body">
					{ __(
						'Resolved issues and past conversations will be available here',
						__i18n_text_domain__
					) }
					<Link
						to="/odie"
						onClick={ () => {} }
						className="help-center-chat-history__archive-no-results-button"
					>
						<Icon icon={ comment } />
						{ __( 'Get support', __i18n_text_domain__ ) }
					</Link>
				</CardBody>
			</Card>
		);
	}
};
