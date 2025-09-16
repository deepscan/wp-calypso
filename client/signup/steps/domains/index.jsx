import { PLAN_PERSONAL } from '@automattic/calypso-products';
import page from '@automattic/calypso-router';
import { Spinner } from '@automattic/components';
import {
	isWithThemeFlow,
	isHostingSignupFlow,
	isOnboardingFlow,
	StepContainer,
	isAIBuilderFlow,
	isTailoredSignupFlow,
	Step,
	isNewHostedSiteCreationFlow,
	NEW_HOSTED_SITE_FLOW,
	DOMAIN_FOR_GRAVATAR_FLOW,
	isDomainForGravatarFlow,
	AI_SITE_BUILDER_FLOW,
} from '@automattic/onboarding';
import { withShoppingCart } from '@automattic/shopping-cart';
import { Button } from '@wordpress/components';
import { getQueryArg, getProtocol } from '@wordpress/url';
import { withViewportMatch } from '@wordpress/viewport';
import clsx from 'clsx';
import { localize } from 'i18n-calypso';
import { defer, get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { parse } from 'qs';
import { Children, Component, isValidElement } from 'react';
import { connect } from 'react-redux';
import AsyncLoad from 'calypso/components/async-load';
import QueryProductsList from 'calypso/components/data/query-products-list';
import RegisterDomainStepV2 from 'calypso/components/domain-search-v2/register-domain-step';
import { useMyDomainInputMode as inputMode } from 'calypso/components/domains/connect-domain-step/constants';
import RegisterDomainStep from 'calypso/components/domains/register-domain-step';
import { recordUseYourDomainButtonClick } from 'calypso/components/domains/register-domain-step/analytics';
import SideExplainer from 'calypso/components/domains/side-explainer';
import UseMyDomain from 'calypso/components/domains/use-my-domain';
import FormattedHeader from 'calypso/components/formatted-header';
import Notice from 'calypso/components/notice';
import { shouldUseStepContainerV2 } from 'calypso/landing/stepper/declarative-flow/helpers/should-use-step-container-v2';
import BodySectionCssClass from 'calypso/layout/body-section-css-class';
import { SIGNUP_DOMAIN_ORIGIN } from 'calypso/lib/analytics/signup';
import {
	domainRegistration,
	domainMapping,
	domainTransfer,
	updatePrivacyForDomain,
	planItem,
	hasPlan,
	hasDomainRegistration,
	getDomainsInCart,
	hasPersonalPlan,
} from 'calypso/lib/cart-values/cart-items';
import {
	getDomainProductSlug,
	getDomainSuggestionSearch,
	getFixedDomainSearch,
} from 'calypso/lib/domains';
import { getSuggestionsVendor } from 'calypso/lib/domains/suggestions';
import { useIsDomainSearchV2Enabled } from 'calypso/lib/domains/use-domain-search-v2';
import { triggerGuidesForStep } from 'calypso/lib/guides/trigger-guides-for-step';
import CalypsoShoppingCartProvider from 'calypso/my-sites/checkout/calypso-shopping-cart-provider';
import withCartKey from 'calypso/my-sites/checkout/with-cart-key';
import { domainManagementRoot } from 'calypso/my-sites/domains/paths';
import {
	getStepUrl,
	isPlanSelectionAvailableLaterInFlow,
	getPreviousStepName,
} from 'calypso/signup/utils';
import {
	composeAnalytics,
	recordGoogleEvent,
	recordTracksEvent,
} from 'calypso/state/analytics/actions';
import {
	getCurrentUser,
	getCurrentUserSiteCount,
	isUserLoggedIn,
} from 'calypso/state/current-user/selectors';
import {
	recordAddDomainButtonClick,
	recordAddDomainButtonClickInMapDomain,
	recordAddDomainButtonClickInTransferDomain,
	recordAddDomainButtonClickInUseYourDomain,
} from 'calypso/state/domains/actions';
import { getAvailableProductsList } from 'calypso/state/products-list/selectors';
import getSitesItems from 'calypso/state/selectors/get-sites-items';
import { fetchUsernameSuggestion } from 'calypso/state/signup/optional-dependencies/actions';
import {
	removeStep,
	saveSignupStep,
	submitSignupStep,
} from 'calypso/state/signup/progress/actions';
import { isPlanStepExistsAndSkipped } from 'calypso/state/signup/progress/selectors';
import { setDesignType } from 'calypso/state/signup/steps/design-type/actions';
import { getDesignType } from 'calypso/state/signup/steps/design-type/selectors';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import DomainsMiniCart from './domains-mini-cart';
import {
	getExternalBackUrl,
	shouldUseMultipleDomainsInCart,
	sortProductsByPriceDescending,
} from './utils';
import './style.scss';

const isRelativeUrl = ( url ) => ! url.startsWith( '//' ) && ! getProtocol( url );

class RenderDomainsStepComponent extends Component {
	static propTypes = {
		cart: PropTypes.object,
		shoppingCartManager: PropTypes.any,
		forceDesignType: PropTypes.string,
		domainsWithPlansOnly: PropTypes.bool,
		flowName: PropTypes.string.isRequired,
		goToNextStep: PropTypes.func.isRequired,
		goBack: PropTypes.func,
		isDomainOnly: PropTypes.bool.isRequired,
		locale: PropTypes.string,
		path: PropTypes.string.isRequired,
		positionInFlow: PropTypes.number.isRequired,
		queryObject: PropTypes.object,
		step: PropTypes.object,
		stepName: PropTypes.string.isRequired,
		stepSectionName: PropTypes.string,
		selectedSite: PropTypes.object,
		recordTracksEvent: PropTypes.func,
		allowSkipWithoutSearch: PropTypes.bool,
	};

	constructor( props ) {
		super( props );

		const domain = get( props, 'queryObject.new', false );
		const search = get( props, 'queryObject.search', false ) === 'yes';
		const suggestedDomain = get( props, 'signupDependencies.suggestedDomain' );
		const siteUrl = get( props, 'signupDependencies.siteUrl' );

		// If we landed anew from `/domains` and it's the `new-flow` variation
		// or there's a suggestedDomain from previous steps, always rerun the search.
		if ( ( search && props.path.indexOf( '?' ) !== -1 ) || suggestedDomain ) {
			this.searchOnInitialRender = true;
		}

		if (
			props.isDomainOnly &&
			domain &&
			! search && // Testing /domains sending to NUX for search
			// If someone has a better idea on how to figure if the user landed anew
			// Because we persist the signupDependencies, but still want the user to be able to go back to search screen
			props.path.indexOf( '?' ) !== -1
		) {
			this.skipRender = true;
			const productSlug = getDomainProductSlug( domain );
			const domainItem = domainRegistration( {
				productSlug,
				domain,
				extra: { flow_name: props.flowName },
			} );
			const domainCart = shouldUseMultipleDomainsInCart( props.flowName )
				? getDomainsInCart( this.props.cart )
				: {};

			props.submitSignupStep(
				{
					stepName: props.stepName,
					domainItem,
					siteUrl: domain,
					isPurchasingItem: true,
					stepSectionName: props.stepSectionName,
					domainCart,
				},
				{
					domainItem,
					siteUrl: domain,
					domainCart,
				}
			);

			props.goToNextStep();
		}
		this.setCurrentFlowStep = this.setCurrentFlowStep.bind( this );

		this.state = {
			currentStep: null,
			isCartPendingUpdateDomain: null,
			wpcomSubdomainSelected:
				siteUrl && siteUrl.indexOf( '.wordpress.com' ) !== -1 ? { domain_name: siteUrl } : null,
			domainRemovalQueue: [],
			isMiniCartContinueButtonBusy: false,
			temporaryCart: [],
			replaceDomainFailedMessage: null,
			domainAddingQueue: [],
			domainsWithMappingError: [],
			checkDomainAvailabilityPromises: [],
			removeDomainTimeout: 0,
			addDomainTimeout: 0,
		};
	}

	componentDidMount() {
		if ( isTailoredSignupFlow( this.props.flowName ) ) {
			triggerGuidesForStep( this.props.flowName, 'domains' );
		}

		// We add a plan to cart on Multi Domains to show the proper discount on the mini-cart.
		if (
			shouldUseMultipleDomainsInCart( this.props.flowName ) &&
			hasDomainRegistration( this.props.cart ) &&
			this.props.multiDomainDefaultPlan
		) {
			// This call is expensive, so we only do it if the mini-cart hasDomainRegistration.
			this.props.shoppingCartManager.addProductsToCart( [ this.props.multiDomainDefaultPlan ] );
		}
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps?.cart?.products?.length !== this.props?.cart?.products?.length ) {
			if (
				shouldUseMultipleDomainsInCart( this.props.flowName ) &&
				hasDomainRegistration( this.props.cart ) &&
				! hasPersonalPlan( this.props.cart ) &&
				this.props.multiDomainDefaultPlan
			) {
				// This call is expensive, so we only do it if the mini-cart hasDomainRegistration.
				this.props.shoppingCartManager.addProductsToCart( [ this.props.multiDomainDefaultPlan ] );
			}
		}
	}

	getLocale() {
		return ! this.props.userLoggedIn ? this.props.locale : '';
	}

	getUseYourDomainUrl = () => {
		if ( this.props.getUseYourDomainUrl ) {
			const lastQuery = get( this.props.step, 'domainForm.lastQuery' );
			return this.props.getUseYourDomainUrl( lastQuery );
		}

		return getStepUrl(
			this.props.flowName,
			this.props.stepName,
			'use-your-domain',
			this.getLocale()
		);
	};

	handleAddDomain = async ( suggestion, position, previousState ) => {
		const stepData = {
			stepName: this.props.stepName,
			suggestion,
		};

		const signupDomainOrigin = suggestion?.is_free
			? SIGNUP_DOMAIN_ORIGIN.FREE
			: SIGNUP_DOMAIN_ORIGIN.CUSTOM;

		if ( shouldUseMultipleDomainsInCart( this.props.flowName ) ) {
			const domainInAddingQueue = this.state.domainAddingQueue.find(
				( item ) => item.meta === suggestion.domain_name
			);

			const domainInRemovalQueue = this.state.domainRemovalQueue.find(
				( item ) => item.meta === suggestion.domain_name
			);

			if ( domainInAddingQueue || domainInRemovalQueue ) {
				// return false;
			}
		} else {
			this.setState( { isCartPendingUpdateDomain: suggestion } );
		}

		this.props.recordAddDomainButtonClick(
			suggestion.domain_name,
			this.getAnalyticsSection(),
			position,
			suggestion?.is_premium,
			this.props.flowName,
			suggestion?.vendor
		);

		await this.props.saveSignupStep( stepData );

		if ( this.props.shouldUseDomainSearchV2 && suggestion?.isSubDomainSuggestion ) {
			this.setState( { isMiniCartContinueButtonBusy: true } );
			await this.props.saveSignupStep( stepData );
			await this.submitWithDomain( { signupDomainOrigin, position, suggestion } );
			return;
		}

		if (
			shouldUseMultipleDomainsInCart( this.props.flowName ) &&
			suggestion?.isSubDomainSuggestion
		) {
			if ( this.state.wpcomSubdomainSelected ) {
				await this.freeDomainRemoveClickHandler();
			}
			this.setState( { wpcomSubdomainSelected: suggestion }, () => {
				this.props.saveSignupStep( stepData );
			} );
			return;
		}

		if ( shouldUseMultipleDomainsInCart( this.props.flowName ) && suggestion ) {
			await this.handleDomainToDomainCart( previousState );

			// If we already have a free selection in place, let's enforce that as a free site suggestion
			if ( this.state.wpcomSubdomainSelected ) {
				await this.props.saveSignupStep( {
					stepName: this.props.stepName,
					suggestion: this.state.wpcomSubdomainSelected,
				} );
			}
		} else {
			await this.submitWithDomain( { signupDomainOrigin, position, suggestion } );
		}
	};

	handleDomainMappingError = async ( domain_name ) => {
		this.state.domainsWithMappingError.push( domain_name );
		const productToRemove = this.props.cart.products.find(
			( product ) => product.meta === domain_name
		);

		if ( productToRemove ) {
			this.setState( ( prevState ) => ( {
				domainRemovalQueue: [
					...prevState.domainRemovalQueue,
					{ meta: productToRemove.meta, productSlug: productToRemove.product_slug },
				],
			} ) );
			this.setState( { isMiniCartContinueButtonBusy: true } );
			await this.removeDomain( { domain_name, product_slug: productToRemove.product_slug } );
			this.setState( { isMiniCartContinueButtonBusy: false } );
		} else if ( this.state.temporaryCart?.length > 0 ) {
			this.setState( ( state ) => ( {
				temporaryCart: state.temporaryCart.filter( ( domain ) => domain.meta !== domain_name ),
			} ) );
		}
	};

	isPurchasingTheme = () => {
		return this.props.queryObject && this.props.queryObject.premium;
	};

	getThemeSlug = () => {
		return this.props.queryObject ? this.props.queryObject.theme : undefined;
	};

	getThemeStyleVariation = () => {
		return this.props.queryObject ? this.props.queryObject.style_variation : undefined;
	};

	getThemeArgs = () => {
		const themeSlug = this.getThemeSlug();
		const themeStyleVariation = this.getThemeStyleVariation();
		const themeSlugWithRepo = this.getThemeSlugWithRepo( themeSlug );

		return { themeSlug, themeSlugWithRepo, themeStyleVariation };
	};

	getThemeSlugWithRepo = ( themeSlug ) => {
		if ( ! themeSlug ) {
			return undefined;
		}
		const repo = this.isPurchasingTheme() ? 'premium' : 'pub';
		return `${ repo }/${ themeSlug }`;
	};

	shouldUseThemeAnnotation() {
		return this.getThemeSlug() ? true : false;
	}

	isDependencyShouldHideFreePlanProvided = () => {
		/**
		 * This prop is used to supress providing the dependency - shouldHideFreePlan - when the plans step is in the current flow
		 */
		return (
			! this.props.forceHideFreeDomainExplainerAndStrikeoutUi &&
			this.props.isPlanSelectionAvailableLaterInFlow
		);
	};

	handleSkip = ( googleAppsCartItem, shouldHideFreePlan = false, signupDomainOrigin ) => {
		const tracksProperties = Object.assign(
			{
				section: this.getAnalyticsSection(),
				flow: this.props.flowName,
				step: this.props.stepName,
			},
			this.isDependencyShouldHideFreePlanProvided()
				? { should_hide_free_plan: shouldHideFreePlan }
				: {}
		);

		this.props.recordTracksEvent( 'calypso_signup_skip_step', tracksProperties );

		const stepData = {
			stepName: this.props.stepName,
			suggestion: undefined,
			domainCart: {},
			siteUrl: '',
		};

		this.props.saveSignupStep( stepData );

		defer( () => {
			this.submitWithDomain( { googleAppsCartItem, shouldHideFreePlan, signupDomainOrigin } );
		} );
	};

	handleDomainExplainerClick = () => {
		const hideFreePlan = true;
		this.handleSkip( undefined, hideFreePlan, SIGNUP_DOMAIN_ORIGIN.CHOOSE_LATER );
	};

	handleUseYourDomainClick = () => {
		// Stepper doesn't support page.js
		const navigate = this.props.page || page;
		this.props.recordUseYourDomainButtonClick( this.getAnalyticsSection() );
		if ( this.props.useStepperWrapper ) {
			this.props.goToNextStep( { navigateToUseMyDomain: true } );
		} else {
			navigate( this.getUseYourDomainUrl() );
		}
	};

	handleDomainToDomainCart = async ( previousState ) => {
		const { suggestion } = this.props.step;

		if ( previousState ) {
			await this.removeDomain( suggestion );
		} else {
			await this.addDomain( suggestion );
			this.props.setDesignType( this.getDesignType() );
		}
	};

	submitWithDomain = ( {
		googleAppsCartItem,
		shouldHideFreePlan = false,
		signupDomainOrigin,
		suggestion,
	} ) => {
		const { step } = this.props;

		if ( step.suggestion ) {
			suggestion = step.suggestion;
		}

		const shouldUseThemeAnnotation = this.shouldUseThemeAnnotation();
		const useThemeHeadstartItem = shouldUseThemeAnnotation
			? { useThemeHeadstart: shouldUseThemeAnnotation }
			: {};

		const { lastDomainSearched } = step.domainForm ?? {};

		const isPurchasingItem = suggestion && Boolean( suggestion.product_slug );

		const siteUrl =
			suggestion &&
			( isPurchasingItem
				? suggestion.domain_name
				: suggestion.domain_name.replace( '.wordpress.com', '' ) );

		const domainItem = isPurchasingItem
			? domainRegistration( {
					domain: suggestion.domain_name,
					productSlug: suggestion.product_slug,
					extra: { flow_name: this.props.flowName },
			  } )
			: undefined;

		suggestion && this.props.submitDomainStepSelection( suggestion, this.getAnalyticsSection() );

		this.props.submitSignupStep(
			Object.assign(
				{
					stepName: this.props.stepName,
					domainItem,
					googleAppsCartItem,
					isPurchasingItem,
					siteUrl,
					stepSectionName: this.props.stepSectionName,
					domainCart: {},
				},
				this.getThemeArgs()
			),
			Object.assign(
				{ domainItem },
				this.isDependencyShouldHideFreePlanProvided() ? { shouldHideFreePlan } : {},
				useThemeHeadstartItem,
				signupDomainOrigin ? { signupDomainOrigin } : {},
				suggestion?.domain_name ? { siteUrl: suggestion?.domain_name } : {},
				lastDomainSearched ? { lastDomainSearched } : {},
				{ domainCart: {} }
			)
		);

		this.props.setDesignType( this.getDesignType() );

		// For the domain for Gravatar flow, add an extra `is_gravatar_domain` property to the domain registration product,
		// pre-select the "domain" choice in the "site or domain" step and skip the others, going straight to checkout
		if ( isDomainForGravatarFlow( this.props.flowName ) ) {
			const domainForGravatarItem = domainRegistration( {
				domain: suggestion.domain_name,
				productSlug: suggestion.product_slug,
				extra: {
					is_gravatar_domain: true,
					flow_name: this.props.flowName,
				},
			} );

			this.props.submitSignupStep(
				{
					stepName: 'site-or-domain',
					domainItem: domainForGravatarItem,
					designType: 'domain',
					siteSlug: domainForGravatarItem.meta,
					siteUrl,
					isPurchasingItem: true,
				},
				{ designType: 'domain', domainItem: domainForGravatarItem, siteUrl }
			);
			this.props.submitSignupStep(
				{ stepName: 'site-picker', wasSkipped: true },
				{ themeSlugWithRepo: 'pub/twentysixteen' }
			);
			return;
		}

		this.props.goToNextStep();

		// Start the username suggestion process.
		siteUrl && this.props.fetchUsernameSuggestion( siteUrl.split( '.' )[ 0 ] );
	};

	handleAddMapping = ( { sectionName, domain, state } ) => {
		if ( this.props.handleAddMapping ) {
			this.props.handleAddMapping( domain );
			return;
		}
		const domainItem = domainMapping( { domain } );
		const isPurchasingItem = true;
		const shouldUseThemeAnnotation = this.shouldUseThemeAnnotation();
		const useThemeHeadstartItem = shouldUseThemeAnnotation
			? { useThemeHeadstart: shouldUseThemeAnnotation }
			: {};

		this.props.recordAddDomainButtonClickInMapDomain(
			domain,
			this.getAnalyticsSection(),
			this.props.flowName
		);

		this.props.submitSignupStep(
			Object.assign(
				{
					stepName: this.props.stepName,
					[ sectionName ]: state,
					domainItem,
					isPurchasingItem,
					siteUrl: domain,
					stepSectionName: this.props.stepSectionName,
					domainCart: {},
				},
				this.getThemeArgs()
			),
			Object.assign(
				{ domainItem },
				useThemeHeadstartItem,
				{
					signupDomainOrigin: SIGNUP_DOMAIN_ORIGIN.USE_YOUR_DOMAIN,
				},
				{ siteUrl: domain },
				{ domainCart: {} }
			)
		);

		this.props.goToNextStep();
	};

	handleAddTransfer = ( { domain, authCode } ) => {
		if ( this.props.handleAddTransfer ) {
			this.props.handleAddTransfer( domain );
			return;
		}

		const domainItem = domainTransfer( {
			domain,
			extra: {
				auth_code: authCode,
				signup: true,
			},
		} );
		const isPurchasingItem = true;
		const shouldUseThemeAnnotation = this.shouldUseThemeAnnotation();
		const useThemeHeadstartItem = shouldUseThemeAnnotation
			? { useThemeHeadstart: shouldUseThemeAnnotation }
			: {};

		this.props.recordAddDomainButtonClickInTransferDomain(
			domain,
			this.getAnalyticsSection(),
			this.props.flowName
		);

		this.props.submitSignupStep(
			Object.assign(
				{
					stepName: this.props.stepName,
					transfer: {},
					domainItem,
					isPurchasingItem,
					siteUrl: domain,
					stepSectionName: this.props.stepSectionName,
					domainCart: {},
				},
				this.getThemeArgs()
			),
			Object.assign(
				{ domainItem },
				useThemeHeadstartItem,
				{ siteUrl: domain },
				{ domainCart: {} }
			)
		);

		this.props.goToNextStep();
	};

	handleSave = ( sectionName, state ) => {
		this.props.saveSignupStep( {
			stepName: this.props.stepName,
			stepSectionName: this.props.stepSectionName,
			[ sectionName ]: state,
		} );
	};

	getDesignType = () => {
		if ( this.props.forceDesignType ) {
			return this.props.forceDesignType;
		}

		if ( this.props.signupDependencies && this.props.signupDependencies.designType ) {
			return this.props.signupDependencies.designType;
		}

		return this.props.designType;
	};

	shouldIncludeDotBlogSubdomain() {
		const { flowName, isDomainOnly } = this.props;

		// 'subdomain' flow coming from .blog landing pages
		if ( flowName === 'subdomain' ) {
			return true;
		}

		// No .blog subdomains for domain only sites
		if ( isDomainOnly ) {
			return false;
		}

		const lastQuery = get( this.props.step, 'domainForm.lastQuery' );
		return typeof lastQuery === 'string' && lastQuery.includes( '.blog' );
	}

	shouldHideDomainExplainer = () => {
		const { flowName } = this.props;
		return [
			'domain',
			DOMAIN_FOR_GRAVATAR_FLOW,
			'onboarding-with-email',
			NEW_HOSTED_SITE_FLOW,
			'domains/add',
		].includes( flowName );
	};

	shouldHideUseYourDomain = () => {
		const { flowName } = this.props;
		return [
			'domain',
			DOMAIN_FOR_GRAVATAR_FLOW,
			'onboarding-with-email',
			NEW_HOSTED_SITE_FLOW,
			AI_SITE_BUILDER_FLOW,
		].includes( flowName );
	};

	shouldDisplayDomainOnlyExplainer = () => {
		const { flowName } = this.props;
		return [ 'domain' ].includes( flowName );
	};

	async addDomain( suggestion ) {
		const {
			domain_name: domain,
			product_slug: productSlug,
			supports_privacy: supportsPrivacy,
		} = suggestion;

		let registration = domainRegistration( {
			domain,
			productSlug,
			extra: { privacy_available: supportsPrivacy, flow_name: this.props.flowName },
		} );

		if ( supportsPrivacy ) {
			registration = updatePrivacyForDomain( registration, true );
		}

		// Add item_subtotal_integer property to registration, so it can be sorted by price.
		registration.item_subtotal_integer = ( suggestion.sale_cost ?? suggestion.raw_price ) * 100;

		if ( shouldUseMultipleDomainsInCart( this.props.flowName ) ) {
			this.setState( { replaceDomainFailedMessage: null, isMiniCartContinueButtonBusy: true } );
			if (
				! this.state.temporaryCart ||
				! this.state.temporaryCart.some(
					( domainInCart ) => domainInCart.meta === suggestion.domain_name
				)
			) {
				this.setState( ( state ) => ( {
					isCartPendingUpdateDomain: { domain_name: suggestion.domain_name },
					temporaryCart: [
						...( state.temporaryCart || [] ),
						{
							meta: suggestion.domain_name,
							temporary: true,
						},
					],
				} ) );
			}

			await this.setState( ( prevState ) => ( {
				domainAddingQueue: [ ...prevState.domainAddingQueue, registration ],
			} ) );

			// We add a plan to cart on Multi Domains to show the proper discount on the mini-cart.
			// TODO: remove productsToAdd
			const productsToAdd =
				! hasPlan( this.props.cart ) && this.props.multiDomainDefaultPlan
					? [ registration, this.props.multiDomainDefaultPlan ]
					: [ registration ];

			// Replace the products in the cart with the freshly sorted products.
			clearTimeout( this.state.addDomainTimeout );

			// Avoid too much API calls for Multi-domains flow
			this.state.addDomainTimeout = setTimeout( async () => {
				// Only saves after all domain are checked.
				Promise.all( this.state.checkDomainAvailabilityPromises ).then( async () => {
					if ( this.props.currentUser ) {
						try {
							await this.props.shoppingCartManager.reloadFromServer();
						} catch {
							this.setState( {
								replaceDomainFailedMessage: this.props.translate(
									'Sorry, there was a problem adding that domain. Please try again later.'
								),
								isMiniCartContinueButtonBusy: false,
							} );

							return;
						}
					}

					// Add productsToAdd to productsInCart.
					let productsInCart = [
						...this.props.cart.products,
						...productsToAdd,
						...this.state.domainAddingQueue,
					];
					// Remove domains with domainsWithMappingError from productsInCart.
					productsInCart = productsInCart.filter( ( product ) => {
						return ! this.state.domainsWithMappingError.includes( product.meta );
					} );
					// Sort products to ensure the user gets the best deal with the free domain bundle promotion.
					const sortedProducts = sortProductsByPriceDescending( productsInCart );
					this.props.shoppingCartManager
						.replaceProductsInCart( sortedProducts )
						.then( () => {
							this.setState( { replaceDomainFailedMessage: null } );
							if ( this.state.domainAddingQueue?.length > 0 ) {
								this.setState( ( state ) => ( {
									domainAddingQueue: state.domainAddingQueue.filter(
										( domainInQueue ) =>
											! sortedProducts.find( ( item ) => item.meta === domainInQueue.meta )
									),
								} ) );
							}
							if ( this.state.temporaryCart?.length > 0 ) {
								this.setState( ( state ) => ( {
									temporaryCart: state.temporaryCart.filter(
										( temporaryCart ) =>
											! sortedProducts.find( ( item ) => item.meta === temporaryCart.meta )
									),
								} ) );
							}
						} )
						.catch( () => {
							this.handleReplaceProductsInCartError(
								this.props.translate(
									'Sorry, there was a problem adding that domain. Please try again later.'
								)
							);
						} )
						.then( () => {
							this.setState( { isMiniCartContinueButtonBusy: false } );
						} );
				} );
			}, 500 );
		} else {
			this.setState( {
				replaceDomainFailedMessage: null,
				isMiniCartContinueButtonBusy: true,
			} );

			try {
				await this.props.shoppingCartManager.addProductsToCart( registration );
			} catch {
				this.handleReplaceProductsInCartError(
					this.props.translate(
						'Sorry, there was a problem adding that domain. Please try again later.'
					)
				);
			} finally {
				this.setState( { isMiniCartContinueButtonBusy: false } );
			}
		}

		this.setState( { isCartPendingUpdateDomain: null } );
	}

	removeDomainClickHandler = ( domain ) => async () => {
		await this.removeDomain( {
			domain_name: domain.meta,
			product_slug: domain.product_slug,
		} );

		this.props.recordRemoveDomainButtonClick?.( domain.meta );
	};

	async removeDomain( { domain_name, product_slug } ) {
		if ( this.state.temporaryCart?.length > 0 ) {
			this.setState( ( state ) => ( {
				temporaryCart: state.temporaryCart.filter( ( domain ) => domain.meta !== domain_name ),
			} ) );
		}

		// check if the domain is alreay in the domainRemovalQueue queue
		if ( ! this.state.domainRemovalQueue.find( ( domain ) => domain.meta === domain_name ) ) {
			this.setState( ( prevState ) => ( {
				isMiniCartContinueButtonBusy: true,
				domainRemovalQueue: [
					...prevState.domainRemovalQueue,
					{ meta: domain_name, productSlug: product_slug },
				],
			} ) );
		}

		this.setState( {
			replaceDomainFailedMessage: null,
			isMiniCartContinueButtonBusy: true,
			isCartPendingUpdateDomain: { domain_name: domain_name },
		} );
		clearTimeout( this.state.removeDomainTimeout );

		// Avoid too much API calls for Multi-domains flow
		this.state.removeDomainTimeout = setTimeout( async () => {
			if ( this.props.currentUser ) {
				try {
					await this.props.shoppingCartManager.reloadFromServer();
				} catch {
					this.setState( {
						replaceDomainFailedMessage: this.props.translate(
							'Sorry, there was a problem removing that domain. Please try again later.'
						),
						isMiniCartContinueButtonBusy: false,
					} );

					return;
				}
			}

			const productsToKeep = this.props.cart.products.filter( ( product ) => {
				// check current item
				if ( product.meta === domain_name && product.product_slug === product_slug ) {
					// this is to be removed
					return false;
				}
				// check removal queue
				return ! this.state.domainRemovalQueue.find(
					( domain ) => product.meta === domain.meta && product.product_slug === domain.productSlug
				);
			} );

			await this.props.shoppingCartManager
				.replaceProductsInCart( productsToKeep )
				.then( () => {
					this.setState( { replaceDomainFailedMessage: null } );
				} )
				.catch( () => {
					this.handleReplaceProductsInCartError(
						this.props.translate(
							'Sorry, there was a problem removing that domain. Please try again later.'
						)
					);
				} )
				.finally( () => {
					if ( this.state.domainRemovalQueue?.length > 0 ) {
						this.setState( ( state ) => ( {
							domainRemovalQueue: state.domainRemovalQueue.filter( ( domainInQueue ) =>
								productsToKeep.find( ( item ) => item.meta === domainInQueue.meta )
							),
						} ) );
					}
				} );
			this.setState( { isMiniCartContinueButtonBusy: false } );
		}, 500 );
	}

	handleReplaceProductsInCartError = ( errorMessage ) => {
		const errors = this.props.shoppingCartManager.responseCart.messages?.errors;
		if ( errors && errors.length === 0 ) {
			this.setState( {
				replaceDomainFailedMessage: errorMessage,
			} );
		}
		this.setState( () => ( { temporaryCart: [] } ) );
		this.props.shoppingCartManager.reloadFromServer();
	};

	goToNext = ( event ) => {
		event?.stopPropagation();
		this.setState( { isMiniCartContinueButtonBusy: true } );
		const shouldUseThemeAnnotation = this.shouldUseThemeAnnotation();
		const useThemeHeadstartItem = shouldUseThemeAnnotation
			? { useThemeHeadstart: shouldUseThemeAnnotation }
			: {};

		const { step, cart, multiDomainDefaultPlan, shoppingCartManager, goToNextStep } = this.props;
		const { lastDomainSearched } = step.domainForm ?? {};

		const domainCart = sortProductsByPriceDescending( getDomainsInCart( this.props.cart ) );
		const { suggestion } = step;
		const isPurchasingItem =
			( suggestion && Boolean( suggestion.product_slug ) ) || domainCart?.length > 0;
		const siteUrl =
			suggestion &&
			// If we have a free domain in the cart, we want to use it as the siteUrl
			( isPurchasingItem && ! this.state.wpcomSubdomainSelected
				? suggestion.domain_name
				: suggestion.domain_name.replace( '.wordpress.com', '' ) );

		let domainItem;

		if ( isPurchasingItem ) {
			const selectedDomain = domainCart?.length > 0 ? domainCart[ 0 ] : suggestion;
			domainItem = domainRegistration( {
				domain: selectedDomain?.domain_name || selectedDomain?.meta,
				productSlug: selectedDomain?.product_slug,
				extra: { flow_name: this.props.flowName },
			} );
		}

		const signupDomainOrigin = isPurchasingItem
			? SIGNUP_DOMAIN_ORIGIN.CUSTOM
			: SIGNUP_DOMAIN_ORIGIN.FREE;

		const stepDependencies = Object.assign(
			{
				stepName: this.props.stepName,
				domainItem,
				isPurchasingItem,
				siteUrl,
				stepSectionName: this.props.stepSectionName,
				domainCart,
			},
			this.getThemeArgs()
		);
		const providedDependencies = Object.assign(
			{ domainItem, domainCart },
			useThemeHeadstartItem,
			signupDomainOrigin ? { signupDomainOrigin } : {},
			{ siteUrl: suggestion?.domain_name },
			lastDomainSearched ? { lastDomainSearched } : {},
			{ domainCart }
		);
		this.props.submitSignupStep( stepDependencies, providedDependencies );

		const productToRemove = multiDomainDefaultPlan
			? cart.products.find(
					( product ) => product.product_slug === multiDomainDefaultPlan.product_slug
			  )
			: null;

		if ( productToRemove && productToRemove.uuid ) {
			shoppingCartManager.removeProductFromCart( productToRemove.uuid ).then( () => {
				goToNextStep();
			} );
		} else {
			goToNextStep();
		}
	};

	freeDomainRemoveClickHandler = () => {
		return new Promise( ( resolve ) => {
			this.setState( { wpcomSubdomainSelected: false } );
			this.props.saveSignupStep( {
				stepName: this.props.stepName,
				suggestion: {
					domain_name: false,
				},
			} );
			resolve();
		} );
	};

	getDomainsMiniCart = ( domainsInCart ) => {
		const cartIsLoading = this.props.shoppingCartManager.isLoading;

		if ( cartIsLoading && domainsInCart.length === 0 ) {
			return null;
		}

		return (
			<DomainsMiniCart
				isMobile={ ! this.props.isDesktop }
				domainsInCart={ domainsInCart }
				domainRemovalQueue={ this.state.domainRemovalQueue }
				flowName={ this.props.flowName }
				removeDomainClickHandler={ this.removeDomainClickHandler }
				isMiniCartContinueButtonBusy={ this.state.isMiniCartContinueButtonBusy }
				goToNext={ this.goToNext }
				handleSkip={ this.handleSkip }
				wpcomSubdomainSelected={ this.state.wpcomSubdomainSelected }
				freeDomainRemoveClickHandler={ this.freeDomainRemoveClickHandler }
			/>
		);
	};

	getSideContent = () => {
		const { flowName } = this.props;
		const domainsInCart = getDomainsInCart( this.props.cart );

		const additionalDomains = this.state.temporaryCart
			.map( ( cartDomain ) => {
				return domainsInCart.find( ( domain ) => domain.meta === cartDomain.meta )
					? null
					: cartDomain;
			} )
			.filter( Boolean );

		if ( additionalDomains.length > 0 ) {
			domainsInCart.push( ...additionalDomains );
		}

		const useYourDomain = ! this.shouldHideUseYourDomain() ? (
			<div
				className={ clsx( 'domains__domain-side-content', {
					'fade-out':
						shouldUseMultipleDomainsInCart( flowName ) &&
						( domainsInCart.length > 0 || this.state.wpcomSubdomainSelected ),
				} ) }
			>
				<SideExplainer onClick={ this.handleUseYourDomainClick } type="use-your-domain" />
			</div>
		) : null;

		const hasSearchedDomains = Array.isArray( this.props.step?.domainForm?.searchResults );
		const shouldShowSkip = this.props.allowSkipWithoutSearch || hasSearchedDomains;

		const content = [
			shouldUseMultipleDomainsInCart( flowName ) &&
			( domainsInCart.length > 0 || this.state.wpcomSubdomainSelected )
				? this.getDomainsMiniCart( domainsInCart )
				: ! this.shouldHideDomainExplainer() &&
				  shouldShowSkip && (
						<div className="domains__domain-side-content domains__free-domain">
							<SideExplainer
								onClick={ this.handleDomainExplainerClick }
								type={
									this.props.isPlanSelectionAvailableLaterInFlow
										? 'free-domain-explainer-check-paid-plans'
										: 'free-domain-explainer'
								}
								flowName={ flowName }
							/>
						</div>
				  ),
			useYourDomain,
			this.shouldDisplayDomainOnlyExplainer() && (
				<div className="domains__domain-side-content">
					<SideExplainer
						onClick={ this.handleDomainExplainerClick }
						type="free-domain-only-explainer"
					/>
				</div>
			),
		];

		const nonEmptyElements = Children.toArray( content ).filter( isValidElement );

		if ( nonEmptyElements.length === 0 ) {
			return null;
		}

		return (
			<div
				className={ clsx( 'domains__domain-side-content-container', {
					'is-sticky': !! useYourDomain,
				} ) }
			>
				{ nonEmptyElements }
			</div>
		);
	};

	showSkipButton = () => {
		const { showSkipButton, shouldUseDomainSearchV2 } = this.props;

		if ( showSkipButton || ! shouldUseDomainSearchV2 ) {
			return showSkipButton;
		}

		return ! this.shouldHideDomainExplainer();
	};

	domainForm = () => {
		const initialState = this.props.step?.domainForm ?? {};

		// If it's the first load, rerun the search with whatever we get from the query param or signup dependencies.
		const initialQuery =
			this.props.suggestion ||
			get( this.props, 'queryObject.new', '' ) ||
			get( this.props, 'signupDependencies.suggestedDomain' );

		// Search using the initial query but do not show the query on the search input field.
		const hideInitialQuery = get( this.props, 'queryObject.hide_initial_query', false ) === 'yes';
		initialState.hideInitialQuery = hideInitialQuery;

		if (
			// If we landed here from /domains Search or with a suggested domain.
			initialQuery &&
			this.searchOnInitialRender
		) {
			this.searchOnInitialRender = false;
			if ( initialState ) {
				initialState.searchResults = null;
				initialState.subdomainSearchResults = null;
				// If length is less than 2 it will not fetch any data.
				// filter before counting length
				initialState.loadingResults =
					getDomainSuggestionSearch( getFixedDomainSearch( initialQuery ) ).length >= 2;
			}
		}

		let showExampleSuggestions = this.props.showExampleSuggestions;
		if ( 'undefined' === typeof showExampleSuggestions ) {
			showExampleSuggestions = true;
		}

		const includeWordPressDotCom = this.props.includeWordPressDotCom ?? ! this.props.isDomainOnly;
		const promoTlds = this.props?.queryObject?.tld?.split( ',' ) ?? null;

		const RegisterDomainStepComponent = this.props.shouldUseDomainSearchV2
			? RegisterDomainStepV2
			: RegisterDomainStep;

		return (
			<RegisterDomainStepComponent
				key="domainForm"
				path={ this.props.path }
				domainAndPlanUpsellFlow={ this.props.domainAndPlanUpsellFlow }
				onDomainsAvailabilityChange={ this.props.onDomainsAvailabilityChange }
				initialState={ initialState }
				onAddDomain={ this.handleAddDomain }
				onMappingError={ this.handleDomainMappingError }
				checkDomainAvailabilityPromises={ this.state.checkDomainAvailabilityPromises }
				isCartPendingUpdate={ this.props.shoppingCartManager.isPendingUpdate }
				isCartPendingUpdateDomain={ this.state.isCartPendingUpdateDomain }
				products={ this.props.productsList }
				basePath={ this.props.path }
				promoTlds={ promoTlds }
				hideMatchReasons={ this.props.hideMatchReasons }
				mapDomainUrl={ this.getUseYourDomainUrl() }
				otherManagedSubdomains={ this.props.otherManagedSubdomains }
				otherManagedSubdomainsCountOverride={ this.props.otherManagedSubdomainsCountOverride }
				transferDomainUrl={ this.getUseYourDomainUrl() }
				useYourDomainUrl={ this.getUseYourDomainUrl() }
				onAddMapping={ this.handleAddMapping.bind( this, { sectionName: 'domainForm' } ) }
				onSave={ this.handleSave.bind( this, 'domainForm' ) }
				offerUnavailableOption={ ! this.props.isDomainOnly }
				isDomainOnly={ this.props.isDomainOnly }
				analyticsSection={ this.getAnalyticsSection() }
				domainsWithPlansOnly={ this.props.domainsWithPlansOnly }
				includeWordPressDotCom={ includeWordPressDotCom }
				includeOwnedDomainInSuggestions={ ! this.props.isDomainOnly }
				includeDotBlogSubdomain={ this.shouldIncludeDotBlogSubdomain() }
				isSignupStep
				isPlanSelectionAvailableInFlow={ this.props.isPlanSelectionAvailableLaterInFlow }
				showExampleSuggestions={ showExampleSuggestions }
				suggestion={ initialQuery }
				designType={ this.getDesignType() }
				vendor={ getSuggestionsVendor( {
					isSignup: true,
					isDomainOnly: this.props.isDomainOnly,
					flowName: this.props.flowName,
				} ) }
				deemphasiseTlds={ this.props.flowName === 'ecommerce' ? [ 'blog' ] : [] }
				selectedSite={ this.props.selectedSite }
				onSkip={ this.handleSkip }
				hideFreePlan={ this.handleSkip }
				forceHideFreeDomainExplainerAndStrikeoutUi={
					this.props.forceHideFreeDomainExplainerAndStrikeoutUi
				}
				isOnboarding
				sideContent={
					! this.props.useStepperWrapper &&
					! shouldUseStepContainerV2( this.props.flowName ) &&
					this.getSideContent()
				}
				isInLaunchFlow={ 'launch-site' === this.props.flowName }
				promptText={
					isHostingSignupFlow( this.props.flowName )
						? this.props.translate( 'Stand out with a short and memorable domain' )
						: undefined
				}
				wpcomSubdomainSelected={ this.state.wpcomSubdomainSelected }
				temporaryCart={ this.state.temporaryCart }
				domainRemovalQueue={ this.state.domainRemovalQueue }
				forceExactSuggestion={ this.props?.queryObject?.source === 'general-settings' }
				replaceDomainFailedMessage={ this.state.replaceDomainFailedMessage }
				dismissReplaceDomainFailed={ this.dismissReplaceDomainFailed }
				handleClickUseYourDomain={ this.handleUseYourDomainClick }
				showAlreadyOwnADomain={ this.props.showAlreadyOwnADomain }
				// RegisterDomainStepComponentV2 props below
				showSkipButton={ this.showSkipButton() }
				onContinue={ this.goToNext }
				onRemoveDomain={ ( cartItem ) => this.removeDomainClickHandler( cartItem )() }
				showFreeDomainPromo={ ! this.shouldHideDomainExplainer() }
				isMiniCartContinueButtonBusy={ this.state.isMiniCartContinueButtonBusy }
				shouldRenderUseYourDomain={ ! this.shouldHideUseYourDomain() }
			/>
		);
	};

	dismissReplaceDomainFailed = () => {
		this.setState( { replaceDomainFailedMessage: null } );
	};

	onUseMyDomainConnect = ( { domain } ) => {
		this.handleAddMapping( { sectionName: 'useYourDomainForm', domain } );
	};

	insertUrlParams( params ) {
		if ( history.pushState ) {
			const searchParams = new URLSearchParams( window.location.search );

			Object.entries( params ).forEach( ( [ key, value ] ) => searchParams.set( key, value ) );
			const newUrl =
				window.location.protocol +
				'//' +
				window.location.host +
				window.location.pathname +
				'?' +
				decodeURIComponent( searchParams.toString() );
			window.history.pushState( { path: newUrl }, '', newUrl );
		}
	}

	setCurrentFlowStep( { mode, domain } ) {
		this.setState( { currentStep: mode }, () => {
			this.insertUrlParams( { step: this.state.currentStep, initialQuery: domain } );
		} );
	}

	useYourDomainForm = () => {
		const queryObject = parse( window.location.search.replace( '?', '' ) );
		const initialQuery = get( this.props.step, 'domainForm.lastQuery' ) || queryObject.initialQuery;

		return (
			<div className="domains__step-section-wrapper" key="useYourDomainForm">
				<UseMyDomain
					analyticsSection={ this.getAnalyticsSection() }
					basePath={ this.props.path }
					initialQuery={ initialQuery }
					initialMode={ queryObject.step ?? inputMode.domainInput }
					onNextStep={ this.setCurrentFlowStep }
					isSignupStep
					onTransfer={ this.handleAddTransfer }
					onConnect={ this.onUseMyDomainConnect }
					onSkip={ () => this.handleSkip( undefined, false ) }
				/>
			</div>
		);
	};

	getSkipStepButton() {
		const { shouldUseDomainSearchV2, flowName, translate } = this.props;

		if ( ! shouldUseDomainSearchV2 || ! isNewHostedSiteCreationFlow( flowName ) ) {
			return null;
		}

		return (
			<Step.LinkButton onClick={ () => this.handleSkip( undefined, true ) }>
				{ translate( 'Decide later' ) }
			</Step.LinkButton>
		);
	}

	getSubHeaderText() {
		const { isAllDomains, stepSectionName, flowName, translate, shouldUseDomainSearchV2 } =
			this.props;

		if ( 'use-your-domain' === stepSectionName ) {
			return '';
		}

		if ( isAllDomains ) {
			return translate( 'Find the domain that defines you' );
		}

		if ( isNewHostedSiteCreationFlow( flowName ) && ! shouldUseDomainSearchV2 ) {
			return translate(
				'Help your site stand out with a custom domain. Not sure yet? {{decideLater}}Decide later{{/decideLater}}.',
				{
					components: {
						decideLater: (
							<Step.LinkButton
								css={ { color: 'inherit !important' } }
								onClick={ () => this.handleSkip( undefined, true ) }
							/>
						),
					},
				}
			);
		}

		if ( isHostingSignupFlow( flowName ) ) {
			const components = {
				span: (
					<button
						className="tailored-flow-subtitle__cta-text"
						style={ { fontWeight: 500, fontSize: '1em', display: 'inline' } }
						onClick={ () => this.handleSkip( undefined, true ) }
					/>
				),
			};

			return translate(
				'Find the perfect domain for your exciting new project or {{span}}decide later{{/span}}.',
				{ components }
			);
		}

		if ( ! stepSectionName ) {
			if ( shouldUseDomainSearchV2 && ! isDomainForGravatarFlow( flowName ) ) {
				return translate( 'Make it yours with a .com, .blog, or one of 350+ domain options.' );
			}

			return translate( 'Enter some descriptive keywords to get started.' );
		}

		return 'transfer' === stepSectionName || 'mapping' === stepSectionName
			? translate( 'Use a domain you already own with your new WordPress.com site.' )
			: translate( "Enter your site's name or some keywords that describe it to get started." );
	}

	getHeaderText() {
		const {
			headerText,
			isAllDomains,
			stepSectionName,
			translate,
			flowName,
			shouldUseDomainSearchV2,
		} = this.props;

		if ( stepSectionName === 'use-your-domain' ) {
			return '';
		}

		if ( headerText ) {
			return headerText;
		}

		if ( isAllDomains ) {
			return translate( 'Your next big idea starts here' );
		}

		if ( shouldUseDomainSearchV2 && ! isDomainForGravatarFlow( flowName ) ) {
			return translate( 'Claim your space on the web' );
		}

		if ( shouldUseMultipleDomainsInCart( flowName ) ) {
			return ! stepSectionName && translate( 'Choose your domains' );
		}
		return ! stepSectionName && translate( 'Choose a domain' );
	}

	getAnalyticsSection() {
		return this.props.analyticsSection ?? ( this.props.isDomainOnly ? 'domain-first' : 'signup' );
	}

	getContentColumns() {
		let content;
		let sideContent;

		if ( 'use-your-domain' === this.props.stepSectionName ) {
			content = this.useYourDomainForm();
		}

		if ( ! this.props.stepSectionName || this.props.isDomainOnly ) {
			content = this.domainForm();
		}

		if ( ! this.props.stepSectionName && ! this.props.shouldUseDomainSearchV2 ) {
			sideContent = this.getSideContent();
		}

		if ( this.props.step && 'invalid' === this.props.step.status ) {
			content = (
				<div className="domains__step-section-wrapper">
					<Notice status="is-error" showDismiss={ false }>
						{ this.props.step.errors.message }
					</Notice>
					{ content }
				</div>
			);
		}

		return [ content, sideContent ];
	}

	renderContent() {
		const [ content, sideContent ] = this.getContentColumns();

		return (
			<div className="domains__step-content domains__step-content-domain-step">
				{ this.props.isSideContentExperimentLoading ? (
					<Spinner width="100" />
				) : (
					<>
						{ content }
						{ sideContent }
					</>
				) }
			</div>
		);
	}

	getPreviousStepUrl() {
		if ( 'use-your-domain' !== this.props.stepSectionName ) {
			return null;
		}

		const { step, ...queryValues } = parse( window.location.search.replace( '?', '' ) );
		const currentStep = step ?? this.state?.currentStep;

		let mode = inputMode.domainInput;
		switch ( currentStep ) {
			case null:
			case inputMode.domainInput:
				return null;

			case inputMode.transferOrConnect:
				mode = inputMode.domainInput;
				break;

			case inputMode.transferDomain:
			case inputMode.ownershipVerification:
				mode = inputMode.transferOrConnect;
				break;
		}
		return getStepUrl(
			this.props.flowName,
			this.props.stepName,
			'use-your-domain',
			this.getLocale(),
			{
				step: mode,
				...queryValues,
			}
		);
	}

	removeQueryParam( url ) {
		return url.split( '?' )[ 0 ];
	}

	getUseDomainIOwnLink() {
		const { shouldUseDomainSearchV2, translate, stepSectionName, step, isSmallScreen, flowName } =
			this.props;

		const hasSearchedDomains = Array.isArray( step?.domainForm?.searchResults );

		if (
			! shouldUseDomainSearchV2 ||
			stepSectionName === 'use-your-domain' ||
			this.shouldHideUseYourDomain() ||
			! isSmallScreen ||
			! hasSearchedDomains
		) {
			return null;
		}

		if ( this.props.useStepperWrapper && shouldUseStepContainerV2( flowName ) ) {
			return (
				<Step.LinkButton onClick={ this.handleUseYourDomainClick }>
					{ translate( 'Use a domain I already own' ) }
				</Step.LinkButton>
			);
		}

		return (
			<Button
				className="step-wrapper__navigation-link forward"
				onClick={ this.handleUseYourDomainClick }
				variant="link"
			>
				<span>{ translate( 'Use a domain I already own' ) }</span>
			</Button>
		);
	}

	shouldRenderStickyNavigation() {
		if ( this.props.shouldUseDomainSearchV2 ) {
			return false;
		}

		if ( shouldUseMultipleDomainsInCart( this.props.flowName ) ) {
			return false;
		}
	}

	render() {
		if ( this.skipRender ) {
			return null;
		}

		const {
			flowName,
			stepName,
			stepSectionName,
			isAllDomains,
			translate,
			userSiteCount,
			previousStepName,
			useStepperWrapper,
			goBack,
			shouldUseDomainSearchV2,
		} = this.props;
		const siteUrl = this.props.selectedSite?.URL;
		const siteSlug = this.props.queryObject?.siteSlug;
		const source = this.props.queryObject?.source;

		let backUrl;
		let backLabelText;
		let isExternalBackUrl = false;

		/**
		 * Hide "Back" button in domains step if:
		 *   1. The user has no sites
		 *   2. This step was rendered immediately after account creation
		 *   3. The user is on the root domains step and not a child step section like use-your-domain
		 */
		const shouldHideBack =
			! userSiteCount &&
			previousStepName?.startsWith( 'user' ) &&
			stepSectionName !== 'use-your-domain' &&
			! ( isOnboardingFlow( flowName ) && !! goBack );

		const hideBack = flowName === 'domain' || shouldHideBack;

		const previousStepBackUrl = this.getPreviousStepUrl();
		const [ sitesBackLabelText, defaultBackUrl ] =
			userSiteCount && userSiteCount === 1
				? [ translate( 'Back to My Home' ), '/home' ]
				: [ translate( 'Back to sites' ), '/sites' ];

		if ( previousStepBackUrl ) {
			backUrl = previousStepBackUrl;
		} else if ( isAllDomains ) {
			backUrl = domainManagementRoot();
			backLabelText = translate( 'Back to All Domains' );
		} else if ( isDomainForGravatarFlow( flowName ) ) {
			backUrl = null;
			backLabelText = null;
		} else if ( 'with-plugin' === flowName ) {
			backUrl = '/plugins';
			backLabelText = translate( 'Back to plugins' );
		} else if ( isWithThemeFlow( flowName ) ) {
			backUrl = '/themes';
			backLabelText = translate( 'Back to themes' );
		} else if ( 'plans-first' === flowName ) {
			backUrl = getStepUrl( flowName, previousStepName );
		} else if ( isOnboardingFlow( flowName ) && !! goBack ) {
			backUrl = null;
			backLabelText = translate( 'Back' );
		} else if ( isAIBuilderFlow( flowName ) ) {
			backUrl = `${ siteUrl }/wp-admin/site-editor.php?canvas=edit&referrer=${ flowName }&p=%2F&ai-step=edit`;
			backLabelText = translate( 'Keep Editing' );
		} else if ( ! isNewHostedSiteCreationFlow( flowName ) ) {
			backUrl = getStepUrl( flowName, stepName, null, this.getLocale() );

			if ( 'site' === source && siteUrl ) {
				backUrl = siteUrl;
				backLabelText = translate( 'Back to My Site' );
				isExternalBackUrl = true;
			} else if ( 'my-home' === source && siteSlug ) {
				backUrl = `/home/${ siteSlug }`;
				backLabelText = translate( 'Back to My Home' );
			} else if ( 'general-settings' === source && siteSlug ) {
				backUrl = `/settings/general/${ siteSlug }`;
				backLabelText = translate( 'Back to General Settings' );
			} else if ( backUrl === this.removeQueryParam( this.props.path ) ) {
				backUrl = defaultBackUrl;
				backLabelText = sitesBackLabelText;
			}

			const backTo = getQueryArg( window.location.href, 'back_to' );
			if ( backTo && isRelativeUrl( backTo ) ) {
				backUrl = backTo;
				backLabelText = translate( 'Back' );
			}

			const externalBackUrl = getExternalBackUrl( source, stepSectionName );
			if ( externalBackUrl ) {
				backUrl = externalBackUrl;
				backLabelText = translate( 'Back' );
				// Solves route conflicts between LP and calypso (ex. /domains).
				isExternalBackUrl = true;
			}
		}

		const headerText = this.getHeaderText();
		const fallbackSubHeaderText = this.getSubHeaderText();

		if ( this.props.render ) {
			const [ content, sideContent ] = this.getContentColumns();

			const mainContent = (
				<>
					<QueryProductsList type="domains" />
					{ content }
				</>
			);

			return this.props.render( {
				mainContent,
				sideContent,
			} );
		}

		if ( this.props.useStepperWrapper && shouldUseStepContainerV2( flowName ) ) {
			const [ content, sideContent ] = this.getContentColumns();

			const backButton = ( backUrl || goBack ) && (
				<Step.BackButton
					href={ backUrl }
					rel={ isExternalBackUrl ? 'external' : '' }
					onClick={ goBack }
				>
					{ backLabelText }
				</Step.BackButton>
			);

			const mainContent = (
				<>
					<QueryProductsList type="domains" />
					{ content }
				</>
			);

			return (
				<Step.TwoColumnLayout
					firstColumnWidth={ 7 }
					secondColumnWidth={ 3 }
					topBar={
						<Step.TopBar
							leftElement={ ! hideBack && backButton }
							rightElement={ this.getUseDomainIOwnLink() ?? this.getSkipStepButton() }
						/>
					}
					heading={ <Step.Heading text={ headerText } subText={ fallbackSubHeaderText } /> }
					className="domains__step-content domains__step-content-domain-step"
					noBottomPadding={ shouldUseDomainSearchV2 }
				>
					{ mainContent }
					{ sideContent }
				</Step.TwoColumnLayout>
			);
		}

		if ( useStepperWrapper ) {
			return (
				// This is biased towards Stepper. It will always load Stepper's StepContainer but only load /start's StepWrapper if /start is used.
				// This is because Stepper's domains page is much more likely (90%+ of the time) to be used than /start's plans page.
				<StepContainer
					hideBack={ hideBack }
					flowName={ flowName }
					stepName={ stepName }
					backUrl={ backUrl }
					isExternalBackUrl={ isExternalBackUrl }
					shouldHideNavButtons={ false }
					stepContent={
						<div>
							<QueryProductsList type="domains" />
							{ this.renderContent() }
						</div>
					}
					formattedHeader={
						<FormattedHeader
							id="domains-header"
							align="center"
							headerText={ headerText }
							subHeaderText={ fallbackSubHeaderText }
						/>
					}
					backLabelText={ backLabelText }
					hideSkip={ ! shouldUseDomainSearchV2 || AI_SITE_BUILDER_FLOW !== flowName }
					skipLabelText={ translate( 'Decide later' ) }
					onSkip={ () => this.handleSkip( undefined, true ) }
					align="center"
					isWideLayout
					goBack={ goBack }
					recordTracksEvent={ this.props.recordTracksEvent }
				/>
			);
		}

		const useDomainIOwnLink = this.getUseDomainIOwnLink();

		return (
			<AsyncLoad
				require="calypso/signup/step-wrapper"
				hideBack={ hideBack }
				flowName={ flowName }
				stepName={ stepName }
				backUrl={ backUrl }
				positionInFlow={ this.props.positionInFlow }
				headerText={ headerText }
				subHeaderText={ fallbackSubHeaderText }
				isExternalBackUrl={ isExternalBackUrl }
				fallbackHeaderText={ headerText }
				fallbackSubHeaderText={ fallbackSubHeaderText }
				shouldHideNavButtons={ false }
				stepContent={
					<div>
						<QueryProductsList type="domains" />
						{ this.renderContent() }
					</div>
				}
				allowBackFirstStep={ !! backUrl }
				backLabelText={ backLabelText }
				hideSkip
				goToNextStep={ this.handleSkip }
				align="center"
				isWideLayout
				isSticky={ this.shouldRenderStickyNavigation() }
				customizedActionButtons={ useDomainIOwnLink }
			/>
		);
	}
}

