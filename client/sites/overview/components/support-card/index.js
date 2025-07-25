import { Button } from '@automattic/components';
import { HelpCenter } from '@automattic/data-stores';
import { useStillNeedHelpURL } from '@automattic/help-center/src/hooks';
import { useResetSupportInteraction } from '@automattic/help-center/src/hooks/use-reset-support-interaction';
import { useHasEnTranslation } from '@automattic/i18n-utils';
import { useDispatch as useDataStoreDispatch } from '@wordpress/data';
import { useTranslate } from 'i18n-calypso';
import { useDispatch } from 'react-redux';
import { HostingCard } from 'calypso/components/hosting-card';
import {
	composeAnalytics,
	recordTracksEvent,
	recordGoogleEvent,
	bumpStat,
} from 'calypso/state/analytics/actions';

import './style.scss';

function trackNavigateGetHelpClick() {
	return composeAnalytics(
		recordGoogleEvent( 'Hosting Configuration', 'Clicked "Contact us" Button in Support card' ),
		recordTracksEvent( 'calypso_hosting_configuration_contact_support' ),
		bumpStat( 'hosting-config', 'contact-support' )
	);
}

const HELP_CENTER_STORE = HelpCenter.register();

export default function SupportCard() {
	const hasEnTranslation = useHasEnTranslation();
	const translate = useTranslate();
	const dispatch = useDispatch();
	const { setShowHelpCenter, setNavigateToRoute } = useDataStoreDispatch( HELP_CENTER_STORE );
	const { url } = useStillNeedHelpURL();
	const resetSupportInteraction = useResetSupportInteraction();

	const onClick = async () => {
		await resetSupportInteraction();
		setNavigateToRoute( url );
		setShowHelpCenter( true );
		dispatch( trackNavigateGetHelpClick() );
	};

	return (
		<HostingCard className="support-card" title={ translate( 'Need some help?' ) }>
			<p>
				{ hasEnTranslation(
					'Our AI assistant can answer your questions and connect you to our Happiness Engineers for further assistance.'
				)
					? translate(
							'Our AI assistant can answer your questions and connect you to our Happiness Engineers for further assistance.'
					  )
					: translate( 'Our AI assistant can help, or connect you to our support team.' ) }
			</p>
			<Button onClick={ onClick }>{ translate( 'Get help' ) }</Button>
		</HostingCard>
	);
}
