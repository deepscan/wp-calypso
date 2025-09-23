import config from '@automattic/calypso-config';
import { isWithinBreakpoint, subscribeIsWithinBreakpoint } from '@automattic/viewport';
import { useBreakpoint } from '@automattic/viewport-react';
import { UniversalNavbarHeader } from '@automattic/wpcom-template-parts';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { Component, useEffect } from 'react';
import { connect } from 'react-redux';
import QueryAgencies from 'calypso/a8c-for-agencies/data/agencies/query-agencies';
import AsyncLoad from 'calypso/components/async-load';
import DocumentHead from 'calypso/components/data/document-head';
import QueryPreferences from 'calypso/components/data/query-preferences';
import QuerySiteAdminColor from 'calypso/components/data/query-site-admin-color';
import QuerySiteAdminMenu from 'calypso/components/data/query-site-admin-menu';
import QuerySiteFeatures from 'calypso/components/data/query-site-features';
import QuerySiteSelectedEditor from 'calypso/components/data/query-site-selected-editor';
import QuerySites from 'calypso/components/data/query-sites';
import JetpackCloudMasterbar from 'calypso/components/jetpack/masterbar';
import { withCurrentRoute } from 'calypso/components/route';
import SympathyDevWarning from 'calypso/components/sympathy-dev-warning';
import { retrieveMobileRedirect } from 'calypso/jetpack-connect/persistence-utils';
import EmptyMasterbar from 'calypso/layout/masterbar/empty';
import MasterbarLoggedIn from 'calypso/layout/masterbar/logged-in';
import { isInStepContainerV2FlowContext } from 'calypso/layout/utils';
import isA8CForAgencies from 'calypso/lib/a8c-for-agencies/is-a8c-for-agencies';
import isJetpackCloud from 'calypso/lib/jetpack/is-jetpack-cloud';
import { isWcMobileApp, isWpMobileApp } from 'calypso/lib/mobile-app';
import {
	isWooOAuth2Client,
	isJetpackCloudOAuth2Client,
	isA4AOAuth2Client,
	isCrowdsignalOAuth2Client,
} from 'calypso/lib/oauth2-clients';
import isReaderTagEmbedPage from 'calypso/lib/reader/is-reader-tag-embed-page';
import { getMessagePathForJITM } from 'calypso/lib/route';
import UserVerificationChecker from 'calypso/lib/user/verification-checker';
import { isFetchingAdminColor } from 'calypso/state/admin-color/selectors';
import { loadTrackingTool } from 'calypso/state/analytics/actions';
import { isUserLoggedIn } from 'calypso/state/current-user/selectors';
import { getSidebarType, SidebarType } from 'calypso/state/global-sidebar/selectors';
import { isUserNewerThan, WEEK_IN_MILLISECONDS } from 'calypso/state/guided-tours/contexts';
import { getCurrentOAuth2Client } from 'calypso/state/oauth2-clients/ui/selectors';
import getCurrentQueryArguments from 'calypso/state/selectors/get-current-query-arguments';
import getIsBlazePro from 'calypso/state/selectors/get-is-blaze-pro';
import hasGravatarDomainQueryParam from 'calypso/state/selectors/has-gravatar-domain-query-param';
import isAtomicSite from 'calypso/state/selectors/is-site-automated-transfer';
import isWooJPCFlow from 'calypso/state/selectors/is-woo-jpc-flow';
import { getIsOnboardingAffiliateFlow } from 'calypso/state/signup/flow/selectors';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import { isSupportSession } from 'calypso/state/support/selectors';
import { getCurrentLayoutFocus } from 'calypso/state/ui/layout-focus/selectors';
import {
	getSelectedSiteId,
	getSidebarIsCollapsed,
	masterbarIsVisible,
} from 'calypso/state/ui/selectors';
import BodySectionCssClass from './body-section-css-class';
import { getColorScheme, getColorSchemeFromCurrentQuery, refreshColorScheme } from './color-scheme';
import GlobalNotifications from './global-notifications';
import HelpCenterLoader from './help-center-loader';
import LayoutLoader from './loader';
import { shouldLoadInlineHelp, handleScroll } from './utils';

/*
 * Hotfix for card and button styles hierarchy after <GdprBanner /> removal (see: #70601)
 * TODO: Find a way to improve our async loading that will not require these imports in the global scope (context: pbNhbs-4xL-p2)
 */
