import { addQueryArgs } from '@wordpress/url';
import { localize, fixMe } from 'i18n-calypso';
import { Component } from 'react';
import { connect } from 'react-redux';
import AsyncLoad from 'calypso/components/async-load';
import QueryRewindState from 'calypso/components/data/query-rewind-state';
import { withSiteCopy } from 'calypso/landing/stepper/hooks/use-site-copy';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import SettingsSectionHeader from 'calypso/my-sites/site-settings/settings-section-header';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';
import {
	hasLoadedSitePurchasesFromServer,
	getPurchasesError,
} from 'calypso/state/purchases/selectors';
import canCurrentUserStartSiteOwnerTransfer from 'calypso/state/selectors/can-current-user-start-site-owner-transfer';
import getRewindState from 'calypso/state/selectors/get-rewind-state';
import hasCancelableSitePurchases from 'calypso/state/selectors/has-cancelable-site-purchases';
import isSiteAutomatedTransfer from 'calypso/state/selectors/is-site-automated-transfer';
import isSiteP2Hub from 'calypso/state/selectors/is-site-p2-hub';
import isSiteWPForTeams from 'calypso/state/selectors/is-site-wpforteams';
import isVipSite from 'calypso/state/selectors/is-vip-site';
import { isJetpackSite, getSite } from 'calypso/state/sites/selectors';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import AdministrationToolCard from './card';
import { requestRestore } from './restore-plan-software';
import './style.scss';

const MODAL_NAMES = {
	LEAVE_SITE: 'LEAVE_SITE',
};

const trackDeleteSiteOption = ( option ) => {
	recordTracksEvent( 'calypso_settings_delete_site_options', {
		option: option,
	} );
};

class SiteTools extends Component {
	state = {
		modalOpen: {
			leaveSite: false,
		},
	};

	componentDidUpdate( prevProps ) {
		if ( ! prevProps.purchasesError && this.props.purchasesError ) {
			this.props.errorNotice( this.props.purchasesError );
		}
	}

	handleOpenModal = ( modalName ) => () => {
		this.setState( ( state ) => ( {
			modalOpen: {
				...state.modalOpen,
				[ modalName ]: true,
			},
		} ) );
	};

	handleCloseModal = ( modalName ) => () => {
		this.setState( ( state ) => ( {
			modalOpen: {
				...state.modalOpen,
				[ modalName ]: false,
			},
		} ) );
	};

	render() {
		const {
			shouldShowSiteCopyItem,
			startSiteCopy,
			translate,
			siteSlug,
			copySiteUrl,
			cloneUrl,
			showChangeAddress,
			showClone,
			showRestorePlanSoftware,
			showDeleteContent,
			showDeleteSite,
			showManageConnection,
			showStartSiteTransfer,
			showLeaveSite,
			siteId,
			headerTitle,
			source,
		} = this.props;

		const { modalOpen } = this.state;

		const changeAddressLink = `/domains/manage/${ siteSlug }?source=${ source }`;

		const startOverLink = `/sites/settings/site/${ siteSlug }/reset-site`;

		const restorePlanSoftwareTitle = translate( 'Restore plugins and themes' );
		const restorePlanSoftwareText = translate(
			'If your website is missing plugins and themes that come with your plan, you may restore them here.'
		);

		const startSiteTransferLink = `/sites/settings/site/${ siteSlug }/transfer-site`;

		const deleteSiteLink = `/sites/settings/site/${ siteSlug }/delete-site`;

		const manageConnectionLink = `/settings/manage-connection/${ siteSlug }?source=${ source }`;

		const changeSiteAddress = translate( 'Change your site address' );

		const startOver = translate( 'Reset site' );
		const startOverText = translate(
			"Remove all posts, pages, and media to start fresh while keeping your site's address."
		);

		const deleteSite = translate( 'Delete your site permanently' );
		const deleteSiteText = translate(
			"Delete all your posts, pages, media, and data, and give up your site's address."
		);
		const manageConnectionTitle = translate( 'Manage your connection' );
		const manageConnectionText = translate(
			'Sync your site content for a faster experience, change site owner, repair or terminate your connection.'
		);

		const copyTitle = translate( 'Copy site' );
		const copyText = translate( 'Copy this site with all of its data to a new site.' );

		const cloneTitle = translate( 'Clone', { context: 'verb' } );
		const cloneText = translate( 'Clone your existing site and all its data to a new location.' );

		const startSiteTransferTitle = translate( 'Transfer site' );
		const startSiteTransferText = fixMe( {
			text: 'Transfer your site, plan, and purchases to a new or existing site member.',
			newCopy: translate(
				'Transfer your site, plan, and purchases to a new or existing site member.'
			),
			oldCopy: translate( 'Transfer your site, plan and purchases.' ),
		} );

		return (
			<>
				<QueryRewindState siteId={ siteId } />
				{ headerTitle && <SettingsSectionHeader id="site-tools__header" title={ headerTitle } /> }
				{ showChangeAddress && (
					<AdministrationToolCard
						href={ changeAddressLink }
						onClick={ this.trackChangeAddress }
						title={ changeSiteAddress }
						description={ translate( "Register a new domain or change your site's address." ) }
					/>
				) }
				{ shouldShowSiteCopyItem && (
					<AdministrationToolCard
						href={ copySiteUrl }
						onClick={ () => {
							recordTracksEvent( 'calypso_settings_copy_site_option_click' );
							startSiteCopy();
						} }
						title={ copyTitle }
						description={ copyText }
					/>
				) }
				{ showClone && (
					<AdministrationToolCard
						href={ cloneUrl }
						title={ cloneTitle }
						description={ cloneText }
					/>
				) }
				{ showStartSiteTransfer && (
					<AdministrationToolCard
						href={ startSiteTransferLink }
						title={ startSiteTransferTitle }
						description={ startSiteTransferText }
					/>
				) }
				{ showRestorePlanSoftware && (
					<AdministrationToolCard
						onClick={ this.restorePlanSoftware }
						title={ restorePlanSoftwareTitle }
						description={ restorePlanSoftwareText }
					/>
				) }

				{ showLeaveSite && (
					<>
						<AdministrationToolCard
							title={ translate( 'Leave site' ) }
							description={ translate( 'Leave this site and remove your access.' ) }
							onClick={ this.handleOpenModal( MODAL_NAMES.LEAVE_SITE ) }
						/>
						{ modalOpen[ MODAL_NAMES.LEAVE_SITE ] && (
							<AsyncLoad
								require="calypso/sites/settings/administration/tools/leave-site/leave-site-modal"
								placeholder={ null }
								siteId={ siteId }
								onClose={ this.handleCloseModal( MODAL_NAMES.LEAVE_SITE ) }
							/>
						) }
					</>
				) }

				{ showDeleteContent && (
					<AdministrationToolCard
						href={ startOverLink }
						onClick={ this.trackStartOver }
						title={ startOver }
						description={ startOverText }
					/>
				) }
				{ showDeleteSite && (
					<AdministrationToolCard
						href={ deleteSiteLink }
						onClick={ this.checkForSubscriptions }
						title={ deleteSite }
						description={ deleteSiteText }
						isWarning
					/>
				) }
				{ showManageConnection && (
					<AdministrationToolCard
						href={ manageConnectionLink }
						title={ manageConnectionTitle }
						description={ manageConnectionText }
					/>
				) }
			</>
		);
	}

