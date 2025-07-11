import { HELP_CENTER_STORE } from '@automattic/help-center/src/stores';
import { isTestModeEnvironment } from '@automattic/zendesk-client';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { handleSupportInteractionsFetch } from './handle-support-interactions-fetch';
import type { SupportInteraction, SupportInteractionEvent } from '../types';

/**
 * Manage support interaction events.
 */
export const useManageSupportInteraction = () => {
	const { setCurrentSupportInteraction } = useDispatch( HELP_CENTER_STORE );
	const isTestMode = isTestModeEnvironment();
	/**
	 * Start a new support interaction.
	 */
	const startNewInteraction = useMutation( {
		mutationKey: [ 'support-interaction', 'new-conversation', isTestMode ],
		mutationFn: ( eventData: SupportInteractionEvent ) =>
			handleSupportInteractionsFetch(
				'POST',
				null,
				isTestMode,
				eventData
			) as unknown as Promise< SupportInteraction >,
		onSuccess: (
			newSupportInteraction: SupportInteraction,
			eventData: SupportInteractionEvent
		) => {
			const hasExpectedEvent = newSupportInteraction?.events?.some(
				( event ) => event.event_external_id === eventData.event_external_id
			);

			if ( hasExpectedEvent ) {
				setCurrentSupportInteraction( newSupportInteraction );
			}
		},
	} ).mutateAsync;

	/**
	 * Add an event to a support interaction.
	 */
	const addEventToInteraction = useMutation<
		SupportInteraction,
		Error,
		{ interactionId: string; eventData: SupportInteractionEvent }
	>( {
		mutationKey: [ 'support-interaction', 'add-event', isTestMode ],
		mutationFn: ( {
			interactionId,
			eventData,
		}: {
			interactionId: string;
			eventData: SupportInteractionEvent;
		} ) =>
			handleSupportInteractionsFetch(
				'POST',
				`/${ interactionId }/events`,
				isTestMode,
				eventData
			) as unknown as Promise< SupportInteraction >,
		onSuccess: (
			newSupportInteraction: SupportInteraction,
			variables: { interactionId: string; eventData: SupportInteractionEvent }
		) => {
			const hasExpectedEvent = newSupportInteraction?.events?.some(
				( event ) => event.event_external_id === variables.eventData.event_external_id
			);

			if ( hasExpectedEvent ) {
				setCurrentSupportInteraction( newSupportInteraction );
			}
		},
	} );

	/**
	 * Resolve a support interaction.
	 */
	const resolveInteraction = useMutation( {
		mutationKey: [ 'support-interaction', 'resolve', isTestMode ],
		mutationFn: ( { interactionId }: { interactionId: string } ) =>
			handleSupportInteractionsFetch( 'PUT', `/${ interactionId }/status`, isTestMode, {
				status: 'resolved',
			} ),
	} ).mutate;

	return {
		startNewInteraction,
		addEventToInteraction,
		resolveInteraction,
	};
};
