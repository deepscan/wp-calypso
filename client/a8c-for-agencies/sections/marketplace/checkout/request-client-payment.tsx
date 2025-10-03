import page from '@automattic/calypso-router';
import { Button, FormLabel, Tooltip } from '@automattic/components';
import { customLink, Icon, send, warning } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import clsx from 'clsx';
import emailValidator from 'email-validator';
import { useTranslate } from 'i18n-calypso';
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import useShowFeedback from 'calypso/a8c-for-agencies/components/a4a-feedback/hooks/use-show-a4a-feedback';
import { FeedbackType } from 'calypso/a8c-for-agencies/components/a4a-feedback/types';
import {
	A4A_REFERRALS_DASHBOARD,
	A4A_FEEDBACK_LINK,
} from 'calypso/a8c-for-agencies/components/sidebar-menu/lib/constants';
import {
	NEW_REFERRAL_ORDER_EMAIL_QUERY_PARAM_KEY,
	NEW_REFERRAL_ORDER_CHECKOUT_URL_QUERY_PARAM_KEY,
	NEW_REFERRAL_ORDER_FLOW_TYPE_QUERY_PARAM_KEY,
} from 'calypso/a8c-for-agencies/constants';
import { ReferralOrderFlowType } from 'calypso/a8c-for-agencies/sections/referrals/types';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormTextInput from 'calypso/components/forms/form-text-input';
import FormTextarea from 'calypso/components/forms/form-textarea';
import { useDispatch, useSelector } from 'calypso/state';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { getCurrentUser } from 'calypso/state/current-user/selectors';
import { errorNotice } from 'calypso/state/notices/actions';
import withMarketplaceType, {
	MARKETPLACE_TYPE_SESSION_STORAGE_KEY,
	MARKETPLACE_TYPE_REGULAR,
} from '../hoc/with-marketplace-type';
import useRequestClientPaymentMutation from '../hooks/use-request-client-payment-mutation';
import useShoppingCart from '../hooks/use-shopping-cart';
import NoticeSummary from './notice-summary';
import type { ShoppingCartItem } from '../types';
interface Props {
	checkoutItems: ShoppingCartItem[];
}

type ValidationState = {
	email?: string;
};

