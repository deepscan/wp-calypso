import { PLAN_PREMIUM, getPlan, PLAN_PERSONAL } from '@automattic/calypso-products';
import { PremiumBadge } from '@automattic/components';
import { createInterpolateElement } from '@wordpress/element';
import { useTranslate } from 'i18n-calypso';
import { useSiteGlobalStylesOnPersonal } from 'calypso/state/sites/hooks/use-site-global-styles-on-personal';
import ThemeTierBadgeCheckoutLink from './theme-tier-badge-checkout-link';
import { useThemeTierBadgeContext } from './theme-tier-badge-context';
import ThemeTierTooltipTracker from './theme-tier-tooltip-tracker';

export default function ThemeTierStyleVariationBadge() {
	const translate = useTranslate();
	const { siteId } = useThemeTierBadgeContext();

	// @TODO Cleanup once the test phase is over.
	const upgradeToPlan = useSiteGlobalStylesOnPersonal( siteId )
		? getPlan( PLAN_PERSONAL )
		: getPlan( PLAN_PREMIUM );

	const tooltipContent = (
		<>
			<ThemeTierTooltipTracker />
			<div data-testid="upsell-header" className="theme-tier-badge-tooltip__header" />
			<div data-testid="upsell-message">
				{ createInterpolateElement(
					// Translators: %(upgradePlanName)s is the name of the premium plan that includes this theme. Examples: "Explorer" or "Premium".
					translate(
						'Unlock this style, and tons of other features, by upgrading to a <Link>%(upgradePlanName)s plan</Link>.',
						{ args: { upgradePlanName: upgradeToPlan?.getTitle() } }
					),
					{ Link: <ThemeTierBadgeCheckoutLink plan={ upgradeToPlan?.getPathSlug() } /> }
				) }
			</div>
		</>
	);

	return (
		<PremiumBadge
			className="theme-tier-badge__content"
			focusOnShow={ false }
			isClickable
			labelText={ translate( 'Upgrade' ) }
			tooltipClassName="theme-tier-badge-tooltip"
			tooltipContent={ tooltipContent }
			tooltipPosition="top"
		/>
	);
}
