import { allowedPaymentMethodsQuery, userPaymentMethodsQuery } from '@automattic/api-queries';
import { useStripe } from '@automattic/calypso-stripe';
import { useQuery } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import {
	useCreateExistingCards,
	useCreatePayPalExpress,
	useCreateCreditCard,
	isValueTruthy,
	translateCheckoutPaymentMethodToWpcomPaymentMethod,
} from '../payment-methods';
import getPaymentMethodIdFromPayment from './get-payment-method-id-from-payment';
import { PaymentMethodSelectorSubmitButtonContent } from './payment-method-selector-submit-button-content';
import type { Purchase } from '@automattic/api-core';
import type { PaymentMethod } from '@automattic/composite-checkout';

/**
 * Hook to create the payment method objects required by the
 * PaymentMethodSelector for assigning payment methods to existing
 * subscriptions.
 *
 * Payment methods created for checkout use a quite different hook although a
 * similar system.
 */
export function useCreateAssignablePaymentMethods( purchase?: Purchase ): PaymentMethod[] {
	const { isStripeLoading, stripeLoadingError } = useStripe();

	const { data: allowedPaymentMethods, error: allowedPaymentMethodsError } = useQuery(
		allowedPaymentMethodsQuery()
	);

	const { data: storedCards = [] } = useQuery( userPaymentMethodsQuery( { type: 'card' } ) );

	const existingCardMethods = useCreateExistingCards( {
		isStripeLoading,
		stripeLoadingError,
		storedCards,
		submitButtonContent: (
			<PaymentMethodSelectorSubmitButtonContent text={ __( 'Use this card' ) } />
		),
		allowEditingTaxInfo: true,
		isTaxInfoRequired: true,
	} );

	const hasExistingCardMethods = existingCardMethods && existingCardMethods.length > 0;

	const creditCardMethod = useCreateCreditCard( {
		currency: purchase?.currency_code,
		isStripeLoading,
		stripeLoadingError,
		hasExistingCardMethods,
		allowUseForAllSubscriptions: true,
	} );

	const currentPaymentMethodId = purchase ? getPaymentMethodIdFromPayment( purchase ) : null;
	const payPalExpressMethod = useCreatePayPalExpress( {
		labelText:
			currentPaymentMethodId === 'paypal-existing'
				? String( __( 'New PayPal account' ) )
				: String( __( 'PayPal' ) ),
	} );

	const paymentMethods = useMemo(
		() =>
			[ ...existingCardMethods, creditCardMethod, payPalExpressMethod ]
				.filter( isValueTruthy )
				.filter( ( method ) => {
					// If there's an error fetching allowed payment methods, just allow all of them.
					if ( allowedPaymentMethodsError ) {
						return true;
					}
					const paymentMethodName = translateCheckoutPaymentMethodToWpcomPaymentMethod( method.id );
					return paymentMethodName && allowedPaymentMethods?.includes( paymentMethodName );
				} ),
		[
			existingCardMethods,
			creditCardMethod,
			payPalExpressMethod,
			allowedPaymentMethods,
			allowedPaymentMethodsError,
		]
	);

	if ( allowedPaymentMethods === undefined ) {
		return [];
	}

	return paymentMethods;
}
