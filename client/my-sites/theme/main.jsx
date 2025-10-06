import { getTracksAnonymousUserId } from '@automattic/calypso-analytics';
import config from '@automattic/calypso-config';
import {
	FEATURE_UPLOAD_THEMES,
	WPCOM_FEATURES_INSTALL_PLUGINS,
	FEATURE_INSTALL_THEMES,
	WPCOM_FEATURES_COMMUNITY_THEMES,
} from '@automattic/calypso-products';
import page from '@automattic/calypso-router';
import { Button, Card, Gridicon } from '@automattic/components';
import { Onboard } from '@automattic/data-stores';
import {
	DEFAULT_GLOBAL_STYLES_VARIATION_SLUG,
	ThemePreview as ThemeWebPreview,
	getDesignPreviewUrl,
	isDefaultGlobalStylesVariationSlug,
} from '@automattic/design-picker';
import { localizeUrl } from '@automattic/i18n-utils';
import { isWithinBreakpoint, subscribeIsWithinBreakpoint } from '@automattic/viewport';
import { createHigherOrderComponent } from '@wordpress/compose';
import { Icon, external } from '@wordpress/icons';
import { hasQueryArg } from '@wordpress/url';
import clsx from 'clsx';
import { localize, getLocaleSlug } from 'i18n-calypso';
import photon from 'photon';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import titlecase from 'to-title-case';
import AsyncLoad from 'calypso/components/async-load';
import Banner from 'calypso/components/banner';
import DocumentHead from 'calypso/components/data/document-head';
import QueryActiveTheme from 'calypso/components/data/query-active-theme';
import QueryCanonicalTheme from 'calypso/components/data/query-canonical-theme';
import QueryProductsList from 'calypso/components/data/query-products-list';
import QuerySitePlans from 'calypso/components/data/query-site-plans';
import QuerySitePurchases from 'calypso/components/data/query-site-purchases';
import QueryUserPurchases from 'calypso/components/data/query-user-purchases';
import SyncActiveTheme from 'calypso/components/data/sync-active-theme';
import Main from 'calypso/components/main';
import NavigationHeader from 'calypso/components/navigation-header';
import PremiumGlobalStylesUpgradeModal from 'calypso/components/premium-global-styles-upgrade-modal';
import ThemeSiteSelectorModal from 'calypso/components/theme-site-selector-modal';
import ThemeTierBadge from 'calypso/components/theme-tier/theme-tier-badge';
import { HOSTING_THEME_SELCETED_HASH } from 'calypso/hosting/constants';
import { withCompleteLaunchpadTasksWithNotice } from 'calypso/launchpad/hooks/with-complete-launchpad-tasks-with-notice';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import { decodeEntities } from 'calypso/lib/formatting';
import { PerformanceTrackerStop } from 'calypso/lib/performance-tracking';
import { ReviewsSummary } from 'calypso/my-sites/marketplace/components/reviews-summary';
import { localizeThemesPath, shouldSelectSite } from 'calypso/my-sites/themes/helpers';
import { connectOptions } from 'calypso/my-sites/themes/theme-options';
import ThemePreview from 'calypso/my-sites/themes/theme-preview';
import { useSelector } from 'calypso/state';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { getCurrentUserSiteCount, isUserLoggedIn } from 'calypso/state/current-user/selectors';
import { successNotice, errorNotice } from 'calypso/state/notices/actions';
import { getProductsList } from 'calypso/state/products-list/selectors';
import getCurrentQueryArguments from 'calypso/state/selectors/get-current-query-arguments';
import getProductionSiteForWpcomStaging from 'calypso/state/selectors/get-production-site-for-wpcom-staging';
import isSiteAutomatedTransfer from 'calypso/state/selectors/is-site-automated-transfer';
import isSiteWpcomStaging from 'calypso/state/selectors/is-site-wpcom-staging';
import isSiteWPForTeams from 'calypso/state/selectors/is-site-wpforteams';
import isVipSite from 'calypso/state/selectors/is-vip-site';
import siteHasFeature from 'calypso/state/selectors/site-has-feature';
import { useSiteOption } from 'calypso/state/sites/hooks';
import { useSiteGlobalStylesStatus } from 'calypso/state/sites/hooks/use-site-global-styles-status';
import { withSiteGlobalStylesOnPersonal } from 'calypso/state/sites/hooks/with-site-global-styles-on-personal';
import { getCurrentPlan, isSiteOnECommerceTrial } from 'calypso/state/sites/plans/selectors';
import { getSiteSlug, isJetpackSite } from 'calypso/state/sites/selectors';
import {
	setThemePreviewOptions,
	themeStartActivationSync as themeStartActivationSyncAction,
} from 'calypso/state/themes/actions';
import { useIsThemeAllowedOnSite } from 'calypso/state/themes/hooks/use-is-theme-allowed-on-site';
import { useThemeTierForTheme } from 'calypso/state/themes/hooks/use-theme-tier-for-theme';
import {
	doesThemeBundleSoftwareSet,
	isThemeActive,
	isThemePremium,
	isPremiumThemeAvailable,
	isSiteEligibleForBundledSoftware,
	isWpcomTheme as isThemeWpcom,
	getCanonicalTheme,
	getTheme,
	getThemeDemoUrl,
	getThemeDetailsUrl,
	getThemeRequestErrors,
	shouldShowTryAndCustomize,
	isExternallyManagedTheme as getIsExternallyManagedTheme,
	isSiteEligibleForManagedExternalThemes as getIsSiteEligibleForManagedExternalThemes,
	isMarketplaceThemeSubscribed as getIsMarketplaceThemeSubscribed,
	isThemeActivationSyncStarted as getIsThemeActivationSyncStarted,
	getIsLivePreviewSupported,
	getThemeType,
	isThemeWooCommerce,
	isActivatingTheme as getIsActivatingTheme,
	isInstallingTheme as getIsInstallingTheme,
	hasActivatedTheme as getHasActivatedTheme,
	getActiveTheme,
} from 'calypso/state/themes/selectors';
import { getIsLoadingCart } from 'calypso/state/themes/selectors/get-is-loading-cart';
import { getBackPath } from 'calypso/state/themes/themes-ui/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import { ReviewsModal } from '../marketplace/components/reviews-modal';
import EligibilityWarningModal from '../themes/atomic-transfer-dialog';
import ThemeDownloadCard from './theme-download-card';
import ThemeFeaturesCard from './theme-features-card';
import ThemeNotFoundError from './theme-not-found-error';
import ThemeStyleVariations from './theme-style-variations';
import ThemeSupportTab from './theme-support-tab';

