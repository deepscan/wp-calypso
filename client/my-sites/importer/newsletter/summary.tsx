import { Card, ConfettiAnimation } from '@automattic/components';
import { SiteDetails } from '@automattic/data-stores';
import { Notice } from '@wordpress/components';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { Steps, StepStatus } from 'calypso/data/paid-newsletter/use-paid-newsletter-query';
import { useResetMutation } from 'calypso/data/paid-newsletter/use-reset-mutation';
import ImporterActionButton from '../importer-action-buttons/action-button';
import ImporterActionButtonContainer from '../importer-action-buttons/container';
import ContentSummary from './summary/content';
import SubscribersSummary from './summary/subscribers';
import { EngineTypes } from './types';
import { getImporterStatus, normalizeFromSite } from './utils';

function getStepTitle( importerStatus: StepStatus ) {
	if ( importerStatus === 'done' ) {
		return 'Success! 🎉';
	}

	if ( importerStatus === 'importing' ) {
		return 'Almost there…';
	}

	return 'Summary';
}

interface SummaryProps {
	selectedSite: SiteDetails;
	steps: Steps;
	engine: EngineTypes;
	fromSite: string;
	showConfetti: boolean;
	shouldShownConfetti: Dispatch< SetStateAction< boolean > >;
}

export default function Summary( {
	steps,
	selectedSite,
	engine,
	fromSite,
	showConfetti,
	shouldShownConfetti,
}: SummaryProps ) {
	const { resetPaidNewsletter } = useResetMutation();
	const prefersReducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

	const onButtonClick = () => resetPaidNewsletter( selectedSite.ID, engine, 'content' );
	const paidSubscribersCount = parseInt(
		steps.subscribers.content?.meta?.paid_subscribed_count || '0'
	);
	const showPauseSubstackBillingWarning = paidSubscribersCount > 0;

	useEffect( () => {
		if ( showConfetti ) {
			shouldShownConfetti( false );
		}
	}, [ showConfetti, shouldShownConfetti ] );

	const importerStatus = getImporterStatus( steps.content.status, steps.subscribers.status );

	return (
		<Card>
			{ showConfetti && <ConfettiAnimation trigger={ ! prefersReducedMotion } /> }
			<h2>{ getStepTitle( importerStatus ) }</h2>

			{ steps.content.content && (
				<ContentSummary stepContent={ steps.content.content } status={ steps.content.status } />
			) }

			{ steps.subscribers.content && (
				<SubscribersSummary
					stepContent={ steps.subscribers.content }
					status={ steps.subscribers.status }
				/>
			) }

			{ showPauseSubstackBillingWarning && (
				<Notice status="warning" className="importer__notice" isDismissible={ false }>
					<h2>Action Required</h2>
					To prevent any charges from your old provider, go to your{ ' ' }
					<a
						href={ `https://${ normalizeFromSite(
							fromSite
						) }/publish/settings?search=Pause%20subscription` }
						target="_blank"
						rel="noreferrer"
					>
						Substack Payments Settings ↗
					</a>
					, select "Pause billing" and click "<strong>Pause indefinitely</strong>".
				</Notice>
			) }

			<ImporterActionButtonContainer noSpacing>
				<ImporterActionButton
					href={ '/settings/newsletter/' + selectedSite.slug }
					onClick={ onButtonClick }
					primary
				>
					Customize your newsletter
				</ImporterActionButton>
				<ImporterActionButton href={ '/posts/' + selectedSite.slug } onClick={ onButtonClick }>
					View content
				</ImporterActionButton>
				<ImporterActionButton
					href={ '/subscribers/' + selectedSite.slug }
					onClick={ onButtonClick }
				>
					Check subscribers
				</ImporterActionButton>
			</ImporterActionButtonContainer>
		</Card>
	);
}
