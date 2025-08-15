import { Button } from '@wordpress/components';
import { sprintf } from '@wordpress/i18n';
import { funnel } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import { forwardRef, Ref } from 'react';
import './filter-button.scss';

type Props = {
	count: number;
	onClick: () => void;
	children?: React.ReactNode;
};

export const DomainSearchControlsFilterButton = forwardRef(
	( { count, onClick, children }: Props, ref: Ref< HTMLButtonElement > ) => {
		const { __, _n } = useI18n();

		let ariaLabel = '';
		if ( count > 0 ) {
			ariaLabel = sprintf(
				/* translators: %(filterCount)s: number of active filters */
				_n(
					'Filter, %(filterCount)s filter applied',
					'Filter, %(filterCount)s filters applied',
					count
				),
				{ filterCount: count }
			);
		} else {
			ariaLabel = __( 'Filter, no filters applied' );
		}

		return (
			<div className="domain-search-controls__filters">
				<Button icon={ funnel } variant="secondary" showTooltip onClick={ onClick } ref={ ref } />
				{ !! count && (
					<div
						className="domain-search-controls__filters-count"
						/* translators: %d: number of active filters */
						aria-label={ ariaLabel }
						aria-live="polite"
						role="status"
					>
						{ count }
					</div>
				) }
				{ children }
			</div>
		);
	}
);

DomainSearchControlsFilterButton.displayName = 'DomainSearchControlsFilterButton';
