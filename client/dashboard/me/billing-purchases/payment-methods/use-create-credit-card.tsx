import { useMemo } from 'react';
import { createCreditCardMethod } from './credit-card-payment-method';
import type { PaymentMethod } from '@automattic/composite-checkout';

export function useCreateCreditCard( {
	currency,
	isStripeLoading,
	stripeLoadingError,
	hasExistingCardMethods,
	allowUseForAllSubscriptions,
}: {
	currency?: string | null | undefined;
	isStripeLoading: boolean;
	stripeLoadingError: Error | null | undefined;
	hasExistingCardMethods?: boolean;
	allowUseForAllSubscriptions?: boolean;
} ): PaymentMethod | null {
	const shouldLoadStripeMethod = ! isStripeLoading && ! stripeLoadingError;

	const stripeMethod = useMemo(
		() =>
			shouldLoadStripeMethod
				? createCreditCardMethod( {
						currency,
						hasExistingCardMethods,
						allowUseForAllSubscriptions,
				  } )
				: null,
		[ currency, shouldLoadStripeMethod, hasExistingCardMethods, allowUseForAllSubscriptions ]
	);

	return stripeMethod;
}
