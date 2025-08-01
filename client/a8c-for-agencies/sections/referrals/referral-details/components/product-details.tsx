import TextPlaceholder from 'calypso/a8c-for-agencies/components/text-placeholder';
import { APIProductFamilyProduct } from 'calypso/state/partner-portal/types';
import { ReferralPurchase } from '../../types';

type Props = {
	purchase: ReferralPurchase;
	isFetching: boolean;
	data?: APIProductFamilyProduct[];
};

const ProductDetails = ( { purchase, data, isFetching }: Props ) => {
	const product = data?.find( ( product ) => product.product_id === purchase.product_id );

	if ( isFetching ) {
		return <TextPlaceholder />;
	}

	// Use product_name from subscription if available, otherwise fall back to product name from data
	const productName = purchase.subscription?.product_name || product?.name;

	return productName;
};

export default ProductDetails;
