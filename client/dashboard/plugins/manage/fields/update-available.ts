import { __ } from '@wordpress/i18n';
import type { PluginListRow } from '../types';
import type { Field } from '@wordpress/dataviews';

export const updateAvailableField: Field< PluginListRow > = {
	id: 'updateAvailable',
	label: __( 'Update available' ),
	getValue: ( { item } ) => {
		if ( item.areAutoUpdatesAllowed === 'none' ) {
			return 0;
		}

		return [ 'some', 'all' ].includes( item.hasUpdate ) ? 2 : 1;
	},
	enableHiding: false,
	enableSorting: true,
	elements: [
		{ value: 2, label: __( 'Yes' ) },
		{ value: 1, label: __( 'No' ) },
		{ value: 0, label: __( 'Updates auto-managed' ) },
	],
	render: ( { item } ) => {
		if ( item.areAutoUpdatesAllowed === 'none' ) {
			return __( 'Updates auto-managed' );
		}

		return [ 'some', 'all' ].includes( item.hasUpdate ) ? __( 'Yes' ) : __( 'No' );
	},
};
