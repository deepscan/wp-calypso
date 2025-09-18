import { Chat, Message } from '../types';

export const isCSATMessage = ( message: Message ) =>
	message?.feedbackOptions?.length && message?.metadata?.type === 'csat';

export const hasFeedbackForm = ( message: Message ) => message?.type === 'form';

export const isAttachment = ( message: Message ) =>
	message?.type === 'image' || message?.type === 'image-placeholder';

export const isTransitionToSupportMessage = ( message: Message ) =>
	!! message?.context?.flags?.show_contact_support_msg;

export const hasCSATMessage = ( chat: Chat ) => {
	return chat?.messages.some( isCSATMessage );
};

export const hasSubmittedCSATRating = ( chat: Chat ) => {
	return chat?.messages.some( ( message ) => message?.metadata?.rated === true );
};