import './style.scss';

const SiteIntent = Onboard.SiteIntent;

class ThemeSheet extends Component {
	static displayName = 'ThemeSheet';

	static propTypes = {
		themeId: PropTypes.string,
		name: PropTypes.string,
		author: PropTypes.string,
		screenshot: PropTypes.string,
		screenshots: PropTypes.array,
		description: PropTypes.string,
		descriptionLong: PropTypes.oneOfType( [
			PropTypes.string,
			PropTypes.bool, // happens if no content: false
		] ),
		supportDocumentation: PropTypes.oneOfType( [
			PropTypes.string,
			PropTypes.bool, // happens if no content: false
		] ),
		download: PropTypes.string,
		taxonomies: PropTypes.object,
		stylesheet: PropTypes.string,
		retired: PropTypes.bool,
		// Connected props
		isLoggedIn: PropTypes.bool,
		siteCount: PropTypes.number,
		isActive: PropTypes.bool,
		isThemePurchased: PropTypes.bool,
		isAtomic: PropTypes.bool,
		isStandaloneJetpack: PropTypes.bool,
		siteId: PropTypes.number,
		siteSlug: PropTypes.string,
		backPath: PropTypes.string,
		isWpcomTheme: PropTypes.bool,
		softLaunched: PropTypes.bool,
		defaultOption: PropTypes.shape( {
			label: PropTypes.string,
			action: PropTypes.func,
			getUrl: PropTypes.func,
		} ),
		secondaryOption: PropTypes.shape( {
			label: PropTypes.string,
			action: PropTypes.func,
			getUrl: PropTypes.func,
		} ),
		isExternallyManagedTheme: PropTypes.bool,
		isSiteEligibleForManagedExternalThemes: PropTypes.bool,
	};

	static defaultProps = {
		section: '',
	};

	/**
	 * Disabled button checks `isLoading` to determine if a the buttons should be disabled
	 * Its assigned to state to guarantee the initial state will be the same for SSR
	 */
	state = {
		showUnlockStyleUpgradeModal: false,
		isAtomicTransferCompleted: false,
		isReviewsModalVisible: false,
		isSiteSelectorModalVisible: false,
		isWide: isWithinBreakpoint( '>960px' ),
	};

	// This is a plain instance property because we only want to know the state of the
	// hash at the time of the component mounting.
	// Checking hash in `componentDidMount` to preserve SSR behavior.
	isThemeSelectedTask = false;

	scrollToTop = () => {
		window.scroll( 0, 0 );
	};

	componentDidMount() {
		this.isThemeSelectedTask = window.location.hash === HOSTING_THEME_SELCETED_HASH;

		this.scrollToTop();

		const { syncActiveTheme, themeStartActivationSync, siteId, themeId } = this.props;
		if ( syncActiveTheme ) {
			themeStartActivationSync( siteId, themeId );
		}

		// Subscribe to breakpoint changes to switch to a compact breadcrumb on mobile.
		this.unsubscribeBreakpoint = subscribeIsWithinBreakpoint( '>960px', ( isWide ) => {
			this.setState( { isWide } );
		} );

		this.maybeAutoActivate();
	}

	componentDidUpdate( prevProps ) {
		const { themeId, defaultOption } = this.props;
		if ( themeId !== prevProps.themeId ) {
			this.scrollToTop();
		}

		if ( defaultOption?.key !== prevProps.defaultOption?.key ) {
			this.maybeAutoActivate();
		}

		if (
			this.props.hasActivatedTheme &&
			! prevProps.hasActivatedTheme &&
			this.props.isActive &&
			! prevProps.isActive &&
			( this.isThemeSelectedTask || this.props.defaultOption?.key === 'activate' )
		) {
			const noticeSettings = {
				id: 'site-theme-activated',
				duration: 10000,
			};
			this.props.completeLaunchpadTasks(
				[ 'site_theme_selected' ],
				this.props.translate( 'Congratulations! You’ve activated your theme!' ),
				noticeSettings
			);
		}
	}

	componentWillUnmount() {
		this.unsubscribeBreakpoint();
	}

	maybeAutoActivate() {
		const { defaultOption } = this.props;
		if ( defaultOption?.key === 'activate' && hasQueryArg( window.location.href, 'activating' ) ) {
			this.onButtonClick();
		}
	}

	isLoaded = () => {
		// We need to make sure the theme object has been loaded including full details
		// (and not just without, as would've been stored by the `<QueryThemes />` (plural!)
		// component used by the theme showcase's list view).
		return !! this.props.name;
	};

	isLoading = () => {
		return this.props.isLoading || this.isRequestingActivatingTheme();
	};

	isRequestingActivatingTheme = () => {
		const { isThemeActivationSyncStarted, isActivatingTheme, isInstallingTheme } = this.props;
		const { isAtomicTransferCompleted } = this.state;
		return (
			( isThemeActivationSyncStarted && ! isAtomicTransferCompleted ) ||
			isActivatingTheme ||
			isInstallingTheme
		);
	};

	// If a theme has been removed by a theme shop, then the theme will still exist and a8c will take over any support responsibilities.
	isRemoved = () =>
		!! this.props.taxonomies?.theme_status?.find( ( status ) => status.slug === 'removed' );

