import { Badge } from '@automattic/ui';
import { useProductCategories } from '../../hooks/use-product-categories';
import type { APIProductFamilyProduct } from 'calypso/state/partner-portal/types';

import './style.scss';

interface Props {
	product: APIProductFamilyProduct;
}

export default function ProductBadges( { product }: Props ) {
	const badges = useProductCategories( product );

	return (
		<div className="product-badges">
			{ badges.map( ( badge: string ) => (
				<Badge key={ badge }>{ badge }</Badge>
			) ) }
		</div>
	);
}
