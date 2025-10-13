import { Button } from '@wordpress/components';
import { Icon, check, lock } from '@wordpress/icons';
import clsx from 'clsx';
import moment, { Moment } from 'moment';
import PropTypes from 'prop-types';
import { DATE_FORMAT } from 'calypso/my-sites/stats/constants';
import { useShortcuts } from './use-shortcuts';

type MomentOrNull = Moment | null;

export interface DateRangePickerShortcut {
	id: string;
	label: string;
	startDate: string;
	endDate: string;
	period: string;
	statType?: string;
	isGated?: boolean;
}

interface DateRangePickerShortcutsProps {
	selectedShortcutId?: string;
	onClick: (
		newFromDate: moment.Moment,
		newToDate: moment.Moment,
		shortcut?: DateRangePickerShortcut
	) => void;
	onShortcutClick?: ( shortcut: DateRangePickerShortcut ) => void;
	locked?: boolean;
	startDate?: MomentOrNull;
	endDate?: MomentOrNull;
	shortcutList?: DateRangePickerShortcut[];
}

const DateRangePickerShortcuts = ( {
	selectedShortcutId,
	onClick,
	onShortcutClick, // Optional callback function for tracking shortcut clicks
	locked = false,
	startDate,
	endDate,
	shortcutList,
}: DateRangePickerShortcutsProps ) => {
	const normalizeDate = ( date: MomentOrNull ) => {
		return date ? date.startOf( 'day' ) : date;
	};

	// Normalize dates to start of day
	const normalizedStartDate = startDate ? normalizeDate( startDate ) : null;
	const normalizedEndDate = endDate ? normalizeDate( endDate ) : null;

	const { supportedShortcutList: defaultShortcutList, selectedShortcut } = useShortcuts( {
		chartStart: normalizedStartDate?.format( DATE_FORMAT ) ?? '',
		chartEnd: normalizedEndDate?.format( DATE_FORMAT ) ?? '',
		shortcutId: selectedShortcutId,
	} );

	shortcutList = shortcutList || defaultShortcutList;

	const handleClick = ( shortcut: DateRangePickerShortcut ) => {
		! locked &&
			shortcut.startDate &&
			shortcut.endDate &&
			onClick( moment( shortcut.startDate ), moment( shortcut.endDate ), shortcut );

		// Call the onShortcutClick if provided
		onShortcutClick && onShortcutClick( shortcut );
	};

	selectedShortcutId = selectedShortcutId || selectedShortcut?.id || '';

	return (
		<div className="date-range-picker-shortcuts__inner">
			<ul className="date-range-picker-shortcuts__list">
				{ shortcutList.map( ( shortcut, idx ) => (
					<li
						className={ clsx( 'date-range-picker-shortcuts__shortcut', {
							'is-selected': shortcut.id === selectedShortcutId,
						} ) }
						key={ shortcut.id || idx }
					>
						<Button onClick={ () => handleClick( shortcut ) }>
							<span>{ shortcut.label }</span>
							{ shortcut.id === selectedShortcutId && <Icon icon={ check } /> }
							{ shortcut.isGated && <Icon icon={ lock } /> }
						</Button>
					</li>
				) ) }
			</ul>
		</div>
	);
};

DateRangePickerShortcuts.propTypes = {
	selectedShortcutId: PropTypes.string,
	onClick: PropTypes.func.isRequired,
	onShortcutClick: PropTypes.func,
	locked: PropTypes.bool,
	startDate: PropTypes.object,
	endDate: PropTypes.object,
};

export default DateRangePickerShortcuts;
