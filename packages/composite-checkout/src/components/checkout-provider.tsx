import { ThemeProvider } from '@emotion/react';
import { useI18n } from '@wordpress/react-i18n';
import debugFactory from 'debug';
import { useCallback, useEffect } from 'react';
import defaultTheme from '../lib/theme';
import { validateArg, validatePaymentMethods } from '../lib/validation';
import { CheckoutProviderProps } from '../types';
import CheckoutErrorBoundary from './checkout-error-boundary';
import { FormAndTransactionProvider } from './form-and-transaction-provider';
import { PaymentMethodProvider } from './payment-method-provider';

const debug = debugFactory( 'composite-checkout:checkout-provider' );

export function CheckoutProvider( {
	onPaymentComplete,
	onPaymentRedirect,
	onPaymentError,
	onPageLoadError,
	redirectToUrl,
	theme,
	paymentMethods,
	paymentProcessors,
	isLoading,
	isValidating,
	selectFirstAvailablePaymentMethod,
	initiallySelectedPaymentMethodId = null,
	children,
}: CheckoutProviderProps ) {
	const propsToValidate = {
		redirectToUrl,
		theme,
		paymentMethods,
		paymentProcessors,
		isLoading,
		isValidating,
		children,
		initiallySelectedPaymentMethodId,
	};

	const { __ } = useI18n();
	const errorMessage = __( 'Sorry, there was an error loading this page.' );
	const onLoadError = useCallback(
		( error: Error ) => {
			onPageLoadError?.( 'page_load', error );
		},
		[ onPageLoadError ]
	);
	return (
		<CheckoutErrorBoundary errorMessage={ errorMessage } onError={ onLoadError }>
			<CheckoutProviderPropValidator propsToValidate={ propsToValidate } />
			<PaymentMethodProvider
				paymentMethods={ paymentMethods }
				paymentProcessors={ paymentProcessors }
				selectFirstAvailablePaymentMethod={ selectFirstAvailablePaymentMethod }
				initiallySelectedPaymentMethodId={ initiallySelectedPaymentMethodId }
			>
				<ThemeProvider theme={ theme || defaultTheme }>
					<FormAndTransactionProvider
						onPaymentComplete={ onPaymentComplete }
						onPaymentRedirect={ onPaymentRedirect }
						onPaymentError={ onPaymentError }
						isLoading={ isLoading }
						isValidating={ isValidating }
						redirectToUrl={ redirectToUrl }
					>
						{ children }
					</FormAndTransactionProvider>
				</ThemeProvider>
			</PaymentMethodProvider>
		</CheckoutErrorBoundary>
	);
}

/**
 * Even though CheckoutProvider is TypeScript, it's possible for consumers to
 * misuse it in ways that are not easy to debug. This helper component throws
 * errors if the props are not what they should be.
 */
function CheckoutProviderPropValidator( {
	propsToValidate,
}: {
	propsToValidate: CheckoutProviderProps;
} ) {
	const { paymentMethods, paymentProcessors } = propsToValidate;
	useEffect( () => {
		debug( 'propsToValidate', propsToValidate );

		validateArg( paymentProcessors, 'CheckoutProvider missing required prop: paymentProcessors' );
		validateArg( paymentMethods, 'CheckoutProvider missing required prop: paymentMethods' );
		validatePaymentMethods( paymentMethods );
	}, [ paymentMethods, paymentProcessors, propsToValidate ] );
	return null;
}
