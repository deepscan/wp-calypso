import {
	applyTestFiltersToPlansList,
	getPlan,
	FEATURE_CUSTOM_DOMAIN,
	IncompleteWPcomPlan,
	getPlanFeaturesObject,
} from '@automattic/calypso-products';
import {
	NEWSLETTER_FLOW,
	isAnyHostingFlow,
	isNewsletterFlow,
	isStartWritingFlow,
} from '@automattic/onboarding';
import { ResponseCartProduct } from '@automattic/shopping-cart';

const newsletterFeatures = ( flowName: string, plan: IncompleteWPcomPlan ) => {
	return flowName === NEWSLETTER_FLOW && plan.getNewsletterSignupFeatures;
};

const hostingFeatures = ( flowName: string, plan: IncompleteWPcomPlan ) => {
	return isAnyHostingFlow( flowName ) && plan.getHostingSignupFeatures?.( plan.term );
};

const blogOnboardingFeatures = ( flowName: string, plan: IncompleteWPcomPlan ) => {
	return isStartWritingFlow( flowName ) && plan.getBlogOnboardingSignupFeatures;
};

const senseiFeatures = ( plan: IncompleteWPcomPlan ) => plan.getSenseiFeatures?.( plan.term );

const signupFlowDefaultFeatures = ( flowName: string, plan: IncompleteWPcomPlan ) => {
	if ( ! flowName || isNewsletterFlow( flowName ) ) {
		return;
	}

	return plan.getSignupCompareAvailableFeatures;
};

const getPlanFeatureAccessor = ( {
	flowName = '',
	plan,
}: {
	flowName?: string;
	plan: IncompleteWPcomPlan;
} ) => {
	return [
		newsletterFeatures( flowName, plan ),
		hostingFeatures( flowName, plan ),
		blogOnboardingFeatures( flowName, plan ),
		senseiFeatures( plan ),
		signupFlowDefaultFeatures( flowName, plan ),
	].find( ( accessor ) => {
		return accessor instanceof Function;
	} );
};

const newsletterHighlightedFeatures = ( flowName: string, plan: IncompleteWPcomPlan ) => {
	return flowName === NEWSLETTER_FLOW && plan.getNewsletterHighlightedFeatures;
};

const blogOnboardingHighlightedFeatures = ( flowName: string, plan: IncompleteWPcomPlan ) => {
	return isStartWritingFlow( flowName ) && plan.getBlogOnboardingHighlightedFeatures;
};

const senseiHighlightedFeatures = ( plan: IncompleteWPcomPlan ) =>
	plan.getSenseiHighlightedFeatures;

const getHighlightedFeatures = ( flowName: string, plan: IncompleteWPcomPlan ) => {
	const accessor = [
		newsletterHighlightedFeatures( flowName, plan ),
		blogOnboardingHighlightedFeatures( flowName, plan ),
		senseiHighlightedFeatures( plan ),
	].find( ( accessor ) => {
		return accessor instanceof Function;
	} );

	return ( accessor && accessor() ) || [];
};

export default function getFlowPlanFeatures(
	flowName: string,
	product: ResponseCartProduct | undefined,
	hasDomainsInCart: boolean,
	hasRenewalInCart: boolean,
	nextDomainIsFree: boolean
) {
	const productSlug = product?.product_slug;

	if ( ! productSlug ) {
		return [];
	}

	const plan = getPlan( productSlug );

	if ( ! plan ) {
		return [];
	}

	const planConstantObj = applyTestFiltersToPlansList( plan, undefined );

	if ( ! planConstantObj ) {
		return [];
	}

	const featureAccessor = getPlanFeatureAccessor( {
		flowName,
		plan: planConstantObj,
	} );

	if ( ! featureAccessor ) {
		return [];
	}

	const highlightedFeatures = getHighlightedFeatures( flowName, planConstantObj );
	const showFreeDomainFeature = ! hasDomainsInCart && ! hasRenewalInCart && nextDomainIsFree;
	return getPlanFeaturesObject( featureAccessor() )
		.filter( ( feature ) => {
			return showFreeDomainFeature || feature.getSlug() !== FEATURE_CUSTOM_DOMAIN;
		} )
		.map( ( feature ) => {
			return {
				...feature,
				isHighlightedFeature: highlightedFeatures.includes( feature.getSlug() ),
			};
		} );
}
