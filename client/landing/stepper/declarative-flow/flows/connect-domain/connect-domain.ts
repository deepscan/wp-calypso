import { CONNECT_DOMAIN_FLOW } from '@automattic/onboarding';
import { useSelect, useDispatch } from '@wordpress/data';
import { translate } from 'i18n-calypso';
import { useEffect, useMemo } from 'react';
import { useFlowLocale } from 'calypso/landing/stepper/hooks/use-flow-locale';
import { domainMapping } from 'calypso/lib/cart-values/cart-items';
import { triggerGuidesForStep } from 'calypso/lib/guides/trigger-guides-for-step';
import {
	clearSignupDestinationCookie,
	setSignupCompleteSlug,
	persistSignupDestination,
	setSignupCompleteFlowName,
} from 'calypso/signup/storageUtils';
import { STEPPER_TRACKS_EVENT_STEP_NAV_SUBMIT } from '../../../constants';
import { useDomainParams } from '../../../hooks/use-domain-params';
import { USER_STORE, ONBOARD_STORE } from '../../../stores';
import { useLoginUrl } from '../../../utils/path';
import { STEPS } from '../../internals/steps';
import { redirect } from '../../internals/steps-repository/import/util';
import {
	AssertConditionResult,
	AssertConditionState,
	Flow,
	ProvidedDependencies,
} from '../../internals/types';
import type { UserSelect } from '@automattic/data-stores';

const CONNECT_DOMAIN_STEPS = [ STEPS.PLANS, STEPS.SITE_CREATION_STEP, STEPS.PROCESSING ];

const connectDomain: Flow = {
	name: CONNECT_DOMAIN_FLOW,
	get title() {
		return translate( 'Connect your domain' );
	},
	isSignupFlow: false,
	useAssertConditions: () => {
		const { domain, provider } = useDomainParams();
		const flowName = CONNECT_DOMAIN_FLOW;

		const locale = useFlowLocale();

		let result: AssertConditionResult = { state: AssertConditionState.SUCCESS };
		const userIsLoggedIn = useSelect(
			( select ) => ( select( USER_STORE ) as UserSelect ).isCurrentUserLoggedIn(),
			[]
		);

		if ( ! domain ) {
			redirect( '/start' );
			result = {
				state: AssertConditionState.FAILURE,
				message: 'connect-domain requires a domain query parameter',
			};
		}

		const logInUrl = useLoginUrl( {
			variationName: flowName,
			redirectTo: `/setup/${ flowName }/plans?domain=${ domain }&provider=${ provider }}`,
			pageTitle: 'Connect your Domain',
			locale,
		} );

		// Despite sending a CHECKING state, this function gets called again with the
		// /setup/blog/blogger-intent route which has no locale in the path so we need to
		// redirect off of the first render.
		// This effects both /setup/blog/<locale> starting points and /setup/blog/blogger-intent/<locale> urls.
		// The double call also hapens on urls without locale.
		useEffect( () => {
			if ( ! userIsLoggedIn ) {
				redirect( logInUrl );
			}
		}, [] );

		if ( ! userIsLoggedIn ) {
			return {
				state: AssertConditionState.FAILURE,
			};
		}

		return result;
	},
	useSideEffect() {
		const { domain } = useDomainParams();
		const { setHideFreePlan, setDomainCartItem } = useDispatch( ONBOARD_STORE );

		useEffect( () => {
			if ( domain ) {
				setHideFreePlan( true );
				const domainCartItem = domainMapping( { domain } );
				setDomainCartItem( domainCartItem );
			}
		}, [] );
	},
	useSteps() {
		return CONNECT_DOMAIN_STEPS;
	},
	useTracksEventProps() {
		const { domain, provider } = useDomainParams();

		return useMemo(
			() => ( {
				eventsProperties: {
					[ STEPPER_TRACKS_EVENT_STEP_NAV_SUBMIT ]: {
						domain,
						provider,
					},
				},
			} ),
			[ domain, provider ]
		);
	},
	useStepNavigation( _currentStepSlug, navigate ) {
		const flowName = this.name;
		const { domain } = useDomainParams();

		triggerGuidesForStep( flowName, _currentStepSlug );

		const submit = ( providedDependencies: ProvidedDependencies = {} ) => {
			switch ( _currentStepSlug ) {
				case 'plans':
					clearSignupDestinationCookie();
					return navigate( 'create-site' );

				case 'create-site':
					return navigate( 'processing' );

				case 'processing': {
					const destination = `/domains/mapping/${ providedDependencies.siteSlug }/setup/${ domain }?firstVisit=true`;
					persistSignupDestination( destination );
					setSignupCompleteSlug( providedDependencies?.siteSlug );
					setSignupCompleteFlowName( flowName );
					const returnUrl = encodeURIComponent( destination );

					return window.location.assign(
						`/checkout/${ encodeURIComponent(
							( providedDependencies?.siteSlug as string ) ?? ''
						) }?redirect_to=${ returnUrl }&signup=1`
					);
				}
			}
			return providedDependencies;
		};

		return {
			submit,
		};
	},
};

export default connectDomain;
