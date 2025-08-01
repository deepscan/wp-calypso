import { ODIE_ALLOWED_BOTS } from './constants';
import type { ReactNode, PropsWithChildren, SetStateAction } from 'react';

export type OdieAssistantContextInterface = {
	isChatLoaded: boolean;
	canConnectToZendesk: boolean;
	isLoadingCanConnectToZendesk: boolean;
	addMessage: ( message: Message | Message[] ) => void;
	botName?: string;
	botNameSlug: OdieAllowedBots;
	chat: Chat;
	clearChat: () => void;
	currentUser: CurrentUser;
	experimentVariationName: string | undefined | null;
	hasUserEverEscalatedToHumanSupport: boolean;
	isMinimized?: boolean;
	isUserEligibleForPaidSupport: boolean;
	notices: Record< string, string | ReactNode >;
	odieBroadcastClientId: string;
	selectedSiteId?: number | null;
	selectedSiteURL?: string | null;
	userFieldMessage?: string | null;
	userFieldFlowName?: string | null;
	forceEmailSupport: boolean;
	setExperimentVariationName: ( variationName: string | null | undefined ) => void;
	setMessageLikedStatus: ( message: Message, liked: boolean ) => void;
	setChat: ( chat: Chat | SetStateAction< Chat > ) => void;
	setChatStatus: ( status: ChatStatus ) => void;
	setNotice: ( noticeId: string, content: string | ReactNode | null ) => void;
	trackEvent: ( event: string, properties?: Record< string, unknown > ) => void;
	version?: string | null;
};

export type OdieAssistantProviderProps = {
	canConnectToZendesk?: boolean;
	isLoadingCanConnectToZendesk?: boolean;
	botName?: string;
	botNameSlug?: OdieAllowedBots;
	isUserEligibleForPaidSupport?: boolean;
	isMinimized?: boolean;
	currentUser: CurrentUser;
	selectedSiteId?: number | null;
	selectedSiteURL?: string | null;
	userFieldMessage?: string | null;
	userFieldFlowName?: string | null;
	version?: string | null;
	forceEmailSupport?: boolean;
	children?: ReactNode;
	setChatStatus?: ( status: ChatStatus ) => void;
	setNotice?: ( noticeId: string, content: string | ReactNode | null ) => void;
} & PropsWithChildren;

export type CurrentUser = {
	display_name: string;
	avatar_URL?: string;
	email?: string;
	id?: number;
};

type Feature =
	| 'login'
	| 'logout'
	| 'theme'
	| 'plugin'
	| 'admin'
	| 'site-editing'
	| 'domain'
	| 'email'
	| 'subscription'
	| 'notification'
	| 'podcast'
	| 'facebook'
	| 'unrelated-to-wordpress';

export type Source = {
	title: string;
	url: string;
	heading: string;
	blog_id: number;
	post_id: number;
	content: string;
	railcar?: {
		fetch_algo: string;
		fetch_lang: string;
		fetch_position: number;
		fetch_query: number;
		railcar: string;
		rec_blog_id: string;
		rec_post_id: string;
		rec_url: string;
		ui_position: number;
		ui_algo: string;
	};
};

type InquiryType =
	| 'help'
	| 'user-is-greeting'
	| 'suggestion'
	| 'refund'
	| 'billing'
	| 'unrelated-to-wordpress'
	| 'request-for-human-support';

type InteractionStatus = 'open' | 'closed' | 'resolved' | 'solved';

export type OdieUserTracking = {
	path: string;
	time_spent: number;
	elements_clicked: string[];
};

export type Context = {
	nudge_id?: string | undefined;
	section_name?: string;
	session_id?: string;
	site_id: number | null;
	user_tracking?: OdieUserTracking[];
	sources?: Source[];
	question_tags?: {
		feature?: Feature;
		inquiry_type?: InquiryType;
		language?: string;
		product?: string;
		category?: string;
	};
	flags?: {
		forward_to_human_support?: boolean;
		canned_response?: boolean;
		hide_disclaimer_content?: boolean;
		show_contact_support_msg?: boolean;
		show_ai_avatar?: boolean;
		is_error_message?: boolean;
	};
};

