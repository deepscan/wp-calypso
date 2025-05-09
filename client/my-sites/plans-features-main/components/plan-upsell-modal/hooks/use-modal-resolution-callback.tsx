import { isFreePlan } from '@automattic/calypso-products';
import { FREE_THEME } from '@automattic/design-picker';
import { ONBOARDING_FLOW } from '@automattic/onboarding';
import { useCallback } from '@wordpress/element';
import {
	FREE_PLAN_FREE_DOMAIN_DIALOG,
	FREE_PLAN_PAID_DOMAIN_DIALOG,
	PAID_PLAN_PAID_DOMAIN_DIALOG,
	PAID_PLAN_IS_REQUIRED_DIALOG,
	ModalType,
} from '..';

type Props = {
	isCustomDomainAllowedOnFreePlan?: boolean | null;
	flowName?: string | null;
	paidDomainName?: string | null;
	intent?: string | null;
	selectedThemeType?: string;
};

/**
 * Provides a callback that resolves a ModalType based on a set of predefined parameters
 */
export function useModalResolutionCallback( {
	isCustomDomainAllowedOnFreePlan,
	flowName,
	paidDomainName,
	intent,
	selectedThemeType,
}: Props ) {
	return useCallback(
		( currentSelectedPlan?: string | null ): ModalType | null => {
			if ( ! currentSelectedPlan || ! isFreePlan( currentSelectedPlan ) ) {
				return null;
			}

			if ( selectedThemeType && selectedThemeType !== FREE_THEME ) {
				return PAID_PLAN_IS_REQUIRED_DIALOG;
			}

			if ( isCustomDomainAllowedOnFreePlan ) {
				if ( paidDomainName ) {
					return FREE_PLAN_PAID_DOMAIN_DIALOG;
				}
				return FREE_PLAN_FREE_DOMAIN_DIALOG;
			}

			// TODO: look into decoupling the flowName from here as well.
			if (
				paidDomainName &&
				( ( flowName && ONBOARDING_FLOW === flowName ) ||
					[ 'plans-jetpack-app-site-creation', 'plans-site-selected-legacy' ].includes(
						intent || ''
					) )
			) {
				return PAID_PLAN_PAID_DOMAIN_DIALOG;
			}

			return null;
		},
		[ isCustomDomainAllowedOnFreePlan, flowName, paidDomainName, intent, selectedThemeType ]
	);
}
