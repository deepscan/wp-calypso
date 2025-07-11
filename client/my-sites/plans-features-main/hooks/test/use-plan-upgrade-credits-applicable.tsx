/**
 * @jest-environment jsdom
 */
// @ts-nocheck - TODO: Fix TypeScript issues
import {
	PLAN_ENTERPRISE_GRID_WPCOM,
	PLAN_BUSINESS,
	PLAN_PREMIUM,
	PLAN_PERSONAL,
	PLAN_ECOMMERCE,
	PLAN_FREE,
	PlanSlug,
} from '@automattic/calypso-products';
import { useMaxPlanUpgradeCredits } from 'calypso/my-sites/plans-features-main/hooks/use-max-plan-upgrade-credits';
import { usePlanUpgradeCreditsApplicable } from 'calypso/my-sites/plans-features-main/hooks/use-plan-upgrade-credits-applicable';
import isAutomatedTransfer from 'calypso/state/selectors/is-site-automated-transfer';
import { getSitePlanSlug } from 'calypso/state/sites/plans/selectors';
import { isCurrentPlanPaid, isJetpackSite } from 'calypso/state/sites/selectors';
import { renderHookWithProvider } from 'calypso/test-helpers/testing-library';

jest.mock( 'calypso/state/sites/selectors', () => ( {
	isCurrentPlanPaid: jest.fn(),
	isJetpackSite: jest.fn(),
} ) );
jest.mock( 'calypso/state/sites/plans/selectors', () => ( {
	getSitePlanSlug: jest.fn(),
} ) );
jest.mock( 'calypso/my-sites/plans-features-main/hooks/use-max-plan-upgrade-credits', () => ( {
	useMaxPlanUpgradeCredits: jest.fn(),
} ) );
jest.mock( 'calypso/state/selectors/is-site-automated-transfer', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const siteId = 1;
const plansList: PlanSlug[] = [
	PLAN_FREE,
	PLAN_PERSONAL,
	PLAN_PREMIUM,
	PLAN_BUSINESS,
	PLAN_ECOMMERCE,
	PLAN_ENTERPRISE_GRID_WPCOM,
];
describe( 'usePlanUpgradeCreditsApplicable hook', () => {
	beforeEach( () => {
		jest.resetAllMocks();

		jest.mocked( getSitePlanSlug ).mockReturnValue( 'TYPE_BUSINESS' );
		jest.mocked( isCurrentPlanPaid ).mockReturnValue( true );
		jest.mocked( useMaxPlanUpgradeCredits ).mockReturnValue( 100 );
		jest.mocked( isJetpackSite ).mockReturnValue( true );
		jest.mocked( isAutomatedTransfer ).mockReturnValue( true );
	} );

	test( 'Show a plans upgrade credit when the necessary conditions are met above', () => {
		const { result } = renderHookWithProvider( () =>
			usePlanUpgradeCreditsApplicable( siteId, plansList )
		);
		expect( result.current ).toEqual( 100 );
	} );

	test( 'Plan upgrade credits should not be shown when a site is on the highest purchasable plan', () => {
		jest.mocked( getSitePlanSlug ).mockReturnValue( PLAN_ECOMMERCE );
		const { result } = renderHookWithProvider( () =>
			usePlanUpgradeCreditsApplicable( siteId, plansList )
		);
		expect( result.current ).toEqual( null );
	} );

	test( 'A non atomic jetpack site is not shown the plan upgrade credit', () => {
		jest.mocked( isAutomatedTransfer ).mockReturnValue( false );
		jest.mocked( isJetpackSite ).mockReturnValue( true );

		const { result } = renderHookWithProvider( () =>
			usePlanUpgradeCreditsApplicable( siteId, plansList )
		);
		expect( result.current ).toEqual( null );
	} );

	test( 'Plan upgrade credit should NOT be shown if there are no discounts provided by the pricing API', () => {
		jest.mocked( useMaxPlanUpgradeCredits ).mockReturnValue( null );

		const { result } = renderHookWithProvider( () =>
			usePlanUpgradeCreditsApplicable( siteId, plansList )
		);
		expect( result.current ).toEqual( null );
	} );

	test( 'Site on a free plan should not show the plan upgrade credit', () => {
		jest.mocked( isCurrentPlanPaid ).mockReturnValue( false );

		const { result } = renderHookWithProvider( () =>
			usePlanUpgradeCreditsApplicable( siteId, plansList )
		);
		expect( result.current ).toEqual( null );
	} );
} );