	onBeforeOptionAction = () => {
		this.props.setThemePreviewOptions(
			this.props.themeId,
			this.props.defaultOption,
			this.props.secondaryOption,
			{ styleVariation: this.getSelectedStyleVariation() }
		);
	};

	onButtonClick = ( event ) => {
		const { isLoggedIn, siteCount, siteId } = this.props;

		if ( shouldSelectSite( { isLoggedIn, siteCount, siteId } ) ) {
			event?.preventDefault();
			this.setState( { isSiteSelectorModalVisible: true } );
			return;
		}

		this.onBeforeOptionAction();
		this.props.defaultOption.action?.( this.props.themeId );
	};

	onUnlockStyleButtonClick = () => {
		this.props.recordTracksEvent(
			'calypso_theme_sheet_global_styles_gating_modal_show',
			this.getPremiumGlobalStylesEventProps()
		);

		this.setState( { showUnlockStyleUpgradeModal: true } );
	};

	onStyleVariationClick = ( variation ) => {
		this.props.recordTracksEvent( 'calypso_theme_sheet_style_variation_click', {
			theme_name: this.props.themeId,
			style_variation: variation.slug,
		} );

		if ( typeof window !== 'undefined' ) {
			const params = new URLSearchParams( window.location.search );
			if ( variation.slug !== DEFAULT_GLOBAL_STYLES_VARIATION_SLUG ) {
				params.set( 'style_variation', variation.slug );
			} else {
				params.delete( 'style_variation' );
			}

			const paramsString = params.toString().length ? `?${ params.toString() }` : '';
			page( `${ window.location.pathname }${ paramsString }` );
		}
	};

	getValidSections = () => {
		const validSections = [];
		validSections.push( '' ); // Default section

		if ( ! this.props.isPremium && this.props.supportDocumentation ) {
			validSections.push( 'setup' );
		}

		validSections.push( 'support' );
		return validSections;
	};

	validateSection = ( section ) => {
		if ( this.getValidSections().indexOf( section ) === -1 ) {
			return this.getValidSections()[ 0 ];
		}
		return section;
	};

	trackFeatureClick = ( feature ) => {
		this.props.recordTracksEvent( 'calypso_theme_sheet_feature_click', {
			theme_name: this.props.themeId,
			feature,
		} );
	};

	previewAction = ( event, type, source ) => {
		const { isLivePreviewSupported } = this.props;
		if ( event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ) {
			return;
		}

		event.preventDefault();

		const previewSource = isLivePreviewSupported ? 'live-preview' : 'regular';

		this.props.recordTracksEvent( 'calypso_theme_live_demo_preview_click', {
			theme: this.props.themeId,
			type,
			source,
			has_live_preview_cta: isLivePreviewSupported,
		} );

		const { preview } = this.props.options;
		this.onBeforeOptionAction();

		this.props.setThemePreviewOptions(
			this.props.themeId,
			this.props.defaultOption,
			this.props.secondaryOption,
			{
				styleVariation: this.getSelectedStyleVariation(),
				previewSource: previewSource,
			}
		);

		return preview.action( this.props.themeId );
	};

	shouldRenderForStaging() {
		// isExternallyManagedTheme determines if a theme is paid or not
		const { isExternallyManagedTheme, isWpcomStaging } = this.props;
		return isExternallyManagedTheme && isWpcomStaging;
	}

	shouldRenderPreviewButton() {
		const { isWPForTeamsSite } = this.props;
		return this.isThemeAvailable() && ! isWPForTeamsSite && ! this.shouldRenderForStaging();
	}

	shouldRenderUnlockStyleButton() {
		const { defaultOption, selectedStyleVariationSlug, shouldLimitGlobalStyles, styleVariations } =
			this.props;
		const isNonDefaultStyleVariation = ! isDefaultGlobalStylesVariationSlug(
			selectedStyleVariationSlug
		);

		return (
			shouldLimitGlobalStyles &&
			defaultOption?.key === 'activate' &&
			styleVariations.length > 0 &&
			isNonDefaultStyleVariation
		);
	}

	isWebPreviewAvailable() {
		return (
			this.props.isWpcomTheme &&
			! this.props.isExternallyManagedTheme &&
			! this.props.stylesheet.startsWith( 'a8c' )
		);
	}

	isThemeAvailable() {
		const { demoUrl, retired } = this.props;
		return demoUrl && ! retired;
	}

	getFullLengthScreenshot() {
		// Results are being returned with photon params like `?w=…`. This makes the photon
		// module abort and return null. Strip query string.
		return this.props.screenshots?.[ 0 ]?.replace( /\?.*/, '' ) ?? null;
	}

	/**
	 * Render screenshot for either non-wpcom or externally-managed themes.
	 */
	renderScreenshot() {
		const {
			name: themeName,
			demoUrl,
			translate,
			screenshot,
			isExternallyManagedTheme,
		} = this.props;

		// Partner themes have their fullpage screenshot in the first position of screenshots.
		const screenshotFull = isExternallyManagedTheme ? this.getFullLengthScreenshot() : screenshot;
		const width = 735;
		// Photon may return null, allow fallbacks
		const photonSrc = screenshotFull && photon( screenshotFull, { width } );
		const img = screenshotFull && (
			<img
				alt={
					// translators: %s is the theme name. Eg Twenty Twenty.
					translate( 'Screenshot of the %(themeName)s theme', {
						args: { themeName },
					} )
				}
				className="theme__sheet-img"
				src={ photonSrc || screenshotFull }
				srcSet={ photonSrc && `${ photon( screenshotFull, { width, zoom: 2 } ) } 2x` }
			/>
		);

		if ( this.isThemeAvailable() && ! this.shouldRenderForStaging() ) {
			return (
				<a
					className="theme__sheet-screenshot is-active"
					href={ demoUrl }
					onClick={ ( e ) => {
						this.previewAction( e, 'screenshot', 'preview' );
					} }
					rel="noopener noreferrer"
				>
					{ this.shouldRenderPreviewButton() && (
						<Button className="theme__sheet-preview-demo-site">
							{ translate( 'Preview demo site' ) }
							<Icon icon={ external } size={ 16 } />
						</Button>
					) }
					{ img }
				</a>
			);
		}

		return (
			<div className="theme__sheet-screenshot">
				{ this.shouldRenderPreviewButton() && (
					<Button
						className="theme__sheet-preview-demo-site"
						onClick={ ( e ) => {
							this.previewAction( e, 'link', 'preview' );
						} }
					>
						{ translate( 'Preview demo site' ) }
						<Icon icon={ external } size={ 16 } />
					</Button>
				) }
				{ img }
			</div>
		);
	}

