import config from '@automattic/calypso-config';
import { AKISMET_PRO_500_PRODUCTS, isWpComPlan } from '@automattic/calypso-products';
import { FormStatus, useFormStatus } from '@automattic/composite-checkout';
import { isCopySiteFlow } from '@automattic/onboarding';
import {
	canItemBeRemovedFromCart,
	getCouponLineItemFromCart,
	getCreditsLineItemFromCart,
	isWpComProductRenewal,
	joinClasses,
	CouponLineItem,
	NonProductLineItem,
	LineItem,
	getPartnerCoupon,
	useRestorableProducts,
	RemovedFromCartItem,
} from '@automattic/wpcom-checkout';
import styled from '@emotion/styled';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { has100YearPlan, getDomainRegistrations } from 'calypso/lib/cart-values/cart-items';
import { isWcMobileApp } from 'calypso/lib/mobile-app';
import { useGetProductVariants } from 'calypso/my-sites/checkout/src/hooks/product-variants';
import { getSignupCompleteFlowName } from 'calypso/signup/storageUtils';
import { useDispatch, useSelector } from 'calypso/state';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import {
	getIsOnboardingAffiliateFlow,
	getIsOnboardingUnifiedFlow,
} from 'calypso/state/signup/flow/selectors';
import { getAffiliateCouponLabel } from '../../utils';
import { AkismetProQuantityDropDown } from './akismet-pro-quantity-dropdown';
import { ItemVariationPicker } from './item-variation-picker';
import type { OnChangeAkProQuantity } from './akismet-pro-quantity-dropdown';
import type { OnChangeItemVariant, WPCOMProductVariant } from './item-variation-picker';
import type {
	ResponseCart,
	RemoveProductFromCart,
	ReplaceProductInCart,
	ResponseCartProduct,
	RemoveCouponFromCart,
	AddProductsToCart,
} from '@automattic/shopping-cart';
import type { PropsWithChildren, RefObject } from 'react';

const WPOrderReviewList = styled.ul`
	box-sizing: border-box;
	margin: 24px 0 0 0;
	padding: 0;
`;

const WPOrderReviewListItem = styled.li`
	margin: 0;
	padding: 0;
	display: block;
	list-style: none;
`;

export function WPOrderReviewSection( {
	children,
	className,
}: PropsWithChildren< {
	className?: string;
} > ) {
	return <div className={ joinClasses( [ className, 'order-review-section' ] ) }>{ children }</div>;
}