function RequestClientPayment( { checkoutItems }: Props ) {
	const translate = useTranslate();
	const dispatch = useDispatch();

	const user = useSelector( getCurrentUser );

	const isUserUnverified = ! user?.email_verified;

	const [ email, setEmail ] = useState( '' );
	const [ message, setMessage ] = useState( '' );
	const [ validationError, setValidationError ] = useState< ValidationState >( {} );

	const ctaButtonRef = useRef< HTMLButtonElement >( null );

	const [ showVerifyAccountToolip, setShowVerifyAccountToolip ] = useState( false );

	const { onClearCart } = useShoppingCart();

	const onEmailChange = ( event: ChangeEvent< HTMLInputElement > ) => {
		setEmail( event.currentTarget.value );
		if ( validationError.email ) {
			setValidationError( { email: undefined } );
		}
	};

	const onMessageChange = useCallback( ( event: ChangeEvent< HTMLInputElement > ) => {
		setMessage( event.currentTarget.value );
	}, [] );

	const { mutate: requestPayment, isPending } = useRequestClientPaymentMutation();

	const hasCompletedForm = !! email && !! message;

	const productIds = checkoutItems.map( ( item ) => item.product_id ).join( ',' );

	const licenses = useMemo(
		() =>
			checkoutItems
				.filter( ( item ) => item.licenseId )
				.map( ( item ) => ( {
					product_id: item.product_id,
					license_id: item.licenseId as number,
				} ) ),
		[ checkoutItems ]
	);

	const { isFeedbackShown } = useShowFeedback( FeedbackType.ReferralCompleted );

	const handleRequestPayment = useCallback(
		( flowType: ReferralOrderFlowType ) => {
			if ( ! hasCompletedForm ) {
				return;
			}
			if ( ! emailValidator.validate( email ) ) {
				setValidationError( { email: translate( 'Please provide correct email address' ) } );
				return;
			}
			dispatch(
				recordTracksEvent( 'calypso_a4a_marketplace_referral_checkout_request_payment_click' )
			);
			requestPayment(
				{
					client_email: email,
					client_message: message,
					product_ids: productIds,
					licenses: licenses,
					flow_type: flowType,
				},
				{
					onSuccess: ( referral ) => {
						navigator.clipboard.writeText( referral.checkout_url );

						sessionStorage.setItem(
							MARKETPLACE_TYPE_SESSION_STORAGE_KEY,
							MARKETPLACE_TYPE_REGULAR
						);
						page.redirect(
							isFeedbackShown
								? addQueryArgs( A4A_REFERRALS_DASHBOARD, {
										[ NEW_REFERRAL_ORDER_EMAIL_QUERY_PARAM_KEY ]: email,
										[ NEW_REFERRAL_ORDER_CHECKOUT_URL_QUERY_PARAM_KEY ]: referral.checkout_url,
										[ NEW_REFERRAL_ORDER_FLOW_TYPE_QUERY_PARAM_KEY ]: flowType,
								  } )
								: addQueryArgs( A4A_FEEDBACK_LINK, {
										args: { email },
										type: FeedbackType.ReferralCompleted,
								  } )
						);
						setEmail( '' );
						setMessage( '' );
						onClearCart();
					},
					onError: ( error ) => {
						dispatch(
							errorNotice(
								error.code === 'cannot_refer_to_client'
									? translate(
											'Referring products to your own company is not allowed and against our {{a}}terms of service{{/a}}.',
											{
												components: {
													a: (
														<a
															href="https://automattic.com/for-agencies/program-incentives/"
															target="_blank"
															rel="noopener noreferrer"
														/>
													),
												},
											}
									  )
									: error.message
							)
						);
					},
				}
			);
		},
		[
			dispatch,
			email,
			hasCompletedForm,
			isFeedbackShown,
			licenses,
			message,
			onClearCart,
			productIds,
			requestPayment,
			translate,
		]
	);

	return (
		<>
			<div className="checkout__client-referral-form">
				<FormFieldset>
					<FormLabel htmlFor="email">{ translate( 'Client’s email address' ) }</FormLabel>
					<FormTextInput
						name="email"
						id="email"
						value={ email }
						onChange={ onEmailChange }
						onClick={ () =>
							dispatch( recordTracksEvent( 'calypso_a4a_client_referral_form_email_click' ) )
						}
					/>
					<div
						className={ clsx( 'checkout__client-referral-form-footer-error', {
							hidden: ! validationError?.email,
						} ) }
						role="alert"
					>
						{ validationError.email }
					</div>
				</FormFieldset>
				<FormFieldset>
					<FormLabel htmlFor="message">{ translate( 'Custom message' ) }</FormLabel>
					<FormTextarea
						name="message"
						id="message"
						placeholder="Send a message to your client about this request for payment."
						value={ message }
						onChange={ onMessageChange }
						onClick={ () =>
							dispatch( recordTracksEvent( 'calypso_a4a_client_referral_form_message_click' ) )
						}
					/>
				</FormFieldset>
			</div>

			<NoticeSummary type="request-client-payment" />

			<div
				className="checkout__aside-actions is-row"
				role="button"
				tabIndex={ 0 }
				onMouseEnter={ () => setShowVerifyAccountToolip( true ) }
				onMouseLeave={ () => setShowVerifyAccountToolip( false ) }
				onTouchStart={ () => setShowVerifyAccountToolip( true ) }
			>
				<Button
					ref={ ctaButtonRef }
					primary
					onClick={ () => handleRequestPayment( 'send' ) }
					disabled={ ! hasCompletedForm || isUserUnverified }
					busy={ isPending }
				>
					<Icon icon={ send } />
					{ translate( 'Send to Client' ) }
					{ isUserUnverified && <Icon icon={ warning } /> }
				</Button>

				{ translate( 'or' ) }

				<Button
					primary
					onClick={ () => handleRequestPayment( 'copy' ) }
					disabled={ ! hasCompletedForm || isUserUnverified }
					busy={ isPending }
				>
					<Icon icon={ customLink } />
					{ translate( 'Copy referral link' ) }
				</Button>

				<Tooltip
					className="checkout__verify-account-tooltip"
					context={ ctaButtonRef.current }
					isVisible={ showVerifyAccountToolip && isUserUnverified }
					position="bottom"
				>
					{ translate(
						"Please verify your {{a}}account's email{{/a}} in order to begin referring products to clients.",
						{
							components: {
								a: <a href="https://wordpress.com/me" target="_blank" rel="noopener noreferrer" />,
							},
						}
					) }
				</Tooltip>
			</div>
		</>
	);
}

export default withMarketplaceType( RequestClientPayment );
