import { Button } from '@automattic/components';
import { PaymentMethodSummary } from '@automattic/wpcom-checkout';
import { useTranslate } from 'i18n-calypso';
import { FunctionComponent, useState, useCallback } from 'react';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { useStoredPaymentMethods } from 'calypso/my-sites/checkout/src/hooks/use-stored-payment-methods';
import { useDispatch, useSelector } from 'calypso/state';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';
import { getSitePurchases, getUserPurchases } from 'calypso/state/purchases/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import PaymentMethodDeleteDialog from './payment-method-delete-dialog';
import type { StoredPaymentMethod } from '@automattic/wpcom-checkout';

interface Props {
	card: StoredPaymentMethod;
}

const PaymentMethodDelete: FunctionComponent< Props > = ( { card } ) => {
	const translate = useTranslate();
	const { isDeleting, deletePaymentMethod } = useStoredPaymentMethods( {
		type: 'all',
		expired: true,
	} );
	const reduxDispatch = useDispatch();
	const [ isDialogVisible, setIsDialogVisible ] = useState( false );
	const closeDialog = useCallback( () => setIsDialogVisible( false ), [] );
	const siteId = useSelector( getSelectedSiteId );
	const sitePurchases = useSelector( ( state ) => getSitePurchases( state, siteId ) );
	const userPurchases = useSelector( ( state ) => getUserPurchases( state ) );

	const handleDelete = useCallback( () => {
		closeDialog();
		deletePaymentMethod( card.stored_details_id )
			.then( () => {
				reduxDispatch( successNotice( translate( 'Payment method removed' ) ) );
				recordTracksEvent( 'calypso_purchases_delete_payment_method' );
			} )
			.catch( ( error: Error ) => {
				reduxDispatch( errorNotice( error.message ) );
			} );
	}, [ deletePaymentMethod, closeDialog, card, translate, reduxDispatch ] );

	/* translators: %s is the name of the payment method (usually the last 4 digits of the card but could be a proper name for PayPal). */
	const deleteText = translate( 'Remove the "%s" payment method', {
		textOnly: true,
		args: [ 'card_last_4' in card ? card.card_last_4 : card.name ],
	} );

	const renderDeleteButton = () => {
		const text = isDeleting ? translate( 'Removing…' ) : translate( 'Remove payment method' );
		const ariaText = isDeleting ? translate( 'Removing…' ) : deleteText;

		return (
			<Button
				aria-label={ ariaText }
				className="payment-method-delete__button"
				disabled={ isDeleting }
				onClick={ () => setIsDialogVisible( true ) }
				scary
				borderless
			>
				{ text }
			</Button>
		);
	};

	return (
		<div className="payment-method-delete">
			<PaymentMethodDeleteDialog
				paymentMethodSummary={
					<PaymentMethodSummary
						type={ 'card_type' in card ? card.card_type : card.payment_partner }
						digits={ 'card_last_4' in card ? card.card_last_4 : undefined }
						email={ card.email }
					/>
				}
				isVisible={ isDialogVisible }
				onClose={ closeDialog }
				onConfirm={ handleDelete }
				card={ card }
				purchases={ userPurchases || sitePurchases }
			/>
			{ renderDeleteButton() }
		</div>
	);
};

export default PaymentMethodDelete;