export function WPOrderReviewLineItems( {
	className,
	isSummary,
	removeProductFromCart,
	replaceProductInCart,
	addProductsToCart,
	removeCoupon,
	onChangeSelection,
	createUserAndSiteBeforeTransaction,
	responseCart,
	isPwpoUser,
	onRemoveProduct,
	onRemoveProductClick,
	onRemoveProductCancel,
}: {
	className?: string;
	isSummary?: boolean;
	removeProductFromCart: RemoveProductFromCart;
	replaceProductInCart: ReplaceProductInCart;
	addProductsToCart: AddProductsToCart;
	removeCoupon: RemoveCouponFromCart;
	onChangeSelection?: OnChangeItemVariant;
	createUserAndSiteBeforeTransaction?: boolean;
	responseCart: ResponseCart;
	isPwpoUser: boolean;
	onRemoveProduct?: ( label: string ) => void;
	onRemoveProductClick?: ( label: string ) => void;
	onRemoveProductCancel?: ( label: string ) => void;
} ) {
	const reduxDispatch = useDispatch();
	const creditsLineItem = getCreditsLineItemFromCart( responseCart );
	const couponLineItem = getCouponLineItemFromCart( responseCart );
	const isOnboardingAffiliateFlow = useSelector( getIsOnboardingAffiliateFlow );
	const isOnboardingUnifiedFlow = useSelector( getIsOnboardingUnifiedFlow );
	const [ restorableProducts ] = useRestorableProducts();

	if ( couponLineItem ) {
		couponLineItem.label =
			isOnboardingAffiliateFlow || isOnboardingUnifiedFlow
				? getAffiliateCouponLabel()
				: couponLineItem.label;
	}
	const { formStatus } = useFormStatus();
	const isDisabled = formStatus !== FormStatus.READY;
	const hasPartnerCoupon = getPartnerCoupon( {
		coupon: responseCart.coupon,
	} );
	const [ initialProducts ] = useState( () => responseCart.products );
	const [ forceShowAkQuantityDropdown, setForceShowAkQuantityDropdown ] = useState( false );

	const isAkismetProMultipleLicensesCart = useMemo( () => {
		if ( ! config.isEnabled( 'akismet/checkout-quantity-dropdown' ) ) {
			return false;
		}
		if ( ! window.location.pathname.startsWith( '/checkout/akismet/' ) ) {
			return false;
		}

		return responseCart.products.every( ( product ) =>
			AKISMET_PRO_500_PRODUCTS.includes(
				product.product_slug as ( typeof AKISMET_PRO_500_PRODUCTS )[ number ]
			)
		);
	}, [ responseCart.products ] );

	const hasWPCOMPlanInCart = responseCart.products.some( ( product ) =>
		isWpComPlan( product.product_slug )
	);

	const [ variantOpenId, setVariantOpenId ] = useState< string | null >( null );
	const [ akQuantityOpenId, setAkQuantityOpenId ] = useState< string | null >( null );

	const handleVariantToggle = useCallback(
		( id: string | null ) => {
			if ( isAkismetProMultipleLicensesCart ) {
				// Close Akismet quantity dropdown if it's open.
				if ( akQuantityOpenId === id ) {
					setAkQuantityOpenId( null );
				}
			}

			reduxDispatch(
				recordTracksEvent( 'calypso_checkout_variant_dropdown_open', {
					has_wpcom_plan_in_cart: hasWPCOMPlanInCart,
				} )
			);
			setVariantOpenId( variantOpenId !== id ? id : null );
		},
		[
			akQuantityOpenId,
			hasWPCOMPlanInCart,
			isAkismetProMultipleLicensesCart,
			reduxDispatch,
			variantOpenId,
		]
	);

	const handleAkQuantityToggle = useCallback(
		( id: string | null ) => {
			// Close Variant picker if it's open.
			if ( variantOpenId === id ) {
				setVariantOpenId( null );
			}
			setAkQuantityOpenId( akQuantityOpenId !== id ? id : null );
		},
		[ akQuantityOpenId, variantOpenId ]
	);

	const changeAkismetPro500CartQuantity = useCallback< OnChangeAkProQuantity >(
		( uuid, productSlug, productId, prevQuantity, newQuantity ) => {
			reduxDispatch(
				recordTracksEvent( 'calypso_checkout_akismet_pro_quantity_change', {
					product_slug: productSlug,
					prev_quantity: prevQuantity,
					new_quantity: newQuantity,
				} )
			);
			replaceProductInCart( uuid, {
				product_slug: productSlug,
				product_id: productId,
				quantity: newQuantity,
			} ).catch( () => {
				// Nothing needs to be done here. CartMessages will display the error to the user.
			} );
		},
		[ replaceProductInCart, reduxDispatch ]
	);

	return (
		<WPOrderReviewList className={ joinClasses( [ className, 'order-review-line-items' ] ) }>
			{ responseCart.products.map( ( product ) => (
				<LineItemWrapper
					key={ product.uuid }
					product={ product }
					isSummary={ isSummary }
					removeProductFromCart={ removeProductFromCart }
					onChangeSelection={ onChangeSelection }
					createUserAndSiteBeforeTransaction={ createUserAndSiteBeforeTransaction }
					responseCart={ responseCart }
					isPwpoUser={ isPwpoUser }
					onRemoveProduct={ onRemoveProduct }
					onRemoveProductClick={ onRemoveProductClick }
					onRemoveProductCancel={ onRemoveProductCancel }
					hasPartnerCoupon={ hasPartnerCoupon }
					isDisabled={ isDisabled }
					initialVariantTerm={
						initialProducts.find( ( initialProduct ) => {
							return initialProduct.product_variants.find(
								( variant ) => variant.product_id === product.product_id
							);
						} )?.months_per_bill_period
					}
					toggleVariantSelector={ handleVariantToggle }
					variantOpenId={ variantOpenId }
					isAkPro500Cart={ isAkismetProMultipleLicensesCart || forceShowAkQuantityDropdown }
					setForceShowAkQuantityDropdown={ setForceShowAkQuantityDropdown }
					onChangeAkProQuantity={ changeAkismetPro500CartQuantity }
					toggleAkQuantityDropdown={ handleAkQuantityToggle }
					akQuantityOpenId={ akQuantityOpenId }
				/>
			) ) }
			{ restorableProducts.map( ( product ) => (
				<RemovedFromCartItem
					key={ product.uuid }
					product={ product }
					addProductsToCart={ addProductsToCart }
				/>
			) ) }
			{ couponLineItem && (
				<WPOrderReviewListItem key={ couponLineItem.id }>
					<CouponLineItem
						lineItem={ couponLineItem }
						isSummary={ isSummary }
						hasDeleteButton={ couponLineItem.hasDeleteButton }
						removeProductFromCart={ removeCoupon }
						createUserAndSiteBeforeTransaction={ createUserAndSiteBeforeTransaction }
						isPwpoUser={ isPwpoUser }
						hasPartnerCoupon={ hasPartnerCoupon }
					/>
				</WPOrderReviewListItem>
			) }
			{ creditsLineItem && responseCart.sub_total_integer > 0 && (
				<WPOrderReviewListItem>
					<NonProductLineItem
						subtotal
						lineItem={ creditsLineItem }
						isSummary={ isSummary }
						isPwpoUser={ isPwpoUser }
					/>
				</WPOrderReviewListItem>
			) }
		</WPOrderReviewList>
	);
}