	/**
	 * Render web preview for wpcom themes.
	 */
	renderWebPreview = () => {
		const { locale, siteSlug, stylesheet, styleVariations, themeId, translate } = this.props;
		const baseStyleVariation = styleVariations.find( ( style ) =>
			isDefaultGlobalStylesVariationSlug( style.slug )
		);
		const baseStyleVariationInlineCss = baseStyleVariation?.inline_css || '';
		const selectedStyleVariationInlineCss = this.getSelectedStyleVariation()?.inline_css || '';
		const url = getDesignPreviewUrl(
			{ slug: themeId, recipe: { stylesheet } },
			{ language: locale, viewport_unit_to_px: true }
		);

		// Normally, the ThemeWebPreview component will generate the iframe token via uuid.
		// Given that this page supports SSR, using uuid will cause hydration mismatch.
		// To avoid this, we pass a custom token that consists of the theme ID and user/anon ID.
		const iframeToken = themeId;
		if ( typeof document !== 'undefined' ) {
			iframeToken.concat( '-', getTracksAnonymousUserId() ?? siteSlug );
		}

		if ( ! this.shouldRenderPreviewButton() ) {
			return (
				<div className="theme__sheet-web-preview">
					<ThemeWebPreview
						url={ url }
						inlineCss={ baseStyleVariationInlineCss + selectedStyleVariationInlineCss }
						iframeScaleRatio={ 0.5 }
						iframeToken={ iframeToken }
						isShowFrameBorder={ false }
						isShowDeviceSwitcher={ false }
						isFitHeight
					/>
				</div>
			);
		}

		return (
			<div
				className="theme__sheet-web-preview is-clickable"
				role="button"
				tabIndex="0"
				onClick={ ( e ) => {
					this.previewAction( e, 'link', 'preview' );
				} }
				onKeyDown={ ( e ) => {
					if ( e.key === 'Enter' ) {
						this.previewAction( e, 'link', 'preview' );
					}
				} }
			>
				<Button className="theme__sheet-preview-demo-site">
					{ translate( 'Preview demo site' ) }
				</Button>
				<ThemeWebPreview
					url={ url }
					inlineCss={ baseStyleVariationInlineCss + selectedStyleVariationInlineCss }
					iframeScaleRatio={ 0.5 }
					iframeToken={ iframeToken }
					isShowFrameBorder={ false }
					isShowDeviceSwitcher={ false }
					isFitHeight
				/>
			</div>
		);
	};

	renderSectionContent = () => {
		const { isPremium, supportDocumentation, themeId } = this.props;

		return (
			<div className="theme__sheet-content">
				{ config.isEnabled( 'jitms' ) && this.props.siteSlug && (
					<AsyncLoad
						require="calypso/blocks/jitm"
						placeholder={ null }
						messagePath="calypso:theme:admin_notices"
					/>
				) }
				{ this.isLoaded() && (
					<>
						{ this.renderOverviewTab() }
						{ ! isPremium && supportDocumentation && this.renderSetupTab() }
						<ThemeSupportTab themeId={ themeId } />
					</>
				) }
			</div>
		);
	};

	renderHeader = () => {
		const {
			author,
			isWPForTeamsSite,
			name,
			retired,
			softLaunched,
			translate,
			themeId,
			siteId,
			siteSlug,
		} = this.props;
		const placeholder = <span className="theme__sheet-placeholder">loading.....</span>;
		const title = name || placeholder;
		const tag = author ? translate( 'by %(author)s', { args: { author: author } } ) : placeholder;
		const shouldRenderButton = ! retired && ! isWPForTeamsSite && ! this.shouldRenderForStaging();

		return (
			<div className="theme__sheet-header">
				<div className="theme__sheet-main">
					<div className="theme__sheet-main-info">
						<h1 className="theme__sheet-main-info-title">
							<ThemeTierBadge
								className="theme__sheet-main-info-type"
								showUpgradeBadge
								showPartnerPrice
								themeId={ themeId }
								siteId={ siteId }
								siteSlug={ siteSlug }
							/>

							{ title }
							{ softLaunched && (
								<span className="theme__sheet-bar-soft-launched">{ translate( 'A8C Only' ) }</span>
							) }
						</h1>
						<span className="theme__sheet-main-info-tag">{ tag }</span>
					</div>
					<div className="theme__sheet-main-actions">
						{ this.renderPreviewButton() }
						{ shouldRenderButton &&
							( this.shouldRenderUnlockStyleButton()
								? this.renderUnlockStyleButton()
								: this.renderButton() ) }
					</div>
				</div>
				{ ! retired && this.renderStyleVariations() }
			</div>
		);
	};

	renderReviews = () => {
		const { name, themeId } = this.props;
		const { isReviewsModalVisible } = this.state;

		return (
			<div className="theme__sheet-reviews-summary">
				<ReviewsModal
					isVisible={ isReviewsModalVisible }
					onClose={ () => {
						this.setState( {
							isReviewsModalVisible: false,
						} );
					} }
					productName={ name }
					slug={ themeId }
					productType="theme"
				/>
				<ReviewsSummary
					slug={ themeId }
					productName={ name }
					productType="theme"
					onReviewsClick={ () => {
						this.setState( {
							isReviewsModalVisible: true,
						} );
					} }
				/>
			</div>
		);
	};

