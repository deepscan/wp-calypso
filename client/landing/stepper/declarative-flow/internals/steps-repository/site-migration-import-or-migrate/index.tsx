import config from '@automattic/calypso-config';
import { getPlan, isWpComBusinessPlan, PLAN_BUSINESS } from '@automattic/calypso-products';
import { BadgeType } from '@automattic/components';
import { StepContainer } from '@automattic/onboarding';
import { canInstallPlugins } from '@automattic/sites';
import { getQueryArg } from '@wordpress/url';
import { useTranslate } from 'i18n-calypso';
import DocumentHead from 'calypso/components/data/document-head';
import FormattedHeader from 'calypso/components/formatted-header';
import { useMigrationCancellation } from 'calypso/data/site-migration/landing/use-migration-cancellation';
import { useMigrationStickerMutation } from 'calypso/data/site-migration/use-migration-sticker';
import { useHostingProviderUrlDetails } from 'calypso/data/site-profiler/use-hosting-provider-url-details';
import { useSite } from 'calypso/landing/stepper/hooks/use-site';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import FlowCard from '../components/flow-card';
import type { Step } from '../../types';
import './style.scss';

const isMigrationExperimentEnabled = config.isEnabled( 'migration-flow/experiment' );

const SiteMigrationImportOrMigrate: Step = function ( { navigation } ) {
	const translate = useTranslate();
	const site = useSite();
	const importSiteQueryParam = getQueryArg( window.location.href, 'from' )?.toString() || '';
	const { deleteMigrationSticker } = useMigrationStickerMutation();
	const { mutate: cancelMigration } = useMigrationCancellation( site?.ID );

	const isBusinessPlan = site?.plan?.product_slug
		? isWpComBusinessPlan( site?.plan?.product_slug )
		: false;

	let options;

	if ( isMigrationExperimentEnabled ) {
		const badgeText = isBusinessPlan
			? translate( 'Included with your plan' )
			: // translators: %(planName)s is a plan name (e.g. Commerce plan).
			  ( translate( 'Available on %(planName)s with 50% off', {
					args: { planName: getPlan( PLAN_BUSINESS )?.getTitle() ?? '' },
			  } ) as string );

		options = [
			{
				label: translate( 'Migrate site' ),
				description: translate(
					"Best for WordPress sites. Seamlessly move all your site's content, themes, plugins, users, and customizations to WordPress.com."
				),
				value: 'migrate',
				badge: {
					type: 'info-blue' as BadgeType,
					text: badgeText,
				},
				selected: true,
			},
			{
				label: translate( 'Import content only' ),
				description: translate( 'Import posts, pages, comments, and media only.' ),
				value: 'import',
			},
		];
	} else {
		options = [
			{
				label: translate( 'Migrate site' ),
				description: translate(
					"All your site's content, themes, plugins, users and customizations."
				),
				value: 'migrate',
				badge: {
					type: 'info-blue' as BadgeType,
					// translators: %(planName)s is a plan name (e.g. Commerce plan).
					text: translate( 'Requires %(planName)s plan', {
						args: { planName: getPlan( PLAN_BUSINESS )?.getTitle() ?? '' },
					} ) as string,
				},
				selected: true,
			},
			{
				label: translate( 'Import content only' ),
				description: translate( 'Import just posts, pages, comments and media.' ),
				value: 'import',
			},
		];
	}

	const { data: hostingProviderDetails } = useHostingProviderUrlDetails( importSiteQueryParam );
	const hostingProviderName = hostingProviderDetails.name;
	const shouldDisplayHostIdentificationMessage =
		! hostingProviderDetails.is_unknown && ! hostingProviderDetails.is_a8c;

	const siteCanInstallPlugins = canInstallPlugins( site );

	const handleClick = ( destination: string ) => {
		if ( destination === 'migrate' && ! siteCanInstallPlugins ) {
			return navigation.submit?.( { destination: 'upgrade' } );
		}

		if ( destination === 'import' && site && site.ID ) {
			//TODO: This is a temporary solution to delete the migration sticker and the migration flow.
			// We should refactor this to use a single endpoint to handle both operations.
			deleteMigrationSticker( site.ID );
			cancelMigration();
		}

		return navigation.submit?.( { destination } );
	};

	const stepContent = (
		<>
			<div className="import-or-migrate__list">
				{ options.map( ( option, i ) => (
					<FlowCard
						key={ i }
						title={ option.label }
						badge={ option.badge }
						text={ option.description }
						onClick={ () => handleClick( option.value ) }
					/>
				) ) }
			</div>
		</>
	);

	return (
		<>
			<DocumentHead title={ translate( 'What do you want to do?' ) } />
			<StepContainer
				stepName="site-migration-import-or-migrate"
				className="import-or-migrate"
				shouldHideNavButtons={ false }
				hideSkip
				formattedHeader={
					<FormattedHeader
						id="how-to-migrate-header"
						headerText={ translate( 'What do you want to do?' ) }
						subHeaderText={
							shouldDisplayHostIdentificationMessage
								? translate( 'Your WordPress site is hosted with %(hostingProviderName)s.', {
										args: { hostingProviderName },
								  } )
								: ''
						}
						align="center"
					/>
				}
				stepContent={ stepContent }
				recordTracksEvent={ recordTracksEvent }
				goBack={ navigation.goBack }
			/>
		</>
	);
};

export default SiteMigrationImportOrMigrate;
