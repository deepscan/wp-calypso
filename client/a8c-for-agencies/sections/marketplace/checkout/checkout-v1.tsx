import page from '@automattic/calypso-router';
import { Button } from '@automattic/components';
import { getQueryArg } from '@wordpress/url';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import { useCallback, useMemo, useContext, useEffect, useRef, useState } from 'react';
import A4AAgencyApprovalNotice from 'calypso/a8c-for-agencies/components/a4a-agency-approval-notice';
import LayoutBanner from 'calypso/a8c-for-agencies/components/layout/banner';
import { LayoutWithGuidedTour as Layout } from 'calypso/a8c-for-agencies/components/layout/layout-with-guided-tour';
import LayoutTop from 'calypso/a8c-for-agencies/components/layout/layout-with-payment-notification';
import MobileSidebarNavigation from 'calypso/a8c-for-agencies/components/sidebar/mobile-sidebar-navigation';
import {
	A4A_MARKETPLACE_LINK,
	A4A_SITES_LINK,
} from 'calypso/a8c-for-agencies/components/sidebar-menu/lib/constants';
import LayoutBody from 'calypso/layout/hosting-dashboard/body';
import LayoutHeader, {
	LayoutHeaderBreadcrumb as Breadcrumb,
} from 'calypso/layout/hosting-dashboard/header';
import { useDispatch, useSelector } from 'calypso/state';
import { getActiveAgency } from 'calypso/state/a8c-for-agencies/agency/selectors';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { getCurrentUser } from 'calypso/state/current-user/selectors';
import getSites from 'calypso/state/selectors/get-sites';
import useFetchClientReferral from '../../client/hooks/use-fetch-client-referral';
import { MarketplaceTypeContext } from '../context';
import withMarketplaceType, { MARKETPLACE_TYPE_REFERRAL } from '../hoc/with-marketplace-type';
import useProductsById from '../hooks/use-products-by-id';
import useProductsBySlug from '../hooks/use-products-by-slug';
import useReferralDevSite from '../hooks/use-referral-dev-site';
import useShoppingCart from '../hooks/use-shopping-cart';
import { getClientReferralQueryArgs } from '../lib/get-client-referral-query-args';
import useSubmitForm from '../products-overview/hooks/use-submit-form';
import { getVendorInfo } from '../products-overview/lib/get-vendor-info';
import NoticeSummary from './notice-summary';
import PendingPaymentPopover from './pending-payment-popover';
import PricingSummary from './pricing-summary';
import ProductInfo from './product-info';
import RequestClientPayment from './request-client-payment';
import SubmitPaymentInfo from './submit-payment-info';
import type { ShoppingCartItem } from '../types';

import './style-v1.scss'; // Checkout V1 styles

interface Props {
	isClient?: boolean;
	referralBlogId?: number;
}