	renderStyleVariations = () => {
		const {
			isPremium,
			isFreePlan,
			isThemePurchased,
			themeTier,
			shouldLimitGlobalStyles,
			styleVariations,
			isExternallyManagedTheme,
			isBundledSoftwareSet,
		} = this.props;

		const isGlobalStylesOnPersonal = this.props.isGlobalStylesOnPersonal;

		const isFreeTier = isFreePlan && themeTier?.slug === 'free';
		const hasLimitedFeatures =
			! isExternallyManagedTheme &&
			! isBundledSoftwareSet &&
			! isThemePurchased &&
			! isGlobalStylesOnPersonal &&
			! isPremium &&
			shouldLimitGlobalStyles;

		const shouldSplitDefaultVariation = isFreeTier || hasLimitedFeatures;

		const needsUpgrade = isGlobalStylesOnPersonal
			? isFreePlan || shouldLimitGlobalStyles
			: shouldLimitGlobalStyles || ( isPremium && ! isThemePurchased );

		return (
			styleVariations.length > 0 && (
				<ThemeStyleVariations
					splitDefaultVariation={ shouldSplitDefaultVariation || needsUpgrade }
					selectedVariation={ this.getSelectedStyleVariation() }
					variations={ styleVariations }
					needsUpgrade={ needsUpgrade }
					onClick={ this.onStyleVariationClick }
				/>
			)
		);
	};

	renderDescription = () => {
		if ( this.props.descriptionLong ) {
			// eslint-disable-next-line react/no-danger
			return <div dangerouslySetInnerHTML={ { __html: this.props.descriptionLong } } />;
		}
		// description doesn't contain any formatting, so we don't need to dangerouslySetInnerHTML
		return <div>{ this.props.description }</div>;
	};

	renderNotice = () => {
		const { activeThemeId, themeId, name, siteIntent, translate } = this.props;
		const isAIAssembler = siteIntent === SiteIntent.AIAssembler && activeThemeId === 'assembler';
		if ( ! isAIAssembler || themeId === 'assembler' ) {
			return null;
		}

		return (
			<Banner
				icon="notice"
				title={ translate( 'AI Website Builder' ) }
				description={ translate(
					'{{strong}}%(newThemeName)s{{/strong}} is currently not compatible with our AI Website Builder. Changing to this theme means you can no longer use our AI Website Builder on this site.',
					{
						args: { newThemeName: name },
						components: {
							br: <br />,
							strong: <strong />,
						},
					}
				) }
				disableHref
			/>
		);
	};

	renderStagingPaidThemeNotice = () => {
		if ( ! this.shouldRenderForStaging() ) {
			return null;
		}
		const { translate, productionSiteSlug, themeId } = this.props;

		let url = '';
		if ( productionSiteSlug ) {
			url = `/theme/${ themeId }/${ productionSiteSlug }`;
		}

		return (
			<Banner
				disableHref={ url === '' }
				icon="notice"
				href={ url }
				title={ translate( 'Partner themes cannot be purchased on staging sites' ) }
				description={ translate( 'Subscribe to this theme on your production site.' ) }
			/>
		);
	};

	renderOverviewTab = () => {
		const { download, isWpcomTheme, siteSlug, taxonomies, themeTier } = this.props;

		const showDownloadCard = download && 'free' === themeTier?.slug;

		return (
			<div>
				<Card className="theme__sheet-content">{ this.renderDescription() }</Card>
				<div className="theme__sheet-features">
					<ThemeFeaturesCard
						taxonomies={ taxonomies }
						siteSlug={ siteSlug }
						isWpcomTheme={ isWpcomTheme }
						onClick={ this.trackFeatureClick }
					/>
				</div>
				{ showDownloadCard && <ThemeDownloadCard href={ download } /> }
			</div>
		);
	};

	renderSetupTab = () => {
		/* eslint-disable react/no-danger */
		return (
			<div>
				<Card className="theme__sheet-content">
					<div dangerouslySetInnerHTML={ { __html: this.props.supportDocumentation } } />
				</Card>
			</div>
		);
		/* eslint-enable react/no-danger */
	};

	getDefaultOptionLabel = () => {
		const { defaultOption, isActive, isLoggedIn, siteId, translate } = this.props;
		if ( isActive ) {
			return (
				<span className="theme__sheet-customize-button">
					<Gridicon icon="external" />
					{ translate( 'Customize site' ) }
				</span>
			);
		} else if ( isLoggedIn && siteId ) {
			return translate( 'Activate' );
		}
		return defaultOption.label;
	};

	renderButton = () => {
		const { getUrl, key } = this.props.defaultOption;
		const label = this.getDefaultOptionLabel();
		const placeholder = <span className="theme__sheet-button-placeholder">loading......</span>;
		const {
			isActive,
			isExternallyManagedTheme,
			isLoggedIn,
			tabFilter,
			tier,
			selectedStyleVariationSlug: styleVariationSlug,
			themeType,
			siteCount,
			siteId,
			themeTier,
		} = this.props;

		return (
			<Button
				className="theme__sheet-primary-button"
				href={
					getUrl &&
					( key === 'customize' || ! isExternallyManagedTheme || ! isLoggedIn || ! siteId )
						? getUrl( this.props.themeId, {
								tabFilter,
								tierFilter: tier,
								styleVariationSlug,
								themeTier,
						  } )
						: null
				}
				onClick={ ( event ) => {
					const action = shouldSelectSite( { isLoggedIn, siteCount, siteId } ) ? 'selectSite' : key;

					this.props.recordTracksEvent( 'calypso_theme_sheet_primary_button_click', {
						theme: this.props.themeId,
						theme_type: themeType,
						theme_tier: themeTier?.slug,
						...( action && { action } ),
					} );

					this.onButtonClick( event );
				} }
				primary
				busy={ this.isRequestingActivatingTheme() }
				disabled={ this.isLoading() }
				target={ isActive ? '_blank' : null }
			>
				{ this.isLoaded() ? label : placeholder }
			</Button>
		);
	};