	trackChangeAddress() {
		trackDeleteSiteOption( 'change-address' );
	}

	trackStartOver() {
		trackDeleteSiteOption( 'start-over' );
	}

	restorePlanSoftware = () => {
		const { siteId, translate } = this.props;
		requestRestore( {
			siteId,
			translate,
			successNotice: this.props.successNotice,
			errorNotice: this.props.errorNotice,
		} );
	};
}

export default connect(
	( state ) => {
		const siteId = getSelectedSiteId( state );
		const site = getSite( state, siteId );
		const siteSlug = getSelectedSiteSlug( state );
		const isAtomic = isSiteAutomatedTransfer( state, siteId );
		const isJetpack = isJetpackSite( state, siteId );
		const isVip = isVipSite( state, siteId );
		const isP2 = isSiteWPForTeams( state, siteId );
		const isP2Hub = isSiteP2Hub( state, siteId );
		const rewindState = getRewindState( state, siteId );
		const sitePurchasesLoaded = hasLoadedSitePurchasesFromServer( state );

		const cloneUrl = `/start/clone-site/${ siteSlug }`;

		const copySiteUrl = addQueryArgs( `/setup/copy-site`, {
			sourceSlug: siteSlug,
		} );

		const isDevelopmentSite = Boolean( site?.is_a4a_dev_site );

		const showStartSiteTransfer =
			! isDevelopmentSite && canCurrentUserStartSiteOwnerTransfer( state, siteId );

		const showLeaveSite = sitePurchasesLoaded && ! isP2;

		return {
			site,
			isAtomic,
			copySiteUrl,
			siteSlug,
			purchasesError: getPurchasesError( state ),
			cloneUrl,
			showChangeAddress: ! isJetpack && ! isVip && ! isP2,
			showClone: 'active' === rewindState.state && ! isAtomic,
			showRestorePlanSoftware: isAtomic,
			showDeleteContent: isAtomic || ( ! isJetpack && ! isVip && ! isP2Hub ),
			showDeleteSite: ( ! isJetpack || isAtomic ) && ! isVip && sitePurchasesLoaded,
			showManageConnection: isJetpack && ! isAtomic,
			showStartSiteTransfer,
			showLeaveSite,
			siteId,
			hasCancelablePurchases: hasCancelableSitePurchases( state, siteId ),
		};
	},
	{
		errorNotice,
		successNotice,
	}
)( localize( withSiteCopy( SiteTools ) ) );