const StyleWrappedDomainsStepComponent = ( props ) => {
	const [ isLoading, shouldUseDomainSearchV2 ] = useIsDomainSearchV2Enabled( props.flowName );

	if ( isLoading ) {
		if ( props.useStepperWrapper && shouldUseStepContainerV2( props.flowName ) ) {
			return <Step.Loading />;
		}

		// TODO: Add a loading state to indicate that the experiment is loading.
		return null;
	}

	return (
		<>
			<RenderDomainsStepComponent
				{ ...props }
				shouldUseDomainSearchV2={ shouldUseDomainSearchV2 }
			/>
			{ ! shouldUseDomainSearchV2 && (
				<BodySectionCssClass bodyClass={ [ 'domain-search-legacy--unified' ] } />
			) }
		</>
	);
};

export const RenderDomainsStep = withViewportMatch( {
	isSmallScreen: '>= small',
	isDesktop: '>= large',
} )( StyleWrappedDomainsStepComponent );

export const submitDomainStepSelection = ( suggestion, section ) => {
	let domainType = 'domain_reg';
	if ( suggestion.is_free ) {
		domainType = 'wpcom_subdomain';
		if ( suggestion.domain_name.endsWith( '.blog' ) ) {
			domainType = 'dotblog_subdomain';
		}
	}

	const tracksObjects = {
		domain_name: suggestion.domain_name,
		section,
		type: domainType,
	};
	if ( suggestion.isRecommended ) {
		tracksObjects.label = 'recommended';
	}
	if ( suggestion.isBestAlternative ) {
		tracksObjects.label = 'best-alternative';
	}

	return composeAnalytics(
		recordGoogleEvent(
			'Domain Search',
			`Submitted Domain Selection for a ${ domainType } on a Domain Registration`,
			'Domain Name',
			suggestion.domain_name
		),
		recordTracksEvent( 'calypso_domain_search_submit_step', tracksObjects )
	);
};