	renderPreviewButton = () => {
		const { translate, isWpcomTheme, isExternallyManagedTheme } = this.props;
		const isExternalLink = ! isWpcomTheme || isExternallyManagedTheme;

		if ( ! this.shouldRenderPreviewButton() ) {
			return null;
		}

		return (
			<Button
				className="theme__sheet-demo-button"
				onClick={ ( e ) => this.previewAction( e, 'link', 'preview', 'regular' ) }
			>
				{ translate( 'Preview', {
					context: 'Button to preview a theme',
				} ) }
				{ isExternalLink && <Icon icon={ external } size={ 16 } /> }
			</Button>
		);
	};

	renderUnlockStyleButton = () => {
		return (
			<Button
				className="theme__sheet-primary-button"
				primary
				busy={ this.isRequestingActivatingTheme() }
				disabled={ this.isLoading() }
				onClick={ this.onUnlockStyleButtonClick }
			>
				{ this.getDefaultOptionLabel() }
			</Button>
		);
	};

	getSelectedStyleVariation = () => {
		const { selectedStyleVariationSlug, styleVariations } = this.props;
		return styleVariations.find( ( variation ) => variation.slug === selectedStyleVariationSlug );
	};

	getBackLink = () => {
		const { backPath, locale, isLoggedIn } = this.props;
		return localizeThemesPath( backPath, locale, ! isLoggedIn );
	};

	handleBackLinkClick = () => {
		const { themeId } = this.props;
		this.props.recordTracksEvent( 'calypso_theme_sheet_back_click', { theme_name: themeId } );
	};

	getPremiumGlobalStylesEventProps = () => {
		const { selectedStyleVariationSlug, themeId } = this.props;
		return {
			theme_name: themeId,
			style_variation: selectedStyleVariationSlug ?? DEFAULT_GLOBAL_STYLES_VARIATION_SLUG,
		};
	};

	onPremiumGlobalStylesUpgradeModalCheckout = () => {
		this.props.recordTracksEvent(
			'calypso_theme_sheet_global_styles_gating_modal_checkout_button_click',
			this.getPremiumGlobalStylesEventProps()
		);

		const params = new URLSearchParams();
		params.append( 'redirect_to', window.location.href.replace( window.location.origin, '' ) );

		this.setState( { showUnlockStyleUpgradeModal: false } );
		const upgradeToPlan = this.props.isGlobalStylesOnPersonal ? 'personal' : 'premium';

		page( `/checkout/${ this.props.siteSlug || '' }/${ upgradeToPlan }?${ params.toString() }` );
	};

	onPremiumGlobalStylesUpgradeModalTryStyle = () => {
		this.props.recordTracksEvent(
			'calypso_theme_sheet_global_styles_gating_modal_try_button_click',
			this.getPremiumGlobalStylesEventProps()
		);

		this.setState( { showUnlockStyleUpgradeModal: false } );
		this.onButtonClick();
	};

	onPremiumGlobalStylesUpgradeModalClose = () => {
		this.props.recordTracksEvent(
			'calypso_theme_sheet_global_styles_gating_modal_close_button_click',
			this.getPremiumGlobalStylesEventProps()
		);

		this.setState( { showUnlockStyleUpgradeModal: false } );
	};

	onAtomicThemeActive = () => {
		if ( ! this.state.isAtomicTransferCompleted ) {
			this.setState( {
				isAtomicTransferCompleted: true,
			} );

			const { isAtomic, siteSlug, themeId } = this.props;
			if ( ! isAtomic ) {
				const newSiteSlug = siteSlug.replace( /\b.wordpress.com/, '.wpcomstaging.com' );
				return page( `/theme/${ themeId }/${ newSiteSlug }` );
			}
		}
	};

	onAtomicThemeActiveFailure = ( message ) => {
		this.props.errorNotice( message );
	};

