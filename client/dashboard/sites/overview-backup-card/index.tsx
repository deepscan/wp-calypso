import { useQuery } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { siteLastBackupQuery } from '../../app/queries/site-backups';
import { useFormattedTime } from '../../components/formatted-time';
import { useTimeSince } from '../../components/time-since';
import { HostingFeatures } from '../../data/constants';
import { isSelfHostedJetpackConnected } from '../../utils/site-types';
import HostingFeatureGatedWithOverviewCard from '../hosting-feature-gated-with-overview-card';
import OverviewCard from '../overview-card';
import type { Site } from '../../data/types';

const CARD_PROPS = {
	icon: backup,
	title: __( 'Last backup' ),
	tracksId: 'backup',
};

function getBackupUrl( site: Site ) {
	return isSelfHostedJetpackConnected( site )
		? `https://cloud.jetpack.com/backup/${ site.slug }`
		: `https://wordpress.com/backup/${ site.slug }`;
}

function BackupCardContent( { site }: { site: Site } ) {
	const { data: lastBackup } = useQuery( siteLastBackupQuery( site.ID ) );
	const lastBackupTime = lastBackup?.published ?? new Date( 0 ).toISOString();

	const timeSinceLastBackup = useTimeSince( lastBackupTime );
	const formattedLastBackupTime = useFormattedTime( lastBackupTime, { timeStyle: 'short' } );

	if ( lastBackup === undefined ) {
		return <OverviewCard { ...CARD_PROPS } isLoading />;
	}

	if ( ! lastBackup ) {
		return (
			<OverviewCard
				{ ...CARD_PROPS }
				heading={ __( 'No backups yet' ) }
				description={ __( 'Your first backup will be ready soon' ) }
				externalLink={ getBackupUrl( site ) }
			/>
		);
	}

	return (
		<OverviewCard
			{ ...CARD_PROPS }
			heading={ timeSinceLastBackup }
			description={ formattedLastBackupTime }
			externalLink={ getBackupUrl( site ) }
			intent="success"
		/>
	);
}

export default function BackupCard( { site }: { site: Site } ) {
	return (
		<HostingFeatureGatedWithOverviewCard
			site={ site }
			feature={ HostingFeatures.BACKUPS }
			featureIcon={ CARD_PROPS.icon }
			tracksFeatureId={ CARD_PROPS.tracksId }
			upsellHeading={ __( 'Back up your site' ) }
			upsellDescription={ __( 'Get back online quickly with one-click restores' ) }
			upsellExternalLink={ getBackupUrl( site ) }
		>
			<BackupCardContent site={ site } />
		</HostingFeatureGatedWithOverviewCard>
	);
}