import '@automattic/components/src/button/style.scss';
import '@automattic/components/src/card/style.scss';

import './style.scss';

function SidebarScrollSynchronizer() {
	const isNarrow = useBreakpoint( '<660px' );
	const active = ! isNarrow && ! config.isEnabled( 'jetpack-cloud' ); // Jetpack cloud hasn't yet aligned with WPCOM.

	useEffect( () => {
		if ( active ) {
			window.addEventListener( 'scroll', handleScroll );
			window.addEventListener( 'resize', handleScroll );
		}

		return () => {
			if ( active ) {
				window.removeEventListener( 'scroll', handleScroll );
				window.removeEventListener( 'resize', handleScroll );

				// remove style attributes added by `handleScroll`
				document.getElementById( 'content' )?.removeAttribute( 'style' );
				document.getElementById( 'secondary' )?.removeAttribute( 'style' );
			}
		};
	}, [ active ] );

	return null;
}

function SidebarOverflowDelay( { layoutFocus } ) {
	const setSidebarOverflowClass = ( overflow ) => {
		const classList = document.querySelector( 'body' ).classList;
		if ( overflow ) {
			classList.add( 'is-sidebar-overflow' );
		} else {
			classList.remove( 'is-sidebar-overflow' );
		}
	};

	useEffect( () => {
		if ( layoutFocus !== 'sites' ) {
			// The sidebar menu uses a flyout design that requires the overflowing content
			// to be visible. However, `overflow` isn't an animatable CSS property, so we
			// need to set it after the sliding transition finishes. We wait for 150ms (the
			// CSS transition time) + a grace period of 350ms (since the sidebar menu is
			// rendered asynchronously).
			// @see https://github.com/Automattic/wp-calypso/issues/47019
			setTimeout( () => {
				setSidebarOverflowClass( true );
			}, 500 );
		} else {
			setSidebarOverflowClass( false );
		}
	}, [ layoutFocus ] );

	return null;
}

class Layout extends Component {
	static propTypes = {
		primary: PropTypes.element,
		secondary: PropTypes.element,
		focus: PropTypes.object,
		// connected props
		masterbarIsHidden: PropTypes.bool,
		isSupportSession: PropTypes.bool,
		sectionGroup: PropTypes.string,
		sectionName: PropTypes.string,
		colorScheme: PropTypes.string,
		isGravatarDomain: PropTypes.bool,
	};

	constructor( props ) {
		super( props );
		this.state = {
			isDesktop: isWithinBreakpoint( '>=782px' ),
		};
	}

	componentDidMount() {
		this.unsubscribe = subscribeIsWithinBreakpoint( '>=782px', ( isDesktop ) => {
			this.setState( { isDesktop } );
		} );

		refreshColorScheme( undefined, this.props.colorScheme );

		// Load Survicate survey on all pages
		this.props.dispatch( loadTrackingTool( 'Survicate' ) );
	}

	componentDidUpdate( prevProps ) {
		refreshColorScheme( prevProps.colorScheme, this.props.colorScheme );
	}

	renderMasterbar( loadHelpCenterIcon ) {
		if ( this.props.masterbarIsHidden ) {
			return <EmptyMasterbar />;
		}
		if ( this.props.isWooJPC ) {
			return (
				<AsyncLoad require="calypso/layout/masterbar/woo-core-profiler" placeholder={ null } />
			);
		}
		if ( this.props.isBlazePro ) {
			return <AsyncLoad require="calypso/layout/masterbar/blaze-pro" placeholder={ null } />;
		}

		if ( this.props.needsColorScheme && this.props.isFetchingColorScheme ) {
			return null;
		}

		const MasterbarComponent = config.isEnabled( 'jetpack-cloud' )
			? JetpackCloudMasterbar
			: MasterbarLoggedIn;

		const isCheckoutFailed =
			this.props.sectionName === 'checkout' &&
			this.props.currentRoute.startsWith( '/checkout/failed-purchases' );

		return (
			<>
				{ this.props.hasUniversalHeader && (
					<UniversalNavbarHeader
						isLoggedIn={ this.props.isLoggedIn }
						sectionName={ this.props.sectionName }
					/>
				) }
				<MasterbarComponent
					section={ this.props.sectionGroup }
					isCheckout={ this.props.sectionName === 'checkout' }
					isCheckoutPending={ this.props.sectionName === 'checkout-pending' }
					isCheckoutFailed={ isCheckoutFailed }
					loadHelpCenterIcon={ loadHelpCenterIcon }
					isGlobalSidebarVisible={ this.props.isGlobalSidebarVisible }
				/>
			</>
		);
	}

