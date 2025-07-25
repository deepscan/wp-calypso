import { Badge } from '@automattic/ui';
import { __experimentalHStack as HStack, Icon } from '@wordpress/components';
import { arrowDown, arrowUp } from '@wordpress/icons';

interface TrendComparisonBadgeProps {
	count: number;
	previousCount: number;
}

function percentCalculator( part: number, whole: number ) {
	// Handle NaN case.
	if ( part === 0 && whole === 0 ) {
		return 0;
	}
	const answer = part / whole;
	// Handle Infinities as 100%.
	return ! Number.isFinite( answer ) ? 100 : Math.round( answer * 100 );
}
export default function TrendComparisonBadge( {
	count,
	previousCount,
}: TrendComparisonBadgeProps ) {
	const difference = count - previousCount;
	const percentage = Number.isFinite( difference )
		? percentCalculator( Math.abs( difference as number ), previousCount )
		: null;
	if ( ! difference ) {
		return null;
	}
	const negative = difference < 0;
	return (
		// @ts-expect-error - TODO: Refactor icon from children to prop when Badge starts supporting custom icons (DS-203).
		<Badge
			intent={ negative ? 'error' : 'success' }
			style={ { width: 'fit-content' } }
			className={ `site-overview-card__badge site-overview-card__badge-${
				negative ? 'negative' : 'positive'
			}` }
		>
			<HStack spacing={ 0 }>
				<Icon
					size={ 16 }
					fill="currentColor"
					icon={ negative ? arrowDown : arrowUp }
					className="site-overview-card__badge-icon"
				/>
				<span>{ `${ percentage }%` }</span>
			</HStack>
		</Badge>
	);
}