function CheckoutV1( { isClient, referralBlogId }: Props ) {
	const translate = useTranslate();
	const dispatch = useDispatch();
	const agency = useSelector( getActiveAgency );
	const userEmail = useSelector( ( state ) => getCurrentUser( state )?.email );

	const canIssueLicenses = agency?.can_issue_licenses ?? true;
	const [ showPopover, setShowPopover ] = useState( false );
	const wrapperRef = useRef< HTMLButtonElement | null >( null );

	const { marketplaceType } = useContext( MarketplaceTypeContext );
	const isAutomatedReferrals = marketplaceType === MARKETPLACE_TYPE_REFERRAL;

	const { selectedCartItems, onRemoveCartItem, onClearCart, setSelectedCartItems } =
		useShoppingCart();

	// Fetch selected products by slug for site checkout
	const { selectedProductsBySlug } = useProductsBySlug();

	// Fetch client referral items if it's a client referral checkout
	const { data: referral } = useFetchClientReferral( getClientReferralQueryArgs() );

	// Get referred products for client referral checkout only if it's a client referral checkout
	const { referredProducts } = useProductsById( referral?.products ?? [], isClient );

	const isDoNotMatchReferralClientEmail = referral?.client?.email !== userEmail;

	// Get sites and selected site
	const sites = useSelector( getSites );
	const siteId = getQueryArg( window.location.href, 'site_id' )?.toString();
	const selectedSite =
		siteId && sites ? sites.find( ( site ) => site?.ID === parseInt( siteId ) ) : null;

	const { isReady, submitForm } = useSubmitForm( {
		selectedSite,
		onSuccessCallback: onClearCart,
	} );

	const sortedSelectedItems = useMemo( () => {
		return Object.values(
			selectedCartItems.reduce(
				( acc: Record< string, ShoppingCartItem[] >, item ) => (
					( acc[ item.slug ] = ( acc[ item.slug ] || [] ).concat( item ) ), acc
				),
				{}
			)
		)
			.map( ( group ) => group.sort( ( a, b ) => a.quantity - b.quantity ) )
			.flat();
	}, [ selectedCartItems ] );

	// Use selected products by slug for site checkout
	let checkoutItems = siteId ? selectedProductsBySlug : sortedSelectedItems;

	// Use referred products for client referral checkout
	if ( isClient ) {
		checkoutItems = referredProducts;
	}

	const onCheckout = useCallback( () => {
		submitForm( checkoutItems );
		dispatch(
			recordTracksEvent( 'calypso_a4a_marketplace_checkout_checkout_click', {
				total_licenses: checkoutItems.length,
				items: checkoutItems?.map( ( item ) => `${ item.slug } x ${ item.quantity }` ).join( ',' ),
			} )
		);
	}, [ dispatch, checkoutItems, submitForm ] );

	const onEmptyCart = useCallback( () => {
		dispatch( recordTracksEvent( 'calypso_a4a_marketplace_checkout_empty_cart_click' ) );
		onClearCart();
		page( A4A_MARKETPLACE_LINK );
	}, [ dispatch, onClearCart ] );

	const onContinueShopping = useCallback( () => {
		dispatch( recordTracksEvent( 'calypso_a4a_marketplace_checkout_continue_shopping_click' ) );
		page( A4A_MARKETPLACE_LINK );
	}, [ dispatch ] );

	const onRemoveItem = useCallback(
		( item: ShoppingCartItem ) => {
			dispatch( recordTracksEvent( 'calypso_a4a_marketplace_checkout_remove_item_click' ) );
			onRemoveCartItem( item );
		},
		[ dispatch, onRemoveCartItem ]
	);

	const cancelPurchase = useCallback( () => {
		dispatch( recordTracksEvent( 'calypso_a4a_marketplace_checkout_cancel_purchase_click' ) );
		page( A4A_SITES_LINK );
	}, [ dispatch ] );

	const { addReferralPlanToCart, isLoading: isLoadingReferralDevSite } = useReferralDevSite(
		selectedCartItems,
		setSelectedCartItems,
		referralBlogId
	);

	useEffect( () => {
		// When the referralBlogId is present, add the referral plan to the cart.
		if ( referralBlogId && ! isLoadingReferralDevSite ) {
			addReferralPlanToCart();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isLoadingReferralDevSite ] );

	const title = isAutomatedReferrals ? translate( 'Referral checkout' ) : translate( 'Checkout' );

	const onlyFreeItems = checkoutItems.every( ( item ) => item.price_per_unit === 0 );

	const handleShowPopover = () => {
		if ( ! canIssueLicenses ) {
			setShowPopover( true );
		}
	};

	let actionContent = (
		<>
			<NoticeSummary type="agency-purchase" />

			<div className="checkout__aside-actions">
				<span
					role="button"
					tabIndex={ 0 }
					className="checkout__aside-actions-wrapper"
					onMouseEnter={ handleShowPopover }
					onClick={ handleShowPopover }
					onKeyUp={ ( event ) => {
						if ( event.key === 'Enter' || event.key === ' ' ) {
							handleShowPopover;
						}
					} }
				>
					<Button
						primary
						onClick={ onCheckout }
						disabled={ ! checkoutItems.length || ! isReady || ! canIssueLicenses }
						busy={ ! isReady }
						ref={ wrapperRef }
					>
						{ translate( 'Purchase' ) }
					</Button>
				</span>

				{ siteId ? (
					<Button onClick={ cancelPurchase }>{ translate( 'Cancel' ) }</Button>
				) : (
					<>
						<Button onClick={ onContinueShopping }>{ translate( 'Continue shopping' ) }</Button>

						<Button borderless onClick={ onEmptyCart }>
							{ translate( 'Empty cart' ) }
						</Button>
					</>
				) }
				{ showPopover && (
					<PendingPaymentPopover
						wrapperRef={ wrapperRef }
						hidePopover={ () => setShowPopover( false ) }
					/>
				) }
			</div>
		</>
	);

	if ( isAutomatedReferrals && ! onlyFreeItems ) {
		actionContent = <RequestClientPayment checkoutItems={ checkoutItems } />;
	}

	if ( isClient ) {
		actionContent = (
			<SubmitPaymentInfo
				disableButton={
					checkoutItems?.length === 0 || ( isClient && isDoNotMatchReferralClientEmail )
				}
			/>
		);
	}

	return (
		<Layout
			className="checkout"
			title={ title }
			wide
			withBorder={ ! isClient }
			sidebarNavigation={ ! isClient && <MobileSidebarNavigation /> }
		>
			{ isClient ? null : (
				<LayoutTop>
					<A4AAgencyApprovalNotice />
					<LayoutHeader>
						<Breadcrumb
							items={ [
								{
									label: translate( 'Marketplace' ),
									href: A4A_MARKETPLACE_LINK,
								},
								{
									label: title,
								},
							] }
						/>
					</LayoutHeader>
				</LayoutTop>
			) }
			<LayoutBody>
				<div className="checkout__container">
					<div className="checkout__main">
						<h1 className="checkout__main-title">{ title }</h1>

						{ isClient && !! checkoutItems?.length && isDoNotMatchReferralClientEmail && (
							<LayoutBanner level="error" hideCloseButton>
								{ translate(
									'This referral is not intended for your account. Please make sure you sign in using {{b}}%(referralEmail)s{{/b}}.',
									{
										args: {
											referralEmail: referral?.client?.email,
										},
										components: {
											b: <b />,
										},
										comment: '%(referralEmail)s is the email of the referral client.',
									}
								) }
							</LayoutBanner>
						) }

						{ isAutomatedReferrals && onlyFreeItems && (
							<LayoutBanner level="info" hideCloseButton>
								{ translate(
									'Because your referral includes only free products, you can assign them immediately after purchase — no client payment or approval required.'
								) }
							</LayoutBanner>
						) }

						<div className="checkout__main-list">
							{ referralBlogId && isLoadingReferralDevSite ? (
								<div className="product-info__placeholder"></div>
							) : (
								checkoutItems.map( ( items ) => (
									<ProductInfo
										key={ `product-info-${ items.product_id }-${ items.quantity }` }
										product={ items }
										isAutomatedReferrals={ isAutomatedReferrals }
										vendor={ getVendorInfo( items.slug ) }
									/>
								) )
							) }
						</div>
					</div>
					<div
						className={ clsx( 'checkout__aside', {
							'checkout__aside--referral': isAutomatedReferrals,
							'checkout__aside--client': isClient,
						} ) }
					>
						<PricingSummary
							items={ checkoutItems }
							onRemoveItem={ siteId || isClient ? undefined : onRemoveItem }
							isAutomatedReferrals={ isAutomatedReferrals && ! onlyFreeItems }
							isClient={ isClient }
						/>

						{ actionContent }
					</div>
				</div>
			</LayoutBody>
		</Layout>
	);
}

export default withMarketplaceType( CheckoutV1 );