	render() {
		const sectionClass = clsx( 'layout', `focus-${ this.props.currentLayoutFocus }`, {
			[ 'is-group-' + this.props.sectionGroup ]: this.props.sectionGroup,
			[ 'is-section-' + this.props.sectionName ]: this.props.sectionName,
			'a8c-for-agencies': isA4AOAuth2Client( this.props.oauth2Client ),
			crowdsignal: isCrowdsignalOAuth2Client( this.props.oauth2Client ),
			'is-support-session': this.props.isSupportSession,
			'has-no-sidebar': this.props.sidebarIsHidden,
			'has-no-masterbar': this.props.masterbarIsHidden,
			'has-universal-header': this.props.hasUniversalHeader,
			'is-logged-in': this.props.isLoggedIn,
			'is-jetpack-login': this.props.isJetpackLogin,
			'is-jetpack-site': this.props.isJetpack,
			'is-jetpack-mobile-flow': this.props.isJetpackMobileFlow,
			'is-woocommerce-core-profiler-flow': this.props.isWooJPC,
			'is-automattic-for-agencies-flow': this.props.isFromAutomatticForAgenciesPlugin,
			woo: this.props.isWooJPC,
			'is-global-sidebar-visible': this.props.isGlobalSidebarVisible,
			'is-global-sidebar-collapsed': this.props.isGlobalSidebarCollapsed,
			'is-unified-site-sidebar-visible': this.props.isUnifiedSiteSidebarVisible,
			'is-blaze-pro': this.props.isBlazePro,
			'is-woo-com-oauth': isWooOAuth2Client( this.props.oauth2Client ),
			'jetpack-cloud': isJetpackCloudOAuth2Client( this.props.oauth2Client ),
			'feature-flag-woocommerce-core-profiler-passwordless-auth': true,
			'is-domain-for-gravatar': this.props.isGravatarDomain,
		} );

		const optionalBodyProps = () => {
			const bodyClass = [ 'font-smoothing-antialiased' ];

			if ( this.props.sidebarIsCollapsed && isWithinBreakpoint( '>800px' ) ) {
				bodyClass.push( 'is-sidebar-collapsed' );
			}

			return {
				bodyClass,
			};
		};

		const loadHelpCenter =
			// we want to show only the Help center in my home and the help section (but not the FAB)
			( [ 'home', 'help' ].includes( this.props.sectionName ) ||
				shouldLoadInlineHelp( this.props.sectionName, this.props.currentRoute ) ) &&
			this.props.userAllowedToHelpCenter;

		const shouldDisableSidebarScrollSynchronizer =
			this.props.isGlobalSidebarVisible || this.props.isGlobalSidebarCollapsed;

		const shouldEnableCommandPalette =
			// There is a custom command palette in the "Switch site" page, so we disable it.
			config.isEnabled( 'yolo/command-palette' ) && this.props.currentRoute !== '/switch-site';

		return (
			<div className={ sectionClass }>
				<HelpCenterLoader
					sectionName={ this.props.sectionName }
					loadHelpCenter={ loadHelpCenter }
					currentRoute={ this.props.currentRoute }
				/>
				{ ! shouldDisableSidebarScrollSynchronizer && (
					<SidebarScrollSynchronizer layoutFocus={ this.props.currentLayoutFocus } />
				) }
				<SidebarOverflowDelay layoutFocus={ this.props.currentLayoutFocus } />
				<BodySectionCssClass
					layoutFocus={ this.props.currentLayoutFocus }
					group={ this.props.sectionGroup }
					section={ this.props.sectionName }
					{ ...optionalBodyProps() }
				/>
				<DocumentHead />
				{ this.props.shouldQueryAllSites ? (
					<QuerySites allSites />
				) : (
					<QuerySites primaryAndRecent={ ! config.isEnabled( 'jetpack-cloud' ) } />
				) }
				<QueryPreferences />
				<QuerySiteFeatures siteIds={ [ this.props.siteId ] } />
				<QuerySiteAdminMenu siteId={ this.props.siteId } />
				<QuerySiteAdminColor siteId={ this.props.siteId } />
				{ config.isEnabled( 'layout/query-selected-editor' ) && (
					<QuerySiteSelectedEditor siteId={ this.props.siteId } />
				) }
				<UserVerificationChecker />
				{ config.isEnabled( 'layout/guided-tours' ) && (
					<AsyncLoad require="calypso/layout/guided-tours" placeholder={ null } />
				) }
				<div className="layout__header-section">{ this.renderMasterbar( loadHelpCenter ) }</div>
				<LayoutLoader />
				{ isJetpackCloud() && (
					<AsyncLoad require="calypso/jetpack-cloud/style" placeholder={ null } />
				) }
				{ isA8CForAgencies() && (
					<>
						<AsyncLoad require="calypso/a8c-for-agencies/style" placeholder={ null } />
						<QueryAgencies />
					</>
				) }
				<div id="content" className="layout__content">
					{ config.isEnabled( 'jitms' ) && this.props.isEligibleForJITM && (
						<AsyncLoad
							require="calypso/blocks/jitm"
							placeholder={ null }
							messagePath={ `calypso:${ this.props.sectionJitmPath }:admin_notices` }
						/>
					) }
					<AsyncLoad
						require="calypso/components/global-notices"
						placeholder={ null }
						id="notices"
					/>
					{ ! ( this.props.needsColorScheme && this.props.isFetchingColorScheme ) && (
						<>
							<div id="secondary" className="layout__secondary" role="navigation">
								{ this.props.secondary }
							</div>
							<div id="primary" className="layout__primary">
								{ this.props.primary }
							</div>
						</>
					) }
				</div>
				<AsyncLoad require="calypso/layout/community-translator" placeholder={ null } />
				{ 'development' === process.env.NODE_ENV && (
					<>
						<SympathyDevWarning />
						<AsyncLoad require="calypso/components/webpack-build-monitor" placeholder={ null } />
					</>
				) }
				{ config.isEnabled( 'layout/support-article-dialog' ) && (
					<AsyncLoad require="calypso/blocks/support-article-dialog" placeholder={ null } />
				) }
				{ config.isEnabled( 'cookie-banner' ) && (
					<AsyncLoad require="calypso/blocks/cookie-banner" placeholder={ null } />
				) }
				{ config.isEnabled( 'layout/app-banner' ) && (
					<AsyncLoad require="calypso/blocks/app-banner" placeholder={ null } />
				) }
				{ config.isEnabled( 'legal-updates-banner' ) && (
					<AsyncLoad require="calypso/blocks/legal-updates-banner" placeholder={ null } />
				) }
				{ config.isEnabled( 'layout/global-notifications' ) && <GlobalNotifications /> }
				{ shouldEnableCommandPalette && (
					<AsyncLoad require="calypso/layout/command-palette" placeholder={ null } />
				) }
			</div>
		);
	}
}