const DropdownWrapper = styled.span`
	width: 100%;
`;

function LineItemWrapper( {
	product,
	isSummary,
	removeProductFromCart,
	onChangeSelection,
	createUserAndSiteBeforeTransaction,
	responseCart,
	isPwpoUser,
	onRemoveProduct,
	onRemoveProductClick,
	onRemoveProductCancel,
	hasPartnerCoupon,
	isDisabled,
	initialVariantTerm,
	toggleVariantSelector,
	variantOpenId,
	isAkPro500Cart,
	setForceShowAkQuantityDropdown,
	onChangeAkProQuantity,
	toggleAkQuantityDropdown,
	akQuantityOpenId,
}: {
	product: ResponseCartProduct;
	isSummary?: boolean;
	removeProductFromCart?: RemoveProductFromCart;
	onChangeSelection?: OnChangeItemVariant;
	createUserAndSiteBeforeTransaction?: boolean;
	responseCart: ResponseCart;
	isPwpoUser: boolean;
	onRemoveProduct?: ( label: string ) => void;
	onRemoveProductClick?: ( label: string ) => void;
	onRemoveProductCancel?: ( label: string ) => void;
	hasPartnerCoupon: boolean;
	isDisabled: boolean;
	initialVariantTerm: number | null | undefined;
	toggleVariantSelector: ( key: string | null ) => void;
	variantOpenId: string | null;
	isAkPro500Cart: boolean;
	setForceShowAkQuantityDropdown: React.Dispatch< React.SetStateAction< boolean > >;
	onChangeAkProQuantity: OnChangeAkProQuantity;
	toggleAkQuantityDropdown: ( key: string | null ) => void;
	akQuantityOpenId: string | null;
} ) {
	const [ restorableProducts, setRestorableProducts ] = useRestorableProducts();
	const isRenewal = isWpComProductRenewal( product );
	const isWooMobile = isWcMobileApp();
	let isDeletable = canItemBeRemovedFromCart( product, responseCart ) && ! isWooMobile;
	const has100YearPlanProduct = has100YearPlan( responseCart );
	const signupFlowName = getSignupCompleteFlowName();
	const shouldShowComparison = isWpComPlan( product.product_slug );

	if ( isCopySiteFlow( signupFlowName ) && ! product.is_domain_registration ) {
		isDeletable = false;
	}

	const isVariantDropdownOpen = product.uuid === variantOpenId;
	const isAkQuantityDropdownOpen = product.uuid === akQuantityOpenId;
	const variantDropdownRef = useRef< HTMLDivElement >( null );
	const akQuantityDropdownRef = useRef< HTMLDivElement >( null );

	useEffect( () => {
		const handleClickOutside =
			( ref: RefObject< HTMLDivElement >, toggle: ( key: string | null ) => void ) =>
			( event: MouseEvent ): void => {
				if ( ref.current && ! ref.current.contains( event.target as Node ) ) {
					toggle( null );
				}
			};

		const handleClickOutsideVariantDropdown = handleClickOutside(
			variantDropdownRef,
			toggleVariantSelector
		);

		const handleClickOutsideAkQuantityDropdown = handleClickOutside(
			akQuantityDropdownRef,
			toggleAkQuantityDropdown
		);

		if ( isVariantDropdownOpen ) {
			document.addEventListener( 'mousedown', handleClickOutsideVariantDropdown as EventListener );
		} else {
			document.removeEventListener( 'mousedown', handleClickOutsideVariantDropdown );
		}

		if ( isAkQuantityDropdownOpen ) {
			document.addEventListener( 'mousedown', handleClickOutsideAkQuantityDropdown );
		} else {
			document.removeEventListener( 'mousedown', handleClickOutsideAkQuantityDropdown );
		}

		return () => {
			document.removeEventListener( 'mousedown', handleClickOutsideVariantDropdown );
			document.removeEventListener( 'mousedown', handleClickOutsideAkQuantityDropdown );
		};
	}, [
		isVariantDropdownOpen,
		toggleVariantSelector,
		isAkQuantityDropdownOpen,
		toggleAkQuantityDropdown,
	] );

	const shouldShowVariantSelector = ( () => {
		if ( ! onChangeSelection ) {
			return false;
		}
		if ( isWooMobile ) {
			return false;
		}

		if ( isRenewal && ! product.is_domain_registration ) {
			return false;
		}

		if ( hasPartnerCoupon ) {
			return false;
		}

		if ( has100YearPlanProduct ) {
			return false;
		}
		if ( product.extra?.hideProductVariants ) {
			return false;
		}

		return true;
	} )();

	const variantsFilterCallback: ( variant: WPCOMProductVariant ) => boolean = ( variant ) => {
		if ( signupFlowName === 'onboarding-pm' && isWpComPlan( product.product_slug ) ) {
			const domainRegistrations = getDomainRegistrations( responseCart );
			// Hide monthly variant when a paid domain is in the cart
			if (
				variant.termIntervalInMonths === 1 &&
				variant.termIntervalInMonths !== initialVariantTerm &&
				domainRegistrations.length > 0
			) {
				return false;
			}
		}

		return true;
	};
	const variants = useGetProductVariants( product, variantsFilterCallback );

	const areThereVariants = variants.length > 1;

	const finalShouldShowVariantSelector =
		areThereVariants && shouldShowVariantSelector && onChangeSelection;

	const firstVariant = variants[ 0 ];
	const compareToPrice = firstVariant?.priceBeforeDiscounts / firstVariant?.termIntervalInMonths;

	return (
		<WPOrderReviewListItem key={ product.uuid }>
			<LineItem
				product={ product }
				hasDeleteButton={ isDeletable }
				removeProductFromCart={ removeProductFromCart }
				isRestorable
				isSummary={ isSummary }
				createUserAndSiteBeforeTransaction={ createUserAndSiteBeforeTransaction }
				responseCart={ responseCart }
				restorableProducts={ restorableProducts }
				setRestorableProducts={ setRestorableProducts }
				isPwpoUser={ isPwpoUser }
				onRemoveProduct={ onRemoveProduct }
				onRemoveProductClick={ onRemoveProductClick }
				onRemoveProductCancel={ onRemoveProductCancel }
				isAkPro500Cart={ isAkPro500Cart }
				shouldShowBillingInterval={ ! finalShouldShowVariantSelector }
				shouldShowComparison={ shouldShowComparison }
				compareToPrice={ compareToPrice }
			>
				<DropdownWrapper>
					{ finalShouldShowVariantSelector && (
						<div ref={ variantDropdownRef }>
							<ItemVariationPicker
								id={ product.uuid }
								selectedItem={ product }
								onChangeItemVariant={ onChangeSelection }
								isDisabled={ isDisabled }
								variants={ variants }
								toggle={ toggleVariantSelector }
								isOpen={ isVariantDropdownOpen }
							/>
						</div>
					) }
					{ ! isRenewal && isAkPro500Cart && (
						<div ref={ akQuantityDropdownRef }>
							<AkismetProQuantityDropDown
								id={ product.uuid }
								responseCart={ responseCart }
								setForceShowAkQuantityDropdown={ setForceShowAkQuantityDropdown }
								onChangeAkProQuantity={ onChangeAkProQuantity }
								toggle={ toggleAkQuantityDropdown }
								isOpen={ isAkQuantityDropdownOpen }
							/>
						</div>
					) }
				</DropdownWrapper>
			</LineItem>
		</WPOrderReviewListItem>
	);
}