export type MessageRole = 'user' | 'bot' | 'business';

export type MessageType =
	| 'message'
	| 'action'
	| 'meta'
	| 'error'
	| 'placeholder'
	| 'dislike-feedback'
	| 'conversation-feedback'
	| 'help-link'
	| 'file'
	| 'image'
	| 'introduction'
	| 'form'
	| 'formResponse';

export type ChatFeedbackActions = {
	score: string;
	account_id: number;
	ticket_id: number;
};

export type Message = {
	content: ReactNode;
	context?: Context;
	internal_message_id?: string;
	message_id?: number;
	meta?: Record< string, string >;
	liked?: boolean | null;
	rating_value?: number;
	role: MessageRole;
	simulateTyping?: boolean;
	type: MessageType;
	directEscalationSupport?: boolean;
	created_at?: string;
	feedbackOptions?: MessageAction[];
	metadata?: Record< string, any >;
	payload?: string;
};

export type ChatStatus = 'loading' | 'loaded' | 'sending' | 'dislike' | 'transfer' | 'closed';

export type ReturnedChat = {
	chat_id: number;
	messages: Message[];
	wpcom_user_id: number;
	experiment_name: string | undefined | null;
};

export type OdieChat = {
	messages: Message[];
	odieId?: number | null | undefined;
	wpcomUserId?: number | null | undefined;
};

export type Chat = OdieChat & {
	supportInteractionId: string | null;
	conversationId: string | null;
	clientId?: string;
	provider: SupportProvider;
	status: ChatStatus;
};

export type OdieAllowedBots = ( typeof ODIE_ALLOWED_BOTS )[ number ];

export type SupportProvider = 'zendesk' | 'odie' | 'zendesk-staging' | 'help-center';

interface ConversationParticipant {
	id: string;
	userId: string;
	unreadCount: number;
	lastRead: number;
}

export type MessageAction = {
	id: string;
	payload: boolean;
	text: string;
	type: string;
	metadata: ChatFeedbackActions;
};

export type OdieMessage = {
	displayName: string;
	received: number;
	role: string;
	text: string;
	altText?: string;
};

export type ZendeskMessage = OdieMessage & {
	avatarUrl?: string;
	id: string;
	actions?: MessageAction[];
	source?: {
		type: 'web' | 'slack' | 'zd:surveys' | 'zd:answerBot';
		id: string;
		integrationId: string;
	};
	type: ZendeskContentType;
	mediaUrl?: string;
	metadata?: Record< string, any >;
	htmlText?: string;
};

export type ZendeskContentType =
	| 'text'
	| 'carousel'
	| 'file'
	| 'form'
	| 'formResponse'
	| 'image'
	| 'image-placeholder'
	| 'list'
	| 'location'
	| 'template';

type Metadata = {
	odieChatId: number;
	createdAt: number;
	supportInteractionId: string;
	status: InteractionStatus;
};

export type OdieConversation = {
	id: string;
	createdAt: number;
	messages: OdieMessage[];
	metadata?: Metadata;
};

export type ZendeskConversation = {
	id: string;
	lastUpdatedAt: number;
	businessLastRead: number;
	description: string;
	displayName: string;
	iconUrl: string;
	type: 'sdkGroup' | string;
	participants: ConversationParticipant[];
	messages: ZendeskMessage[];
	metadata: Metadata;
};

export type Conversations = Array< OdieConversation | ZendeskConversation >;

export type SupportInteractionUser = {
	user_id: string;
	provider: 'wpcom';
	is_owner: boolean;
};

export type SupportInteractionEvent = {
	event_external_id: string;
	event_source: SupportProvider;
	metadata?: object;
	event_order?: number;
};

export type SupportInteraction = {
	uuid: string;
	status: InteractionStatus;
	start_date: string;
	last_updated: string;
	users: SupportInteractionUser[];
	events: SupportInteractionEvent[];
};