	renderSheet = () => {
		const section = this.validateSection( this.props.section );
		const {
			themeId,
			siteId,
			translate,
			isLoggedIn,
			isThemeActivationSyncStarted,
			successNotice: showSuccessNotice,
		} = this.props;
		const analyticsPath = `/theme/${ themeId }${ section ? '/' + section : '' }${
			siteId ? '/:site' : ''
		}`;
		const analyticsPageTitle = `Themes > Details Sheet${
			section ? ' > ' + titlecase( section ) : ''
		}${ siteId ? ' > Site' : '' }`;

		const { canonicalUrl, description, name: themeName, seo_title, seo_description } = this.props;

		const title = seo_title
			? seo_title
			: translate( '%(themeName)s Theme', {
					args: { themeName },
			  } );

		const metas = [
			{ property: 'og:title', content: title },
			{ property: 'og:url', content: canonicalUrl },
			{ property: 'og:image', content: this.props.screenshot },
			{ property: 'og:type', content: 'website' },
			{ property: 'og:site_name', content: 'WordPress.com' },
		];

		if ( seo_description || description ) {
			metas.push( {
				name: 'description',
				property: 'og:description',
				content: decodeEntities( seo_description || description ),
			} );
		}

		if ( this.props.retired ) {
			metas.push( {
				name: 'robots',
				content: 'noindex',
			} );
		}

		const isRemoved = this.isRemoved();
		const columnsClassName = clsx( 'theme__sheet-columns', {
			'is-removed': isRemoved,
		} );

		const navigationItems = [
			{ label: translate( 'Themes' ), href: this.getBackLink(), onClick: this.handleBackLinkClick },
			{ label: title },
		];

		return (
			<Main className="theme__sheet">
				<QueryCanonicalTheme themeId={ this.props.themeId } siteId={ siteId } />
				<QueryProductsList />
				<QueryUserPurchases />
				{
					siteId && (
						<QuerySitePurchases siteId={ siteId } />
					) /* TODO: Make QuerySitePurchases handle falsey siteId */
				}
				<QuerySitePlans siteId={ siteId } />
				<DocumentHead title={ title } meta={ metas } />
				<PageViewTracker
					path={ analyticsPath }
					title={ analyticsPageTitle }
					properties={ { is_logged_in: isLoggedIn } }
				/>
				<AsyncLoad require="calypso/components/global-notices" placeholder={ null } id="notices" />
				{
					siteId && (
						<QueryActiveTheme siteId={ siteId } />
					) /* TODO: Make QueryActiveTheme handle falsey siteId */
				}
				<ThemeSiteSelectorModal
					isOpen={ this.state.isSiteSelectorModalVisible }
					onClose={ ( args ) => {
						this.setState( { isSiteSelectorModalVisible: false } );

						if ( args?.siteTitle ) {
							showSuccessNotice(
								translate( 'You have selected the site {{strong}}%(siteTitle)s{{/strong}}.', {
									args: { siteTitle: args.siteTitle },
									components: { strong: <strong /> },
									comment:
										'On the theme details page, notification shown to the user after they choose one of their sites to activate the selected theme',
								} ),
								{
									button: translate( 'Choose a different site', {
										comment:
											'On the theme details page, notification shown to the user offering them the option to choose a different site before activating the selected theme',
									} ),
									onClick: () => this.setState( { isSiteSelectorModalVisible: true } ),
								}
							);
						}
					} }
				/>
				<NavigationHeader
					navigationItems={ navigationItems }
					compactBreadcrumb={ ! this.state.isWide }
				/>
				<div className={ columnsClassName }>
					<div className="theme__sheet-column-header">
						{ this.renderStagingPaidThemeNotice() }
						{ this.renderNotice() }
						{ this.renderHeader() }
						{ this.renderReviews() }
					</div>
					<div className="theme__sheet-column-left">{ this.renderSectionContent( section ) }</div>
					{ ! isRemoved && (
						<div className="theme__sheet-column-right">
							{ this.isWebPreviewAvailable() ? this.renderWebPreview() : this.renderScreenshot() }
						</div>
					) }
				</div>
				<ThemePreview />
				<PremiumGlobalStylesUpgradeModal
					checkout={ this.onPremiumGlobalStylesUpgradeModalCheckout }
					tryStyle={ this.onPremiumGlobalStylesUpgradeModalTryStyle }
					closeModal={ this.onPremiumGlobalStylesUpgradeModalClose }
					isOpen={ this.state.showUnlockStyleUpgradeModal }
				/>
				<PerformanceTrackerStop />
				{ isThemeActivationSyncStarted && (
					<SyncActiveTheme
						siteId={ siteId }
						themeId={ themeId }
						onAtomicThemeActive={ this.onAtomicThemeActive }
						onFailure={ this.onAtomicThemeActiveFailure }
					/>
				) }
				<EligibilityWarningModal />
			</Main>
		);
	};

	render() {
		if ( this.props.error ) {
			return <ThemeNotFoundError />;
		}

		return this.renderSheet();
	}
}

const withSiteGlobalStylesStatus = createHigherOrderComponent( ( Wrapped ) => {
	const WithSiteGlobalStylesStatusComponent = ( props ) => {
		const { siteId } = props;
		const { shouldLimitGlobalStyles } = useSiteGlobalStylesStatus( siteId );

		return <Wrapped { ...props } shouldLimitGlobalStyles={ shouldLimitGlobalStyles } />;
	};
	WithSiteGlobalStylesStatusComponent.displayName = 'WithSiteGlobalStylesStatus';
	return WithSiteGlobalStylesStatusComponent;
}, 'withSiteGlobalStylesStatus' );

const ConnectedThemeSheet = connectOptions( ThemeSheet );

const ThemeSheetWithOptions = ( props ) => {
	const {
		siteId,
		canInstallPlugins,
		canInstallThemes,
		canInstallCommunityThemes,
		isActive,
		isLoggedIn,
		isPremium,
		isThemePurchased,
		isStandaloneJetpack,
		demoUrl,
		showTryAndCustomize,
		isThemeInstalled,
		isBundledSoftwareSet,
		isExternallyManagedTheme,
		isSiteEligibleForManagedExternalThemes,
		isMarketplaceThemeSubscribed,
		isSiteWooExpressFreeTrial,
		isThemeBundleWooCommerce,
	} = props;
	const isThemeAllowed = useIsThemeAllowedOnSite( siteId, props.themeId );
	const themeTier = useThemeTierForTheme( props.themeId );
	let defaultOption;
	let secondaryOption = 'tryandcustomize';
	const needsJetpackPlanUpgrade = isStandaloneJetpack && isPremium && ! isThemePurchased;
	const activeThemeId = useSelector( ( state ) => getActiveTheme( state, siteId ) );
	const siteIntent = useSiteOption( 'site_intent' );

	if ( ! showTryAndCustomize ) {
		secondaryOption = null;
	}

	if ( ! isLoggedIn || ! siteId ) {
		defaultOption = 'signup';
		secondaryOption = null;
	} else if ( isActive ) {
		defaultOption = 'customize';
	} else if ( needsJetpackPlanUpgrade ) {
		defaultOption = 'upgradePlan';
	} else if ( isExternallyManagedTheme && ! isSiteEligibleForManagedExternalThemes ) {
		defaultOption = 'upgradePlanForExternallyManagedThemes';
	} else if (
		isExternallyManagedTheme &&
		isSiteEligibleForManagedExternalThemes &&
		! isMarketplaceThemeSubscribed &&
		! isThemeInstalled
	) {
		defaultOption = 'subscribe';
	} else if ( ( isPremium && ! isThemePurchased && ! isBundledSoftwareSet ) || ! isThemeAllowed ) {
		defaultOption = 'purchase';
	} else if (
		! canInstallPlugins &&
		isBundledSoftwareSet &&
		! ( isSiteWooExpressFreeTrial && isThemeBundleWooCommerce )
	) {
		defaultOption = 'upgradePlanForBundledThemes';
	}
	// isWporgTheme is true for some free themes we offer, so we need to check the tier instead.
	else if (
		( themeTier === 'community' || themeTier?.slug === 'community' ) &&
		( ! canInstallThemes || ! canInstallCommunityThemes )
	) {
		defaultOption = 'upgradePlanForDotOrgThemes';
	} else {
		defaultOption = 'activate';
	}

	return (
		<ConnectedThemeSheet
			{ ...props }
			themeTier={ themeTier }
			isThemeAllowed={ isThemeAllowed }
			demo_uri={ demoUrl }
			siteId={ siteId }
			defaultOption={ defaultOption }
			secondaryOption={ secondaryOption }
			source="showcase-sheet"
			activeThemeId={ activeThemeId }
			siteIntent={ siteIntent }
		/>
	);
};