const RenderDomainsStepConnect = connect(
	( state, { steps, flowName, stepName, previousStepName } ) => {
		const productsList = getAvailableProductsList( state );
		const productsLoaded = ! isEmpty( productsList );
		const isPlanStepSkipped = isPlanStepExistsAndSkipped( state );
		const selectedSite = getSelectedSite( state );
		const multiDomainDefaultPlan = planItem( PLAN_PERSONAL );
		const userLoggedIn = isUserLoggedIn( state );

		return {
			designType: getDesignType( state ),
			currentUser: getCurrentUser( state ),
			productsList,
			productsLoaded,
			selectedSite,
			sites: getSitesItems( state ),
			userSiteCount: getCurrentUserSiteCount( state ),
			isPlanSelectionAvailableLaterInFlow:
				( ! isPlanStepSkipped && isPlanSelectionAvailableLaterInFlow( steps ) ) ||
				[ 'pro', 'starter' ].includes( flowName ),
			userLoggedIn,
			multiDomainDefaultPlan,
			previousStepName: previousStepName || getPreviousStepName( flowName, stepName, userLoggedIn ),
		};
	},
	{
		recordAddDomainButtonClick,
		recordAddDomainButtonClickInMapDomain,
		recordAddDomainButtonClickInTransferDomain,
		recordAddDomainButtonClickInUseYourDomain,
		recordUseYourDomainButtonClick,
		removeStep,
		submitDomainStepSelection,
		setDesignType,
		saveSignupStep,
		submitSignupStep,
		recordTracksEvent,
		fetchUsernameSuggestion,
	}
)( withCartKey( withShoppingCart( localize( RenderDomainsStep ) ) ) );

export default function DomainsStep( props ) {
	// this is kept since there will likely be more experiments to come.
	// See peP6yB-1Np-p2
	const isSideContentExperimentLoading = false;

	return (
		<CalypsoShoppingCartProvider>
			<RenderDomainsStepConnect
				{ ...props }
				isSideContentExperimentLoading={ isSideContentExperimentLoading }
			/>
		</CalypsoShoppingCartProvider>
	);
}
