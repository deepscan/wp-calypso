import { formatCurrency } from '@automattic/number-formatters';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import TextPlaceholder from 'calypso/a8c-for-agencies/components/text-placeholder';
import { getProductPricingInfo } from 'calypso/jetpack-cloud/sections/partner-portal/primary/issue-license/lib/pricing';
import { useSelector } from 'calypso/state';
import { APIProductFamilyProduct } from 'calypso/state/partner-portal/types';
import { isProductsListFetching, getProductsList } from 'calypso/state/products-list/selectors';

import './style.scss';

interface Props {
	product: APIProductFamilyProduct;
	hideDiscount?: boolean;
	quantity?: number;
	compact?: boolean;
}

export default function ProductPriceWithDiscount( {
	product,
	hideDiscount,
	quantity = 1,
	compact,
}: Props ) {
	const translate = useTranslate();

	const userProducts = useSelector( getProductsList );
	const isFetching = useSelector( isProductsListFetching );
	const isDailyPricing = product.price_interval === 'day';

	const isBundle = quantity > 1;

	const { actualCost, discountedCost, discountPercentage } = getProductPricingInfo(
		userProducts,
		product,
		quantity
	);

	const isFree = actualCost === 0;

	if ( isFree ) {
		return (
			<div className={ clsx( 'product-price-with-discount__price', { 'is-compact': compact } ) }>
				{ isFetching ? (
					<TextPlaceholder />
				) : (
					<p className="product-price-with-discount__free">{ translate( 'Free' ) }</p>
				) }
			</div>
		);
	}

	return (
		<div>
			<div className={ clsx( 'product-price-with-discount__price', { 'is-compact': compact } ) }>
				{ formatCurrency( discountedCost, product.currency ) }
				{
					// Display discount info only if there is a discount
					discountPercentage > 0 && ! hideDiscount && (
						<>
							{ compact && (
								<span className="product-price-with-discount__price-old">
									{ formatCurrency( actualCost, product.currency ) }
								</span>
							) }

							<span className="product-price-with-discount__price-discount">
								{ translate( 'Save %(discountPercentage)s%%', {
									args: {
										discountPercentage,
									},
								} ) }
							</span>

							{ ! compact && (
								<div>
									<span className="product-price-with-discount__price-old">
										{ formatCurrency( actualCost, product.currency ) }
									</span>
								</div>
							) }
						</>
					)
				}
			</div>
			<div className="product-price-with-discount__price-interval">
				{ isDailyPricing &&
					( isBundle ? translate( 'per bundle per day' ) : translate( 'per license per day' ) ) }
				{ product.price_interval === 'month' &&
					( isBundle
						? translate( 'per bundle per month' )
						: translate( 'per license per month' ) ) }
			</div>
		</div>
	);
}
