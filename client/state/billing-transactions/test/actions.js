import {
	BILLING_TRANSACTIONS_RECEIVE,
	BILLING_TRANSACTIONS_REQUEST,
	BILLING_TRANSACTIONS_REQUEST_SUCCESS,
	BILLING_TRANSACTIONS_REQUEST_FAILURE,
} from 'calypso/state/action-types';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';
import useNock from 'calypso/test-helpers/use-nock';
import { requestBillingTransactions, sendBillingReceiptEmail } from '../actions';

describe( 'actions', () => {
	let spy;

	beforeEach( () => {
		spy = jest.fn();
	} );

	describe( '#requestBillingTransactions()', () => {
		describe( 'success', () => {
			const successResponse = {
				billing_history: [
					{
						id: '12345678',
						amount: '$1.23',
						date: '2016-12-12T11:22:33+0000',
						tax: '$0.20',
						subtotal: '$1.03',
					},
				],
				upcoming_charges: [
					{
						id: '87654321',
						amount: '$4.56',
						tax: '$0.55',
						subtotal: '$4.01',
						date: '2016-12-12T11:22:33+0000',
					},
				],
			};

			useNock( ( nock ) => {
				nock( 'https://public-api.wordpress.com:443' )
					.persist()
					.get( '/rest/v1.3/me/billing-history' )
					.reply( 200, successResponse );
			} );

			test( 'should dispatch fetch action when thunk triggered', () => {
				requestBillingTransactions()( spy );

				expect( spy ).toHaveBeenCalledWith( {
					type: BILLING_TRANSACTIONS_REQUEST,
				} );
			} );

			test( 'should dispatch receive action when request completes', () => {
				return requestBillingTransactions()( spy ).then( () => {
					expect( spy ).toHaveBeenCalledWith( {
						type: BILLING_TRANSACTIONS_RECEIVE,
						past: successResponse.billing_history,
						upcoming: successResponse.upcoming_charges,
					} );
				} );
			} );

			test( 'should dispatch request success action when request completes', () => {
				return requestBillingTransactions()( spy ).then( () => {
					expect( spy ).toHaveBeenCalledWith( {
						type: BILLING_TRANSACTIONS_REQUEST_SUCCESS,
					} );
				} );
			} );
		} );

		describe( 'failure', () => {
			const message =
				'An active access token must be used to query information about the current user.';

			useNock( ( nock ) => {
				nock( 'https://public-api.wordpress.com:443' )
					.persist()
					.get( '/rest/v1.3/me/billing-history' )
					.reply( 403, {
						error: 'authorization_required',
						message,
					} );
			} );

			test( 'should dispatch request failure action when request fails', () => {
				return requestBillingTransactions()( spy ).then( () => {
					expect( spy ).toHaveBeenCalledWith( {
						type: BILLING_TRANSACTIONS_REQUEST_FAILURE,
						error: expect.objectContaining( {
							message,
						} ),
					} );
				} );
			} );
		} );
	} );

	describe( '#sendBillingReceiptEmail()', () => {
		const receiptId = 12345678;

		describe( 'success', () => {
			useNock( ( nock ) => {
				nock( 'https://public-api.wordpress.com:443' )
					.persist()
					.get( '/rest/v1.1/me/billing-history/receipt/' + receiptId + '/email' )
					.reply( 200, { success: true } );
			} );

			test( 'should dispatch send success action when request completes', () => {
				const { notice, type } = successNotice( 'Your receipt was sent by email successfully.' );
				return sendBillingReceiptEmail( receiptId )( spy ).then( () => {
					expect( spy ).toHaveBeenCalledWith( {
						notice: {
							...notice,
							noticeId: expect.any( String ),
						},
						type,
					} );
				} );
			} );
		} );

		describe( 'failure', () => {
			const message =
				'An active access token must be used to query information about the current user.';

			useNock( ( nock ) => {
				nock( 'https://public-api.wordpress.com:443' )
					.persist()
					.get( '/rest/v1.1/me/billing-history/receipt/' + receiptId + '/email' )
					.reply( 403, {
						error: 'authorization_required',
						message,
					} );
			} );

			test( 'should dispatch send failure action when request fails', () => {
				const { notice, type } = errorNotice(
					'There was a problem sending your receipt. Please try again later or contact support.'
				);
				return sendBillingReceiptEmail( receiptId )( spy ).then( () => {
					expect( spy ).toHaveBeenCalledWith( {
						notice: {
							...notice,
							noticeId: expect.any( String ),
						},
						type,
					} );
				} );
			} );
		} );
	} );
} );
