import { REBLOGGING_FLOW } from '@automattic/onboarding';
import { getQueryArg, addQueryArgs } from '@wordpress/url';
import { translate } from 'i18n-calypso';
import { triggerGuidesForStep } from 'calypso/lib/guides/trigger-guides-for-step';
import {
	setSignupCompleteSlug,
	persistSignupDestination,
	setSignupCompleteFlowName,
} from 'calypso/signup/storageUtils';
import { stepsWithRequiredLogin } from '../../../utils/steps-with-required-login';
import { STEPS } from '../../internals/steps';
import type { Flow, ProvidedDependencies } from '../../internals/types';

const reblogging: Flow = {
	name: REBLOGGING_FLOW,
	get title() {
		return translate( 'Reblogging' );
	},
	isSignupFlow: true,
	__experimentalUseBuiltinAuth: true,
	useSteps() {
		return stepsWithRequiredLogin( [
			STEPS.DOMAINS,
			STEPS.PLANS,
			STEPS.SITE_CREATION_STEP,
			STEPS.PROCESSING,
		] );
	},

	useStepNavigation( _currentStepSlug, navigate ) {
		const flowName = this.name;

		triggerGuidesForStep( flowName, _currentStepSlug );

		const submit = ( providedDependencies: ProvidedDependencies = {} ) => {
			switch ( _currentStepSlug ) {
				case 'domains':
					return navigate( 'plans' );

				case 'plans':
					return navigate( 'create-site' );

				case 'create-site':
					return navigate( 'processing' );

				case 'processing': {
					const postToShare = getQueryArg( window.location.search, 'blog_post' );
					const processDestination = addQueryArgs( `/post/${ providedDependencies?.siteSlug }`, {
						url: postToShare,
					} );

					if ( providedDependencies?.goToCheckout ) {
						persistSignupDestination( processDestination );
						setSignupCompleteSlug( providedDependencies?.siteSlug );
						setSignupCompleteFlowName( flowName );
						const returnUrl = encodeURIComponent( processDestination );

						return window.location.assign(
							`/checkout/${ encodeURIComponent(
								( providedDependencies?.siteSlug as string ) ?? ''
							) }?redirect_to=${ returnUrl }&signup=1`
						);
					}
					return window.location.assign( processDestination );
				}
			}
			return providedDependencies;
		};

		const goBack = () => {
			return;
		};

		const goNext = async () => {
			return;
		};

		const goToStep = ( step: string ) => {
			navigate( step );
		};

		return { goNext, goBack, goToStep, submit };
	},
};

export default reblogging;
