import { Button, Gridicon } from '@automattic/components';
import { isOnboardingFlow } from '@automattic/onboarding';
import styled from '@emotion/styled';
import { useTranslate } from 'i18n-calypso';
import { ReactNode } from 'react';
import FormattedHeader from 'calypso/components/formatted-header';
import { shouldUseStepContainerV2 } from 'calypso/landing/stepper/declarative-flow/helpers/should-use-step-container-v2';
import { SelectedFeatureData } from '../hooks/use-selected-feature';

const Subheader = styled.p< { isUsingStepContainerV2?: boolean; isVisualSplitIntent?: boolean } >`
	margin: ${ ( props ) => ( props.isVisualSplitIntent ? '-40px 0 30px 0' : '-32px 0 40px 0' ) };
	color: var( --studio-gray-60 );
	font-size: 1rem;
	text-align: ${ ( props ) => ( props.isUsingStepContainerV2 ? 'left' : 'center' ) };
	button.is-borderless {
		font-weight: ${ ( props ) => ( props.isVisualSplitIntent ? 'inherit' : '500' ) };
		color: var( --studio-gray-90 );
		text-decoration: underline;
		font-size: 16px;
		padding: 0;
	}
	@media ( max-width: 960px ) {
		margin-top: -16px;
	}
	@media ( min-width: 600px ) {
		text-align: center;
	}
`;

const SecondaryFormattedHeader = ( {
	siteSlug,
	selectedFeature,
}: {
	siteSlug?: string | null;
	selectedFeature: SelectedFeatureData | null;
} ) => {
	const translate = useTranslate();
	let headerText: ReactNode = translate( 'Upgrade your plan to access this feature and more' );
	let subHeaderText: ReactNode = (
		<Button className="plans-features-main__view-all-plans is-link" href={ `/plans/${ siteSlug }` }>
			{ translate( 'View all plans' ) }
		</Button>
	);
	if ( selectedFeature?.description ) {
		headerText = selectedFeature.description;
		subHeaderText = translate(
			'Upgrade your plan to access this feature and more. Or {{button}}view all plans{{/button}}.',
			{
				components: {
					button: (
						<Button
							className="plans-features-main__view-all-plans is-link"
							href={ `/plans/${ siteSlug }` }
						/>
					),
				},
			}
		);
	}

	return (
		<FormattedHeader
			headerText={ headerText }
			subHeaderText={ subHeaderText }
			compactOnMobile
			isSecondary
		/>
	);
};

const HeaderContainer = styled( Subheader )`
	display: flex;
	justify-content: center;
	font-size: 16px;
	font-weight: 500;
	margin-bottom: 0;

	// TODO:
	// This value is grabbed directly from https://github.com/Automattic/wp-calypso/blob/trunk/packages/plans-grid-next/src/index.tsx#L109
	// Ideally there should be a shared constant that can be reused from the CSS side.
	@media ( max-width: 740px ) {
		flex-direction: column;
	}
`;

const PrefixSection = styled.p`
	// TODO:
	// The same as above.
	@media ( max-width: 740px ) {
		margin-bottom: 4px;
	}
`;

const FeatureSection = styled.p`
	.gridicon.gridicons-checkmark {
		color: var( --studio-green-50 );
		vertical-align: middle;
		margin-left: 12px;
		margin-right: 4px;
		padding-bottom: 4px;
	}
`;

const PlanBenefitHeader = () => {
	const translate = useTranslate();

	return (
		<HeaderContainer>
			<PrefixSection>{ translate( 'All plans include:' ) }</PrefixSection>
			<FeatureSection>
				{ translate(
					'{{Checkmark}}{{/Checkmark}}Website Building{{Checkmark}}{{/Checkmark}}Hosting{{Checkmark}}{{/Checkmark}}eCommerce',
					{
						components: {
							Checkmark: <Gridicon icon="checkmark" size={ 18 } />,
						},
						comment: 'Checkmark is an icon showing a green check mark.',
					}
				) }
			</FeatureSection>
		</HeaderContainer>
	);
};

// TBD
// It is actually questionable that we implement a subheader here instead of reusing the header mechanism
// provided by the signup framework. How could we unify them?
const PlansPageSubheader = ( {
	siteSlug,
	isDisplayingPlansNeededForFeature,
	deemphasizeFreePlan,
	showPlanBenefits,
	offeringFreePlan,
	flowName,
	onFreePlanCTAClick,
	selectedFeature,
	intent,
}: {
	siteSlug?: string | null;
	isDisplayingPlansNeededForFeature: boolean;
	deemphasizeFreePlan?: boolean;
	offeringFreePlan?: boolean;
	showPlanBenefits?: boolean;
	flowName?: string | null;
	onFreePlanCTAClick: () => void;
	selectedFeature: SelectedFeatureData | null;
	intent?: string;
} ) => {
	const translate = useTranslate();

	const isOnboarding = isOnboardingFlow( flowName ?? null );

	const isUsingStepContainerV2 = Boolean( flowName && shouldUseStepContainerV2( flowName ) );

	const isVisualSplitIntent =
		intent === 'plans-wordpress-hosting' || intent === 'plans-website-builder';

	const subheaderCommonProps = {
		isUsingStepContainerV2,
		isVisualSplitIntent,
	};

	const renderSubheader = () => {
		// Website Builder intent: use the new copy
		if ( intent === 'plans-website-builder' ) {
			if ( deemphasizeFreePlan && offeringFreePlan ) {
				return (
					<Subheader { ...subheaderCommonProps }>
						{ translate(
							'Everything you need to go from idea to one-of-a-kind site, blog, or newsletter. Or {{link}}start with our free plan{{/link}}.',
							{ components: { link: <Button onClick={ onFreePlanCTAClick } borderless /> } }
						) }
					</Subheader>
				);
			}

			return (
				<Subheader { ...subheaderCommonProps }>
					{ translate(
						'Everything you need to go from idea to one-of-a-kind site, blog, or newsletter.'
					) }
				</Subheader>
			);
		}

		// WordPress Hosting intent: use hosting-specific copy
		if ( intent === 'plans-wordpress-hosting' ) {
			return (
				<Subheader { ...subheaderCommonProps }>
					{ translate(
						'All the security, flexibility, and control you need — without the overhead.'
					) }
				</Subheader>
			);
		}
		if ( deemphasizeFreePlan && offeringFreePlan ) {
			return (
				<Subheader { ...subheaderCommonProps }>
					{ translate(
						'Unlock a powerful bundle of features. Or {{link}}start with a free plan{{/link}}.',
						{
							components: {
								link: <Button onClick={ onFreePlanCTAClick } borderless />,
							},
						}
					) }
				</Subheader>
			);
		}

		if ( showPlanBenefits ) {
			return <PlanBenefitHeader />;
		}

		if ( isOnboarding ) {
			return (
				<Subheader { ...subheaderCommonProps }>
					{ translate( 'Whatever site you’re building, there’s a plan to make it happen sooner.' ) }
				</Subheader>
			);
		}

		return null;
	};

	return (
		<>
			{ renderSubheader() }
			{ isDisplayingPlansNeededForFeature && (
				<SecondaryFormattedHeader siteSlug={ siteSlug } selectedFeature={ selectedFeature } />
			) }
		</>
	);
};

export default PlansPageSubheader;
