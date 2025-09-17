/* eslint-disable wpcalypso/jsx-classname-namespace */
import {
	StepContainer,
	COPY_SITE_FLOW,
	isCopySiteFlow,
	NEWSLETTER_FLOW,
	DOMAIN_UPSELL_FLOW,
	HUNDRED_YEAR_PLAN_FLOW,
	isDomainUpsellFlow,
	isHundredYearDomainFlow,
	HUNDRED_YEAR_DOMAIN_FLOW,
} from '@automattic/onboarding';
import { useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { useI18n } from '@wordpress/react-i18n';
import { useState } from 'react';
import FormattedHeader from 'calypso/components/formatted-header';
import BodySectionCssClass from 'calypso/layout/body-section-css-class';
import {
	domainRegistration,
	domainMapping,
	domainTransfer,
} from 'calypso/lib/cart-values/cart-items';
import { useIsDomainSearchV2Enabled } from 'calypso/lib/domains/use-domain-search-v2';
import { useDispatch as useReduxDispatch } from 'calypso/state';
import {
	composeAnalytics,
	recordGoogleEvent,
	recordTracksEvent,
} from 'calypso/state/analytics/actions';
import {
	recordAddDomainButtonClick,
	recordAddDomainButtonClickInMapDomain,
	recordAddDomainButtonClickInTransferDomain,
} from 'calypso/state/domains/actions';
import useChangeSiteDomainIfNeeded from '../../../../hooks/use-change-site-domain-if-needed';
import { ONBOARD_STORE } from '../../../../stores';
import HundredYearPlanStepWrapper from '../hundred-year-plan-step-wrapper';
import { DomainFormControl } from './domain-form-control';
import type { Step } from '../../types';
import type { DomainSuggestion } from '@automattic/api-core';
import './style.scss';

const DomainsStep: Step< {
	submits:
		| {
				freeDomain?: boolean;
				domainName?: string;
				productSlug?: string;
				domainItem?: DomainSuggestion;
				deferDomainSelection?: true;
				// Fake type just to make the this step types isomorphic to unified-domains.
				domainCart?: undefined;
		  }
		| undefined;
} > = function DomainsStep( { navigation, flow } ) {
	const shouldUseDomainSearchV2 = useIsDomainSearchV2Enabled();
	const { setHideFreePlan, setDomainCartItem, setDomain } = useDispatch( ONBOARD_STORE );
	const { __ } = useI18n();

	const [ isCartPendingUpdate, setIsCartPendingUpdate ] = useState( false );
	const [ isCartPendingUpdateDomain, setIsCartPendingUpdateDomain ] =
		useState< DomainSuggestion >();

	const [ showUseYourDomain, setShowUseYourDomain ] = useState( false );

	const dispatch = useReduxDispatch();

	const changeSiteDomainIfNeeded = useChangeSiteDomainIfNeeded();

	const { submit, exitFlow, goBack } = navigation;

	const submitDomainStepSelection = ( suggestion: DomainSuggestion, section: string ) => {
		let domainType = 'domain_reg';
		if ( suggestion.is_free ) {
			domainType = 'wpcom_subdomain';
			if ( suggestion.domain_name.endsWith( '.blog' ) ) {
				domainType = 'dotblog_subdomain';
			}
		}

		const tracksObjects: {
			label?: string;
			domain_name: string;
			type: string;
			section: string;
		} = {
			domain_name: suggestion.domain_name,
			section,
			type: domainType,
		};
		// @ts-expect-error - isRecommended is injected by register-domain-step/utility.js
		if ( suggestion.isRecommended ) {
			tracksObjects.label = 'recommended';
		}
		// @ts-expect-error - isRecommended is injected by register-domain-step/utility.js
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

	const submitWithDomain = (
		suggestion: DomainSuggestion | undefined,
		shouldHideFreePlan = false
	) => {
		if ( ! suggestion ) {
			// No domain was selected, 'decide later' button was clicked
			setHideFreePlan( false );
			setDomainCartItem( undefined );
			setDomain( undefined );
			return submit?.( { freeDomain: true } );
		}
		// this is used mainly to change the button state to busy to show a loading indicator.
		setIsCartPendingUpdate( true );
		setIsCartPendingUpdateDomain( suggestion );

		setDomain( suggestion );

		if ( suggestion?.is_free ) {
			setHideFreePlan( false );
			setDomainCartItem( undefined );
		} else {
			const domainCartItem = domainRegistration( {
				domain: suggestion.domain_name,
				productSlug: suggestion.product_slug || '',
				extra: { flow_name: flow },
			} );
			dispatch( submitDomainStepSelection( suggestion, getAnalyticsSection() ) );

			setHideFreePlan( Boolean( suggestion.product_slug ) || shouldHideFreePlan );
			setDomainCartItem( domainCartItem );
		}

		if ( suggestion?.is_free && suggestion?.domain_name ) {
			changeSiteDomainIfNeeded( suggestion?.domain_name );
		}

		submit?.( {
			freeDomain: suggestion?.is_free,
			domainName: suggestion?.domain_name,
			productSlug: suggestion?.product_slug,
			domainItem: suggestion,
		} );
	};

	const handleSkip = ( _googleAppsCartItem = undefined, shouldHideFreePlan = false ) => {
		const tracksProperties = Object.assign(
			{
				section: getAnalyticsSection(),
				flow,
				step: 'domains',
			},
			{}
		);

		dispatch( recordTracksEvent( 'calypso_signup_skip_step', tracksProperties ) );

		if ( flow === DOMAIN_UPSELL_FLOW ) {
			return submit?.( { deferDomainSelection: true } );
		}

		submitWithDomain( undefined, shouldHideFreePlan );
	};

	const getSubHeaderText = () => {
		const decideLaterComponent = {
			span: (
				// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
				<span
					role="button"
					className="tailored-flow-subtitle__cta-text"
					onClick={ () => handleSkip() }
				/>
			),
		};

		if ( showUseYourDomain ) {
			return '';
		}

		switch ( flow ) {
			case NEWSLETTER_FLOW:
				return createInterpolateElement(
					__(
						'Make your newsletter stand out with a custom domain. Not sure yet? <span>Decide later</span>.'
					),
					decideLaterComponent
				);
			case COPY_SITE_FLOW:
				return __( 'Make your copied site unique with a custom domain all of its own.' );
			case HUNDRED_YEAR_PLAN_FLOW:
			case HUNDRED_YEAR_DOMAIN_FLOW:
				return __( 'Secure your 100-Year domain and start building your legacy.' );
			default:
				return shouldUseDomainSearchV2
					? __( 'Make it yours with a .com, .blog, or one of 350+ domain options.' )
					: createInterpolateElement(
							__(
								'Help your site stand out with a custom domain. Not sure yet? <span>Decide later</span>.'
							),
							decideLaterComponent
					  );
		}
	};

	const getHeaderText = () => {
		if ( showUseYourDomain ) {
			return '';
		}

		if ( flow === NEWSLETTER_FLOW ) {
			return __( 'Your domain. Your identity.' );
		}

		if ( [ HUNDRED_YEAR_PLAN_FLOW, HUNDRED_YEAR_DOMAIN_FLOW ].includes( flow ) ) {
			return __( 'Find the perfect domain' );
		}

		if ( shouldUseDomainSearchV2 ) {
			return __( 'Claim your space on the web' );
		}

		return __( 'Choose a domain' );
	};

	function getAnalyticsSection() {
		return 'signup';
	}

	const handleAddTransfer = ( { domain, authCode }: { domain: string; authCode: string } ) => {
		const domainCartItem = domainTransfer( {
			domain,
			extra: {
				auth_code: authCode,
				signup: true,
			},
		} );

		dispatch( recordAddDomainButtonClickInTransferDomain( domain, getAnalyticsSection(), flow ) );

		setDomainCartItem( domainCartItem );
		submit( undefined );
	};

	const handleAddMapping = ( domain: string ) => {
		const domainCartItem = domainMapping( { domain } );

		dispatch( recordAddDomainButtonClickInMapDomain( domain, getAnalyticsSection(), flow ) );

		setDomainCartItem( domainCartItem );

		submit( undefined );
	};

	const handleAddDomain = ( suggestion: DomainSuggestion, position: number ) => {
		dispatch(
			recordAddDomainButtonClick(
				suggestion.domain_name,
				getAnalyticsSection(),
				position,
				suggestion?.is_premium,
				flow,
				suggestion?.vendor
			)
		);

		submitWithDomain( suggestion );
	};

	const onUseYourDomainClick = ( domain?: string ) => {
		if ( domain && isHundredYearDomainFlow( flow ) ) {
			const leaveFlowFunction = exitFlow ?? window.location.assign;
			leaveFlowFunction( `/setup/hundred-year-domain-transfer/domains?new=${ domain }` );
			return;
		}

		setShowUseYourDomain( true );
	};

	const renderContent = () => (
		<DomainFormControl
			// TODO: Implement this in DOTOBRD-233.
			onContinue={ () => {} }
			analyticsSection={ getAnalyticsSection() }
			flow={ flow }
			onAddDomain={ handleAddDomain }
			onAddMapping={ handleAddMapping }
			onAddTransfer={ handleAddTransfer }
			onSkip={ handleSkip }
			onUseYourDomainClick={ onUseYourDomainClick }
			showUseYourDomain={ showUseYourDomain }
			isCartPendingUpdate={ isCartPendingUpdate }
			isCartPendingUpdateDomain={ isCartPendingUpdateDomain }
		/>
	);

	const handleGoBack = ( goBack: ( () => void ) | undefined ) => {
		if ( showUseYourDomain ) {
			return setShowUseYourDomain( false );
		}

		if ( isDomainUpsellFlow( flow ) ) {
			return goBack?.();
		}
		return exitFlow?.( '/sites' );
	};

	const getBackLabelText = () => {
		if ( isDomainUpsellFlow( flow ) ) {
			return __( 'Back' );
		}
		return __( 'Back to sites' );
	};

	const shouldHideBackButton = () => {
		if ( isDomainUpsellFlow( flow ) ) {
			return false;
		}
		return ! isCopySiteFlow( flow );
	};

	if ( [ HUNDRED_YEAR_PLAN_FLOW, HUNDRED_YEAR_DOMAIN_FLOW ].includes( flow ) ) {
		return (
			<HundredYearPlanStepWrapper
				stepName="domains"
				flowName={ flow as string }
				stepContent={ <div className="domains__content">{ renderContent() }</div> }
				formattedHeader={
					<FormattedHeader
						id="domains-header"
						align="center"
						headerText={ getHeaderText() }
						subHeaderText={ getSubHeaderText() }
					/>
				}
			/>
		);
	}
	return (
		<StepContainer
			stepName="domains"
			isWideLayout
			hideBack={ shouldHideBackButton() }
			backLabelText={ getBackLabelText() }
			flowName={ flow as string }
			stepContent={ <div className="domains__content">{ renderContent() }</div> }
			recordTracksEvent={ recordTracksEvent }
			goBack={ () => handleGoBack( goBack ) }
			formattedHeader={
				<FormattedHeader
					id="domains-header"
					align="center"
					headerText={ getHeaderText() }
					subHeaderText={ getSubHeaderText() }
				/>
			}
		/>
	);
};

const StyleWrappedDomainsStep: typeof DomainsStep = ( props ) => {
	const shouldUseDomainSearchV2 = useIsDomainSearchV2Enabled();

	return (
		<>
			<DomainsStep { ...props } />
			{ ! shouldUseDomainSearchV2 && (
				<BodySectionCssClass bodyClass={ [ 'domain-search-legacy--stepper' ] } />
			) }
		</>
	);
};

export default StyleWrappedDomainsStep;