export default withCurrentRoute(
	connect( ( state, { currentSection, currentRoute, currentQuery, secondary } ) => {
		const sectionGroup = currentSection?.group ?? null;
		const sectionName = currentSection?.name ?? null;
		const siteId = getSelectedSiteId( state );
		const sectionJitmPath = getMessagePathForJITM( currentRoute );
		const isJetpackLogin = currentRoute.startsWith( '/log-in/jetpack' );
		const isDomainAndPlanPackageFlow = !! getCurrentQueryArguments( state )?.domainAndPlanPackage;
		const isJetpack =
			( isJetpackSite( state, siteId ) && ! isAtomicSite( state, siteId ) ) ||
			currentRoute.startsWith( '/checkout/jetpack' );
		const isWooJPC =
			[ 'jetpack-connect', 'login' ].includes( sectionName ) && isWooJPCFlow( state );
		const isBlazePro = getIsBlazePro( state );

		const sidebarType = getSidebarType( {
			state,
			siteId,
			section: currentSection,
			route: currentRoute,
		} );

		const shouldShowGlobalSidebar =
			sidebarType === SidebarType.Global || sidebarType === SidebarType.GlobalCollapsed;
		const shouldShowCollapsedGlobalSidebar = sidebarType === SidebarType.GlobalCollapsed;
		const shouldShowUnifiedSiteSidebar = sidebarType === SidebarType.UnifiedSiteClassic;

		const noMasterbarForRoute =
			isJetpackLogin ||
			currentRoute === '/me/account/closed' ||
			isDomainAndPlanPackageFlow ||
			isReaderTagEmbedPage( window?.location );
		const noMasterbarForSection =
			// hide the masterBar until the section is loaded. To flicker the masterBar in, is better than to flicker it out.
			! sectionName ||
			( ! isWooJPC && ! isBlazePro && [ 'signup', 'jetpack-connect' ].includes( sectionName ) );
		const isFromAutomatticForAgenciesPlugin =
			'automattic-for-agencies-client' === currentQuery?.from;
		const masterbarIsHidden =
			! masterbarIsVisible( state ) ||
			noMasterbarForSection ||
			noMasterbarForRoute ||
			isWpMobileApp() ||
			isWcMobileApp() ||
			isJetpackCloud() ||
			isA8CForAgencies() ||
			isInStepContainerV2FlowContext( currentRoute, currentQuery );
		const isJetpackMobileFlow = 'jetpack-connect' === sectionName && !! retrieveMobileRedirect();
		const oauth2Client = getCurrentOAuth2Client( state );
		const wccomFrom = currentQuery?.[ 'wccom-from' ];
		const isEligibleForJITM = [ 'home', 'plans', 'themes', 'plugins', 'comments' ].includes(
			sectionName
		);
		const sidebarIsHidden = ! secondary || isWcMobileApp() || isDomainAndPlanPackageFlow;
		const isGlobalSidebarVisible = shouldShowGlobalSidebar && ! sidebarIsHidden;

		const colorScheme = isWooJPC
			? getColorSchemeFromCurrentQuery( currentQuery )
			: getColorScheme( {
					state,
					isGlobalSidebarVisible,
					sidebarIsHidden,
					sectionName,
			  } );
		const needsColorScheme =
			! sidebarIsHidden &&
			( sidebarType === SidebarType.UnifiedSiteDefault ||
				sidebarType === SidebarType.UnifiedSiteClassic );

		const isCheckoutSection = [ 'checkout', 'checkout-pending', 'checkout-thank-you' ].includes(
			sectionName
		);
		const isGravatarDomain =
			currentRoute.startsWith( '/start/domain-for-gravatar' ) ||
			( isCheckoutSection && hasGravatarDomainQueryParam( state ) );

		const hasUniversalHeader =
			config.isEnabled( 'themes/universal-header' ) &&
			! siteId &&
			[ 'themes', 'theme' ].includes( sectionName );

		return {
			masterbarIsHidden,
			sidebarIsHidden,
			isJetpack,
			isJetpackLogin,
			isJetpackMobileFlow,
			isWooJPC,
			isFromAutomatticForAgenciesPlugin,
			isEligibleForJITM,
			isBlazePro,
			oauth2Client,
			wccomFrom,
			isLoggedIn: isUserLoggedIn( state ),
			isSupportSession: isSupportSession( state ),
			sectionGroup,
			sectionName,
			sectionJitmPath,
			currentLayoutFocus: getCurrentLayoutFocus( state ),
			colorScheme,
			needsColorScheme,
			isFetchingColorScheme: isFetchingAdminColor( state, siteId ),
			siteId,
			// We avoid requesting sites in the Jetpack Connect authorization step, because this would
			// request all sites before authorization has finished. That would cause the "all sites"
			// request to lack the newly authorized site, and when the request finishes after
			// authorization, it would remove the newly connected site that has been fetched separately.
			// See https://github.com/Automattic/wp-calypso/pull/31277 for more details.
			shouldQueryAllSites: currentRoute && currentRoute !== '/jetpack/connect/authorize',
			sidebarIsCollapsed: sectionName !== 'reader' && getSidebarIsCollapsed( state ),
			userAllowedToHelpCenter: ! getIsOnboardingAffiliateFlow( state ),
			currentRoute,
			isGlobalSidebarVisible,
			isGlobalSidebarCollapsed: shouldShowCollapsedGlobalSidebar && ! sidebarIsHidden,
			isUnifiedSiteSidebarVisible: shouldShowUnifiedSiteSidebar && ! sidebarIsHidden,
			isNewUser: isUserNewerThan( WEEK_IN_MILLISECONDS )( state ),
			isGravatarDomain,
			hasUniversalHeader,
		};
	} )( Layout )
);
