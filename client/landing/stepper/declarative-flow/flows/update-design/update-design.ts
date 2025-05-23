import { Onboard, useLaunchpad } from '@automattic/data-stores';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { translate } from 'i18n-calypso';
import { useLaunchpadDecider } from 'calypso/landing/stepper/declarative-flow/internals/hooks/use-launchpad-decider';
import { useSite } from 'calypso/landing/stepper/hooks/use-site';
import { getStepFromURL } from 'calypso/landing/stepper/utils/get-flow-from-url';
import {
	setSignupCompleteSlug,
	persistSignupDestination,
	setSignupCompleteFlowName,
} from 'calypso/signup/storageUtils';
import { shouldShowLaunchpadFirst } from 'calypso/state/selectors/should-show-launchpad-first';
import { useQuery } from '../../../hooks/use-query';
import { useSiteIdParam } from '../../../hooks/use-site-id-param';
import { useSiteSlug } from '../../../hooks/use-site-slug';
import { ONBOARD_STORE } from '../../../stores';
import { useRedirectDesignSetupOldSlug } from '../../helpers/use-redirect-design-setup-old-slug';
import { STEPS } from '../../internals/steps';
import { ProcessingResult } from '../../internals/steps-repository/processing-step/constants';
import { ProvidedDependencies } from '../../internals/types';
import type { Flow } from '../../internals/types';

const updateDesign: Flow = {
	name: 'update-design',
	get title() {
		return translate( 'Choose Design' );
	},
	isSignupFlow: false,
	useSteps() {
		return [ STEPS.DESIGN_SETUP, STEPS.PROCESSING, STEPS.ERROR ];
	},
	useSideEffect() {
		const { setIntent } = useDispatch( ONBOARD_STORE );

		useEffect( () => {
			setIntent( Onboard.SiteIntent.UpdateDesign );
		}, [] );
	},
	useTracksEventProps() {
		const site = useSite();
		const step = getStepFromURL();
		if ( site && shouldShowLaunchpadFirst( site ) && step === 'launchpad' ) {
			//prevent track events from firing until we're sure we won't redirect away from Launchpad
			return {
				isLoading: true,
				eventsProperties: {},
			};
		}

		return {
			isLoading: false,
			eventsProperties: {},
		};
	},

	useStepNavigation( currentStep, navigate ) {
		const siteId = useSiteIdParam();
		const siteSlug = useSiteSlug();
		const flowToReturnTo = useQuery().get( 'flowToReturnTo' ) || 'free';
		const { setPendingAction } = useDispatch( ONBOARD_STORE );
		const { data: { launchpad_screen: launchpadScreenOption } = {} } = useLaunchpad( siteSlug );

		const exitFlow = ( to: string ) => {
			setPendingAction( () => {
				return new Promise( () => {
					window.location.assign( to );
				} );
			} );

			return navigate( 'processing' );
		};

		const { getPostFlowUrl, initializeLaunchpadState } = useLaunchpadDecider( {
			exitFlow,
			navigate,
		} );

		useRedirectDesignSetupOldSlug( currentStep, navigate );

		function submit( providedDependencies: ProvidedDependencies = {} ) {
			switch ( currentStep ) {
				case 'processing': {
					initializeLaunchpadState( {
						siteId,
						siteSlug: ( providedDependencies?.siteSlug ?? siteSlug ) as string,
					} );

					const processingResult = providedDependencies.processingResult as ProcessingResult;

					if ( processingResult === ProcessingResult.FAILURE ) {
						return navigate( 'error' );
					}

					if ( launchpadScreenOption === 'skipped' ) {
						return window.location.assign( `/home/${ siteSlug }` );
					}

					return window.location.assign(
						getPostFlowUrl( {
							flow: flowToReturnTo,
							siteId,
							siteSlug: siteSlug as string,
						} )
					);
				}
				case 'design-setup':
					if ( providedDependencies?.goToCheckout ) {
						const destination = `/setup/${ flowToReturnTo }/launchpad?siteSlug=${ providedDependencies.siteSlug }`;
						persistSignupDestination( destination );
						setSignupCompleteSlug( providedDependencies?.siteSlug );
						setSignupCompleteFlowName( flowToReturnTo );
						const returnUrl = encodeURIComponent(
							`/setup/${ flowToReturnTo }/launchpad?siteSlug=${ providedDependencies?.siteSlug }`
						);

						return window.location.assign(
							`/checkout/${ encodeURIComponent(
								( providedDependencies?.siteSlug as string ) ?? ''
							) }?redirect_to=${ returnUrl }&signup=1`
						);
					}

					return navigate( `processing?siteSlug=${ siteSlug }&flowToReturnTo=${ flowToReturnTo }` );
			}
		}

		return { submit };
	},
};

export default updateDesign;
