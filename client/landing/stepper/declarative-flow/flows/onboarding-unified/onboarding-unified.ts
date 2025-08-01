import { Onboard, OnboardActions, UserSelect, Visibility } from '@automattic/data-stores';
import { ONBOARDING_UNIFIED_FLOW } from '@automattic/onboarding';
import { dispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { addQueryArgs, getQueryArgs } from '@wordpress/url';
import { translate } from 'i18n-calypso';
import { addHotJarScript } from 'calypso/lib/analytics/hotjar';
import { SIGNUP_DOMAIN_ORIGIN } from 'calypso/lib/analytics/signup';
import {
	clearSignupDestinationCookie,
	setSignupCompleteFlowName,
	persistSignupDestination,
	setSignupCompleteSlug,
} from 'calypso/signup/storageUtils';
import { useQuery } from '../../../hooks/use-query';
import { ONBOARD_STORE, USER_STORE } from '../../../stores';
import { usePurchasePlanNotification } from '../../internals/hooks/use-purchase-plan-notification';
import { STEPS } from '../../internals/steps';
import { ProcessingResult } from '../../internals/steps-repository/processing-step/constants';
import type { FlowV2, SubmitHandler, ProvidedDependencies } from '../../internals/types';

function initialize() {
	const { setHidePlansFeatureComparison, setIntent } = dispatch( ONBOARD_STORE ) as OnboardActions;

	// Set up the flow defaults
	setHidePlansFeatureComparison( false ); // Show plan comparisons for conversion
	clearSignupDestinationCookie();
	setIntent( Onboard.SiteIntent.Build ); // Default to build intent

	// Minimal flow: plans -> siteless checkout -> post-checkout processing
	// No login required - authentication will happen during checkout
	// Need processing and post-checkout steps for Commerce plan atomic conversion
	return [ STEPS.UNIFIED_PLANS, STEPS.POST_CHECKOUT_ONBOARDING, STEPS.PROCESSING, STEPS.ERROR ];
}

const onboardingUnifiedFlow: FlowV2< typeof initialize > = {
	name: ONBOARDING_UNIFIED_FLOW,
	__experimentalUseBuiltinAuth: true,
	isSignupFlow: true,
	initialize,
	useStepNavigation( _currentStep, navigate ) {
		const flowName = this.name;
		const userIsLoggedIn = useSelect(
			( select ) => ( select( USER_STORE ) as UserSelect ).isCurrentUserLoggedIn(),
			[]
		);
		const query = useQuery();

		const { setSignupDomainOrigin } = dispatch( ONBOARD_STORE ) as OnboardActions;
		const { setShouldShowNotification } = usePurchasePlanNotification();

		/**
		 * Get post-checkout destination for onboarding-unified flow
		 */
		const getPostCheckoutDestination = ( providedDependencies: ProvidedDependencies ): string => {
			// For onboarding-unified, redirect to site-setup/goals like the old flows
			if ( providedDependencies.siteSlug ) {
				return addQueryArgs( '/setup/site-setup/goals', {
					siteSlug: providedDependencies.siteSlug,
					ref: flowName,
				} );
			}
			// Fallback to generic home if no siteSlug
			return '/';
		};

		/**
		 * Handle step submissions for the onboarding unified flow
		 */
		const submit: SubmitHandler< typeof initialize > = async ( submittedStep ) => {
			const { slug, providedDependencies } = submittedStep;

			switch ( slug ) {
				case 'plans': {
					// Set domain origin as not set since this flow skips domain selection
					setSignupDomainOrigin( SIGNUP_DOMAIN_ORIGIN.NOT_SET );

					// Create minimal siteParams for post-checkout site creation
					const siteParams = {
						blog_name: '', // Will be auto-generated from username if empty
						blog_title: translate( 'My Site' ), // Default site title
						public: Visibility.PublicNotIndexed, // Coming soon by default
						options: {
							site_creation_flow: flowName, // Track which flow created the site
							wpcom_public_coming_soon: 1, // Launch as coming soon
						},
						find_available_url: true, // Auto-find available URL since no domain was selected
						validate: false,
					};

					// Save siteParams to localStorage for checkout to use
					try {
						window.localStorage.setItem( 'siteParams', JSON.stringify( siteParams ) );
					} catch ( error ) {
						// Silently fail if localStorage is not available
					}

					// Redirect directly to siteless checkout with selected plan
					if ( providedDependencies?.cartItems?.length ) {
						// Set completion tracking for post-checkout site creation
						setSignupCompleteFlowName( flowName );

						// Set the post-checkout destination to go through onboarding-unified flow steps
						// Use our own flow's post-checkout step instead of borrowing from regular onboarding
						persistSignupDestination( `/setup/${ flowName }/post-checkout-onboarding` );

						// Get the selected plan from cartItems
						const planItem = providedDependencies.cartItems.find( ( item ) => item.product_slug );

						if ( planItem ) {
							// Use dedicated onboarding-unified siteless checkout with plan in URL (similar to Jetpack/Akismet)
							// Preserve current query parameters for checkout
							const currentQueryArgs = getQueryArgs( window.location.href );
							const cancelUrl = addQueryArgs( `/setup/${ flowName }/plans`, currentQueryArgs );

							const checkoutParams: Record< string, string | number > = {
								flow: flowName,
								cancel_to: cancelUrl,
							};

							// Only add signup=1 for logged-out users to avoid account creation conflicts
							if ( ! userIsLoggedIn ) {
								checkoutParams.signup = 1;
							}

							// Preserve parameters consistent with old flows
							const paramsToPreserve = [ 'coupon', 'ref', 'source' ];
							paramsToPreserve.forEach( ( param ) => {
								const value = query.get( param );
								if ( value ) {
									checkoutParams[ param ] = value;
								}
							} );

							const checkoutUrl = addQueryArgs(
								`/checkout/unified/${ planItem.product_slug }`,
								checkoutParams
							);
							return window.location.assign( checkoutUrl );
						}
					}

					// Fallback to error if no plan selected
					return navigate( 'error' );
				}

				case 'post-checkout-onboarding':
					setShouldShowNotification( providedDependencies?.siteId );
					return navigate( 'processing' );

				case 'processing': {
					// Handle final redirect after site setup is complete
					const destination = getPostCheckoutDestination( providedDependencies );
					if ( providedDependencies.processingResult === ProcessingResult.SUCCESS ) {
						persistSignupDestination( destination );
						setSignupCompleteSlug( providedDependencies.siteSlug );

						// Replace the location to delete processing step from history
						window.location.replace( destination );
					} else {
						// Handle errors by navigating to error step
						return navigate( 'error' );
					}
					return;
				}

				default:
					// This shouldn't happen in this flow
					return navigate( 'error' );
			}
		};

		return { submit };
	},

	useSideEffect() {
		// Load Hotjar if source is 'affiliate'
		useEffect( () => {
			const queryArgs = getQueryArgs( window.location.href );
			if ( queryArgs.source === 'affiliate' ) {
				addHotJarScript();
			}
		}, [] );
	},
};

export default onboardingUnifiedFlow;
