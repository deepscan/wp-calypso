import { APIProductFamilyProduct } from 'calypso/state/partner-portal/types';
import { getEstimatedCommission, getDailyPrice } from '../get-estimated-commission';
import type { Referral } from '../../types';

describe( 'get-estimated-commission', () => {
	describe( 'getDailyPrice', () => {
		const mockProduct: APIProductFamilyProduct = {
			product_id: 1,
			price_per_unit: 100,
			supported_bundles: [
				{ quantity: 5, price_per_unit: 90, amount: '90' },
				{ quantity: 10, price_per_unit: 80, amount: '80' },
			],
			name: 'Mock Product',
			slug: 'mock-product',
			currency: 'USD',
			amount: '100',
			price_interval: 'month',
			family_slug: 'mock-family',
		};

		it( 'returns price_per_unit for quantity of 1', () => {
			expect( getDailyPrice( mockProduct, 1 ) ).toBe( 100 );
		} );

		it( 'returns bundle price for matching quantity', () => {
			expect( getDailyPrice( mockProduct, 5 ) ).toBe( 90 );
			expect( getDailyPrice( mockProduct, 10 ) ).toBe( 80 );
		} );

		it( 'returns 0 for non-matching quantity', () => {
			expect( getDailyPrice( mockProduct, 3 ) ).toBe( 0 );
		} );

		it( 'handles empty supported_bundles', () => {
			const productWithoutBundles: APIProductFamilyProduct = {
				...mockProduct,
				supported_bundles: [],
			};

			expect( getDailyPrice( productWithoutBundles, 1 ) ).toBe( 100 );
		} );
	} );

	describe( 'getEstimatedCommission', () => {
		// Activity window for Q1 2024 (Jan 1 - Mar 31)
		const mockActivityWindow = {
			start: new Date( '2024-01-01' ),
			finish: new Date( '2024-03-31' ),
		};
		const mockProduct: APIProductFamilyProduct = {
			product_id: 1,
			family_slug: 'jetpack-backup',
			price_per_unit: 100,
			supported_bundles: [],
			name: 'Mock Product',
			slug: 'mock-product',
			currency: 'USD',
			amount: '100',
			price_interval: 'month',
		};

		it( 'returns 0 for empty referrals', () => {
			expect( getEstimatedCommission( [], [ mockProduct ], mockActivityWindow ) ).toBe( 0 );
		} );

		it( 'calculates commission for active purchase within window', () => {
			const referrals: Referral[] = [
				{
					purchaseStatuses: [ 'active' ],
					referralStatuses: [ 'active' ],
					purchases: [
						{
							product_id: 1,
							status: 'active',
							quantity: 1,
							license: {
								issued_at: '2024-03-01T00:00:00Z',
								revoked_at: null,
							},
						},
					],
				} as never,
			];

			// Payout window is Jan 1 - Mar 31 for the activity window
			// License issued on Mar 1, so 31 days (including Mar 1) * $100 daily price * 50% commission = 1550 cents
			// Convert to dollars by dividing by 100
			expect( getEstimatedCommission( referrals, [ mockProduct ], mockActivityWindow ) ).toBe(
				15.5
			);
		} );

		it( 'handles cancelled purchases', () => {
			const referrals: Referral[] = [
				{
					purchaseStatuses: [ 'cancelled' ],
					referralStatuses: [ 'cancelled' ],
					purchases: [
						{
							product_id: 1,
							status: 'cancelled',
							quantity: 1,
							license: {
								issued_at: '2024-03-01T00:00:00Z',
								revoked_at: '2024-03-10T00:00:00Z',
							},
						},
					],
				},
			] as never;

			// 10 days * $100 daily price * 50% commission = 500 cents
			// Convert to dollars by dividing by 100
			expect( getEstimatedCommission( referrals, [ mockProduct ], mockActivityWindow ) ).toBe( 5 );
		} );

		it( 'skips pending purchases', () => {
			const referrals: Referral[] = [
				{
					purchaseStatuses: [ 'pending' ],
					referralStatuses: [ 'pending' ],
					purchases: [
						{
							product_id: 1,
							status: 'pending',
							quantity: 1,
							license: {
								issued_at: '2024-03-01T00:00:00Z',
								revoked_at: null,
							},
						},
					],
				},
			] as never;

			// Pending purchases should not contribute to commission
			expect( getEstimatedCommission( referrals, [ mockProduct ], mockActivityWindow ) ).toBe( 0 );
		} );

		it( 'calculates commission for multiple purchases in single referral', () => {
			const referrals: Referral[] = [
				{
					purchaseStatuses: [ 'active', 'active' ],
					referralStatuses: [ 'active' ],
					purchases: [
						{
							product_id: 1,
							status: 'active',
							quantity: 1,
							license: {
								issued_at: '2024-03-01T00:00:00Z',
								revoked_at: null,
							},
						},
						{
							product_id: 1,
							status: 'active',
							quantity: 1,
							license: {
								issued_at: '2024-03-01T00:00:00Z',
								revoked_at: null,
							},
						},
					],
				},
			] as never;

			// 31 days * $100 daily price * 50% commission * 2 purchases = 3100 cents
			// Convert to dollars by dividing by 100
			expect( getEstimatedCommission( referrals, [ mockProduct ], mockActivityWindow ) ).toBe( 31 );
		} );

		it( 'calculates commission for multiple referrals', () => {
			const referrals: Referral[] = [
				{
					purchaseStatuses: [ 'active' ],
					referralStatuses: [ 'active' ],
					purchases: [
						{
							product_id: 1,
							status: 'active',
							quantity: 1,
							license: {
								issued_at: '2024-03-01T00:00:00Z',
								revoked_at: null,
							},
						},
					],
				},
				{
					purchaseStatuses: [ 'active' ],
					referralStatuses: [ 'active' ],
					purchases: [
						{
							product_id: 1,
							status: 'active',
							quantity: 1,
							license: {
								issued_at: '2024-03-01T00:00:00Z',
								revoked_at: null,
							},
						},
					],
				},
			] as never;

			// 31 days * $100 daily price * 50% commission * 2 referrals = 3100 cents
			// Convert to dollars by dividing by 100
			expect( getEstimatedCommission( referrals, [ mockProduct ], mockActivityWindow ) ).toBe( 31 );
		} );

		it( 'calculates commission with bundle pricing', () => {
			const productWithBundle: APIProductFamilyProduct = {
				...mockProduct,
				supported_bundles: [ { quantity: 5, price_per_unit: 90, amount: '90' } ],
			};

			const referrals: Referral[] = [
				{
					purchaseStatuses: [ 'active' ],
					referralStatuses: [ 'active' ],
					purchases: [
						{
							product_id: 1,
							status: 'active',
							quantity: 5,
							license: {
								issued_at: '2024-03-01T00:00:00Z',
								revoked_at: null,
							},
						},
					],
				},
			] as never;

			// 31 days * $90 daily price * 50% commission = 1395 cents
			// Convert to dollars by dividing by 100
			expect( getEstimatedCommission( referrals, [ productWithBundle ], mockActivityWindow ) ).toBe(
				13.95
			);
		} );
	} );
} );