export default connect(
	( state, { id } ) => {
		const themeId = id;
		const siteId = getSelectedSiteId( state );
		const siteSlug = getSiteSlug( state, siteId );
		const isWpcomTheme = isThemeWpcom( state, themeId );
		const backPath = getBackPath( state );
		const theme = getCanonicalTheme( state, siteId, themeId );
		const error = theme
			? false
			: getThemeRequestErrors( state, themeId, 'wpcom' ) ||
			  getThemeRequestErrors( state, themeId, siteId );
		const englishUrl = 'https://wordpress.com' + getThemeDetailsUrl( state, themeId );

		const isAtomic = isSiteAutomatedTransfer( state, siteId );
		const currentPlan = getCurrentPlan( state, siteId );
		const isFreePlan = currentPlan?.productSlug === 'free_plan';
		const isWpcomStaging = isSiteWpcomStaging( state, siteId );
		const productionSite = getProductionSiteForWpcomStaging( state, siteId );
		const productionSiteSlug = getSiteSlug( state, productionSite?.ID );
		const isJetpack = isJetpackSite( state, siteId );
		const isStandaloneJetpack = isJetpack && ! isAtomic;

		const isExternallyManagedTheme = getIsExternallyManagedTheme( state, theme?.id );
		const isLoading =
			getIsLoadingCart( state ) ||
			( isExternallyManagedTheme && Object.values( getProductsList( state ) ).length === 0 );

		const isMarketplaceThemeSubscribed =
			isExternallyManagedTheme && getIsMarketplaceThemeSubscribed( state, theme?.id, siteId );

		const isLivePreviewSupported = getIsLivePreviewSupported( state, themeId, siteId );

		const queryArgs = getCurrentQueryArguments( state );

		return {
			...theme,
			themeId,
			error,
			siteId,
			siteSlug,
			backPath,
			tabFilter: queryArgs?.tab_filter,
			isWpcomTheme,
			isWpcomStaging,
			productionSiteSlug,
			isLoggedIn: isUserLoggedIn( state ),
			siteCount: getCurrentUserSiteCount( state ),
			isActive: isThemeActive( state, themeId, siteId ),
			isAtomic,
			isFreePlan,
			isStandaloneJetpack,
			isVip: isVipSite( state, siteId ),
			isPremium: isThemePremium( state, themeId ),
			isThemeInstalled: !! getTheme( state, siteId, themeId ),
			isThemePurchased: isPremiumThemeAvailable( state, themeId, siteId ),
			isBundledSoftwareSet: doesThemeBundleSoftwareSet( state, themeId ),
			isThemeBundleWooCommerce: isThemeWooCommerce( state, themeId ),
			isSiteWooExpressFreeTrial: isSiteOnECommerceTrial( state, siteId ),
			isSiteBundleEligible: isSiteEligibleForBundledSoftware( state, siteId ),
			showTryAndCustomize: shouldShowTryAndCustomize( state, themeId, siteId ),
			canInstallPlugins: siteHasFeature( state, siteId, WPCOM_FEATURES_INSTALL_PLUGINS ),
			canInstallThemes: siteHasFeature( state, siteId, FEATURE_INSTALL_THEMES ),
			canInstallCommunityThemes: siteHasFeature( state, siteId, WPCOM_FEATURES_COMMUNITY_THEMES ),
			canUserUploadThemes: siteHasFeature( state, siteId, FEATURE_UPLOAD_THEMES ),
			// Remove the trailing slash because the page URL doesn't have one either.
			canonicalUrl: localizeUrl( englishUrl, getLocaleSlug(), false ).replace( /\/$/, '' ),
			demoUrl: getThemeDemoUrl( state, themeId, siteId ),
			isWPForTeamsSite: isSiteWPForTeams( state, siteId ),
			softLaunched: theme?.soft_launched,
			styleVariations: theme?.style_variations || [],
			selectedStyleVariationSlug: queryArgs?.style_variation,
			isExternallyManagedTheme,
			isSiteEligibleForManagedExternalThemes: getIsSiteEligibleForManagedExternalThemes(
				state,
				siteId
			),
			isLoading,
			isMarketplaceThemeSubscribed,
			isThemeActivationSyncStarted: getIsThemeActivationSyncStarted( state, siteId, themeId ),
			isLivePreviewSupported,
			themeType: getThemeType( state, themeId ),
			isActivatingTheme: getIsActivatingTheme( state, siteId ),
			isInstallingTheme: getIsInstallingTheme( state, themeId, siteId ),
			hasActivatedTheme: getHasActivatedTheme( state, siteId ),
		};
	},
	{
		setThemePreviewOptions,
		successNotice,
		recordTracksEvent,
		themeStartActivationSync: themeStartActivationSyncAction,
		errorNotice,
	}
)(
	withCompleteLaunchpadTasksWithNotice(
		withSiteGlobalStylesStatus(
			withSiteGlobalStylesOnPersonal( localize( ThemeSheetWithOptions ) )
		)
	)
);
