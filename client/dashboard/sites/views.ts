import fastDeepEqual from 'fast-deep-equal/es6';
import { DEFAULT_FIELDS } from './fields';
import type { AnalyticsClient } from '../app/analytics';
import type { User, SitesView, SitesViewPreferences } from '@automattic/api-core';
import type { Operator, SortDirection, SupportedLayouts } from '@wordpress/dataviews';

export const DEFAULT_LAYOUTS: SupportedLayouts = {
	table: {
		showMedia: true,
		mediaField: 'icon.ico',
		titleField: 'name',
		descriptionField: 'URL',
	},
	grid: {
		showMedia: true,
		mediaField: 'preview',
		titleField: 'name',
		descriptionField: 'URL',
	},
};

const DEFAULT_LAYOUT_FIELDS: SupportedLayouts = {
	table: {
		fields: [ 'status', 'visitors', 'subscribers_count', 'plan' ],
	},
	grid: {
		fields: [ 'status' ],
	},
};

export type { SitesView, SitesViewPreferences };

// All possible keys that can be stored as view preferences.
const VIEW_PREFERENCES_KEYS = [
	'fields',
	'layout',
	'perPage',
	'showDescription',
	'showMedia',
	'sort',
	'type',
];

export type ViewSearchParams = Partial< SitesView >;

// All possible keys that can be shown in the query params.
const VIEW_SEARCH_PARAM_KEYS = [ ...VIEW_PREFERENCES_KEYS, 'filters', 'page', 'search' ];

export const DEFAULT_PER_PAGE_SIZES: [ number, number, number, number ] = [ 12, 24, 48, 96 ];

const DEFAULT_PER_PAGE = 12;

const DEFAULT_VIEW: Partial< SitesView > = {
	page: 1,
	perPage: DEFAULT_PER_PAGE,
	sort: { field: 'name', direction: 'asc' as SortDirection },
	search: '',
};

function getDefaultView( {
	user,
	isAutomattician,
	isRestoringAccount,
}: {
	user: User;
	isAutomattician: boolean;
	isRestoringAccount: boolean;
} ): SitesView {
	const type = isRestoringAccount || user.site_count > DEFAULT_PER_PAGE ? 'table' : 'grid';

	const defaultView = {
		type,
		...DEFAULT_VIEW,
		...DEFAULT_LAYOUTS[ type ],
		...DEFAULT_LAYOUT_FIELDS[ type ],
	} as SitesView;

	if ( isAutomattician ) {
		defaultView.filters = [
			{
				field: 'is_a8c',
				operator: 'is' as Operator,
				value: false,
			},
		];
	}

	return defaultView;
}

export function getView( {
	user,
	isAutomattician,
	isRestoringAccount,
	viewPreferences,
	viewSearchParams,
}: {
	user: User;
	isAutomattician: boolean;
	isRestoringAccount: boolean;
	viewPreferences?: SitesViewPreferences;
	viewSearchParams: ViewSearchParams;
} ): {
	defaultView: SitesView;
	view: SitesView;
} {
	const defaultView = getDefaultView( {
		user,
		isAutomattician,
		isRestoringAccount,
	} );

	const type = viewSearchParams.type || viewPreferences?.type || defaultView.type;

	const view = sanitizeView( {
		...defaultView,
		...DEFAULT_LAYOUTS[ type ],
		...DEFAULT_LAYOUT_FIELDS[ type ],
		...viewPreferences,
		...viewSearchParams,
	} as SitesView );

	return {
		defaultView,
		view,
	};
}

// Returns the updated view preferences and search params, after `view` has changed to `nextView`.
// The updated view preferences are produced by merging `nextView` into `viewPreferences`.
// Finally, the updated view preferences and search params are filtered to remove any default values,
// so that the remaining values reflect the user's explicit intent.
export function mergeViews( {
	defaultView,
	view,
	viewPreferences,
	nextView,
}: {
	defaultView: SitesView;
	view: SitesView;
	viewPreferences?: SitesViewPreferences;
	nextView: SitesView;
} ): {
	updatedViewPreferences: SitesViewPreferences;
	updatedViewSearchParams: ViewSearchParams;
} {
	const nextType = nextView.type;

	let updatedView = nextView;

	if ( nextType !== view.type ) {
		updatedView = {
			...updatedView,

			// If the type is changed, we restore the default layout for that type.
			...DEFAULT_LAYOUTS[ nextType ],
		} as SitesView;

		if ( ! viewPreferences?.fields ) {
			updatedView = {
				...updatedView,

				// If the type is changed, and the user has never explicitly set custom fields,
				// we restore the default fields for that type.
				...DEFAULT_LAYOUT_FIELDS[ nextType ],
			} as SitesView;
		}
	}

	const defaultNextView = {
		...defaultView,
		...DEFAULT_LAYOUTS[ nextType ],
		...DEFAULT_LAYOUT_FIELDS[ nextType ],
	} as SitesView;

	const updatedViewPreferences = {
		// Store only fields which have custom values.
		...pickNonDefaultFields( updatedView, VIEW_PREFERENCES_KEYS, defaultNextView ),

		// Store the merged layouts from all possible view types.
		layout: {
			...viewPreferences?.layout,
			...updatedView.layout,
		},
	} as SitesViewPreferences;

	const updatedViewSearchParams = {
		// Show only params which have custom values.
		...pickNonDefaultFields( updatedView, VIEW_SEARCH_PARAM_KEYS, defaultNextView ),

		// Show the type param explicitly to ensure the view type is updated immediately.
		type: nextType,
	} as ViewSearchParams;

	return {
		updatedViewPreferences,
		updatedViewSearchParams,
	};
}

