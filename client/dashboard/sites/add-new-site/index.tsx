import { BigSkyLogo } from '@automattic/components/src/logos/big-sky-logo';
import { JetpackLogo } from '@automattic/components/src/logos/jetpack-logo';
import { WordPressLogo } from '@automattic/components/src/logos/wordpress-logo';
import { formatNumber } from '@automattic/number-formatters';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	Button,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { download, reusableBlock, Icon } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { useContext } from 'react';
import devSiteBanner from 'calypso/assets/images/a8c-for-agencies/dev-site-banner.svg';
import { useAnalytics } from '../../app/analytics';
import { AuthContext } from '../../app/auth';
import { useHelpCenter } from '../../app/help-center';
import { userHasFlag } from '../../utils/user';
import Column from './column';
import MenuItem from './menu-item';
import type { AddNewSiteProps } from './types';
import './style.scss';

function AddNewSite( { context = 'unknown' }: AddNewSiteProps ) {
	const { recordTracksEvent } = useAnalytics();
	const auth = useContext( AuthContext );
	const user = auth?.user;
	const isFlexEligible = user ? userHasFlag( user, 'wpcom-flex' ) : false;

	const wordpressClick = () => {
		recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_add' );
		recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_item', {
			action: 'wordpress',
		} );
	};
	const jetpackClick = () => {
		recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_jetpack' );
		recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_item', {
			action: 'jetpack',
		} );
	};
	const migrateClick = () => {
		recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_item', {
			action: 'migrate',
		} );
	};
	const importClick = () => {
		recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_import' );
		recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_item', {
			action: 'import',
		} );
	};
	const offerClick = () => {
		recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_item', {
			action: 'offer',
		} );
	};

	const isDesktop = useViewportMatch( 'medium' );
	const Wrapper = isDesktop ? HStack : VStack;
	const offer = sprintf(
		// translators: %s is a percentage like 55% off
		__( 'Get a free domain and up to %s off' ),
		formatNumber( 0.55, {
			numberFormatOptions: { style: 'percent' },
		} )
	);

	const { setShowHelpCenter } = useHelpCenter();

	return (
		<Wrapper alignment="flex-start" style={ { padding: '16px' } } spacing={ 6 }>
			<Column title={ __( 'Add new site' ) }>
				{ isFlexEligible && (
					<MenuItem
						icon={ <WordPressLogo /> }
						title={ __( 'Create a Flex site' ) }
						description={ __( 'Provision a flexible WordPress.com environment.' ) }
						onClick={ () => {
							recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_item', {
								action: 'flex-site',
							} );
						} }
						href={ `/setup/flex-site?source=${ context }&ref=new-site-popover` }
						aria-label={ __( 'Create a Flex site' ) }
					/>
				) }
				<MenuItem
					icon={ <WordPressLogo /> }
					title="WordPress.com"
					description={ __( 'Build and grow your site, all in one powerful platform.' ) }
					onClick={ wordpressClick }
					href={ addQueryArgs( '/start', {
						source: context,
						ref: 'new-site-popover',
					} ) }
					aria-label={ __( 'Add WordPress.com site' ) }
				/>
				<MenuItem
					icon={ <BigSkyLogo.Mark /> }
					title={ __( 'Build with AI' ) }
					description={ __(
						'Prompt, edit, and launch WordPress websites with Artificial Intelligence.'
					) }
					onClick={ () => {
						setShowHelpCenter( false );
						recordTracksEvent( 'calypso_sites_dashboard_new_site_action_click_item', {
							action: 'big-sky',
						} );
					} }
					href={ addQueryArgs( '/setup/ai-site-builder', {
						source: context,
						ref: 'new-site-popover',
					} ) }
					aria-label={ __( 'Build a new site with AI' ) }
				/>
				<MenuItem
					icon={ <JetpackLogo /> }
					title={ __( 'Via the Jetpack plugin' ) }
					description={ __( 'Install the Jetpack plugin on an existing site.' ) }
					onClick={ jetpackClick }
					href={ `/jetpack/connect?cta_from=${ context }&cta_id=add-site` }
					aria-label={ __( 'Add site via the Jetpack plugin' ) }
				/>
			</Column>
			<Column title={ __( 'Migrate and import' ) }>
				<MenuItem
					icon={ reusableBlock }
					title={ __( 'Migrate' ) }
					description={ __( 'Bring your entire WordPress site to WordPress.com.' ) }
					onClick={ migrateClick }
					href={ `/setup/site-migration?source=${ context }&ref=new-site-popover&action=migrate` }
					aria-label={ __( 'Migrate an existing WordPress site' ) }
				/>
				<MenuItem
					icon={ <Icon icon={ download } size={ 18 } /> }
					title={ __( 'Import' ) }
					description={ __( 'Use a backup to only import content from other platforms.' ) }
					onClick={ importClick }
					href={ `/setup/site-migration/create-site?source=${ context }&ref=new-site-popover&action=import` }
					aria-label={ __( 'Import content from other platforms' ) }
				/>
			</Column>

			<Button
				href="https://wordpress.com/setup/onboarding"
				onClick={ offerClick }
				style={ {
					display: 'block',
					height: 'auto',
					textAlign: 'left',
					width: '260px',
					padding: 0,
				} }
				aria-label={ __( 'Get special offer: Free domain and up to 55% off annual plans' ) }
			>
				<VStack className="dashboard-add-new-site__banner">
					<img src={ devSiteBanner } alt="" aria-hidden="true" />
					<Text size="title">{ offer }</Text>
					<Text variant="muted" as="p">
						{ sprintf(
							// translators: %s is a percentage like 55% off
							__(
								'Save up to %s on annual plans and get a free custom domain for a year. Your next site is just a step away.'
							),
							formatNumber( 0.55, {
								numberFormatOptions: { style: 'percent' },
							} )
						) }
					</Text>
					<div aria-hidden="true">{ __( 'Unlock offer' ) }</div>
				</VStack>
			</Button>
		</Wrapper>
	);
}

export default AddNewSite;