function pickNonDefaultFields(
	object: Partial< SitesView >,
	keys: string[],
	defaultValues: Partial< SitesView >
) {
	return Object.fromEntries(
		Object.entries( object ).filter(
			( [ key, value ] ) =>
				keys.includes( key ) &&
				! fastDeepEqual( value, defaultValues[ key as keyof typeof defaultValues ] )
		)
	);
}

export function recordViewChanges(
	oldView: SitesView,
	newView: SitesView,
	recordTracksEvent: AnalyticsClient[ 'recordTracksEvent' ]
) {
	if ( oldView.type !== newView.type ) {
		recordTracksEvent( 'calypso_dashboard_sites_view_type_changed', { type: newView.type } );

		// Changing view type can also change fields, but they weren't triggered by a user
		// action, so we won't record those tracks events.
		return;
	}

	if (
		oldView.sort?.field !== newView.sort?.field ||
		oldView.sort?.direction !== newView.sort?.direction
	) {
		recordTracksEvent( 'calypso_dashboard_sites_view_sort_changed', {
			field: newView.sort?.field,
			direction: newView.sort?.direction,
		} );
	}

	const oldFilterFields = new Set( oldView.filters?.map( ( { field } ) => field ) || [] );
	const newFilterFields = new Set( newView.filters?.map( ( { field } ) => field ) || [] );

	for ( const added of setDifference( newFilterFields, oldFilterFields ) ) {
		recordTracksEvent( 'calypso_dashboard_sites_view_filter_changed', {
			change: 'added',
			field: added,
		} );
	}
	for ( const removed of setDifference( oldFilterFields, newFilterFields ) ) {
		recordTracksEvent( 'calypso_dashboard_sites_view_filter_changed', {
			change: 'removed',
			field: removed,
		} );
	}

	const oldShownFields = new Set( oldView.fields || [] );
	const newShownFields = new Set( newView.fields || [] );

	for ( const added of setDifference( newShownFields, oldShownFields ) ) {
		recordTracksEvent( 'calypso_dashboard_sites_view_field_visibility_changed', {
			change: 'added',
			field: added,
		} );
	}
	for ( const removed of setDifference( oldShownFields, newShownFields ) ) {
		recordTracksEvent( 'calypso_dashboard_sites_view_field_visibility_changed', {
			change: 'removed',
			field: removed,
		} );
	}
}

/**
 * Sanitize the view preference data by removing any invalid or malformed entries.
 */
function sanitizeView( view: SitesView ) {
	// If no sanitization is needed then a reference to the same object should be returned.
	let sanitized = view;

	if ( sanitized.type === 'grid' && sanitized.layout?.previewSize ) {
		// From PreviewSizePicker imageSizes in GB https://github.com/WordPress/gutenberg/blob/58a5abc7714bdff204d5f6bc350980f73686d54f/packages/dataviews/src/dataviews-layouts/grid/preview-size-picker.tsx#L14-L39
		const smallestSize = 120;
		if ( isNaN( sanitized.layout.previewSize ) || sanitized.layout.previewSize < smallestSize ) {
			delete sanitized.layout.previewSize;
		}
	}

	if ( sanitized.sort?.field ) {
		const field = DEFAULT_FIELDS.find( ( field ) => field.id === sanitized.sort?.field );
		if ( ! field || field.enableSorting === false ) {
			const { sort, ...rest } = sanitized;
			sanitized = rest;
		}
	}

	return sanitized;
}

// Ponyfill for Set.prototype.difference, which is not available in all target environments.
function setDifference< T >( a: Set< T >, b: Set< T > ): Set< T > {
	const difference = new Set( a );
	for ( const item of b ) {
		difference.delete( item );
	}
	return difference;
}
