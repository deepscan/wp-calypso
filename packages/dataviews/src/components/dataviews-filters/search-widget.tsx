/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import removeAccents from 'remove-accents';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useMemo, useDeferredValue } from '@wordpress/element';
import { VisuallyHidden, Icon, Composite } from '@wordpress/components';
import { search, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getCurrentValue } from './utils';
import type { Filter, NormalizedFilter, View, Option } from '../../types';

interface SearchWidgetProps {
	view: View;
	filter: NormalizedFilter & {
		elements: Option[];
	};
	onChangeView: ( view: View ) => void;
}

function normalizeSearchInput( input = '' ) {
	return removeAccents( input.trim().toLowerCase() );
}

const getNewValue = (
	filterDefinition: NormalizedFilter,
	currentFilter: Filter | undefined,
	value: any
) => {
	if ( filterDefinition.singleSelection ) {
		return value;
	}

	if ( Array.isArray( currentFilter?.value ) ) {
		return currentFilter.value.includes( value )
			? currentFilter.value.filter( ( v ) => v !== value )
			: [ ...currentFilter.value, value ];
	}

	return [ value ];
};

function generateFilterElementCompositeItemId(
	prefix: string,
	filterElementValue: string
) {
	return `${ prefix }-${ filterElementValue }`;
}

const MultiSelectionOption = ( { selected }: { selected: boolean } ) => {
	return (
		<span
			className={ clsx(
				'dataviews-filters__search-widget-listitem-multi-selection',
				{ 'is-selected': selected }
			) }
		>
			{ selected && <Icon icon={ check } /> }
		</span>
	);
};

const SingleSelectionOption = ( { selected }: { selected: boolean } ) => {
	return (
		<span
			className={ clsx(
				'dataviews-filters__search-widget-listitem-single-selection',
				{ 'is-selected': selected }
			) }
		/>
	);
};

function ListBox( { view, filter, onChangeView }: SearchWidgetProps ) {
	const baseId = useInstanceId( ListBox, 'dataviews-filter-list-box' );

	const [ activeCompositeId, setActiveCompositeId ] = useState<
		string | null | undefined
	>(
		// When there are one or less operators, the first item is set as active
		// (by setting the initial `activeId` to `undefined`).
		// With 2 or more operators, the focus is moved on the operators control
		// (by setting the initial `activeId` to `null`), meaning that there won't
		// be an active item initially. Focus is then managed via the
		// `onFocusVisible` callback.
		filter.operators?.length === 1 ? undefined : null
	);
	const currentFilter = view.filters?.find(
		( f ) => f.field === filter.field
	);
	const currentValue = getCurrentValue( filter, currentFilter );
	return (
		<Composite
			virtualFocus
			focusLoop
			activeId={ activeCompositeId }
			setActiveId={ setActiveCompositeId }
			role="listbox"
			className="dataviews-filters__search-widget-listbox"
			aria-label={ sprintf(
				/* translators: List of items for a filter. 1: Filter name. e.g.: "List of: Author". */
				__( 'List of: %1$s' ),
				filter.name
			) }
			onFocusVisible={ () => {
				// `onFocusVisible` needs the `Composite` component to be focusable,
				// which is implicitly achieved via the `virtualFocus` prop.
				if ( ! activeCompositeId && filter.elements.length ) {
					setActiveCompositeId(
						generateFilterElementCompositeItemId(
							baseId,
							filter.elements[ 0 ].value
						)
					);
				}
			} }
			render={ <Composite.Typeahead /> }
		>
			{ filter.elements.map( ( element ) => (
				<Composite.Hover
					key={ element.value }
					render={
						<Composite.Item
							id={ generateFilterElementCompositeItemId(
								baseId,
								element.value
							) }
							render={
								<div
									aria-label={ element.label }
									role="option"
									className="dataviews-filters__search-widget-listitem"
								/>
							}
							onClick={ () => {
								const newFilters = currentFilter
									? [
											...( view.filters ?? [] ).map(
												( _filter ) => {
													if (
														_filter.field ===
														filter.field
													) {
														return {
															..._filter,
															operator:
																currentFilter.operator ||
																filter
																	.operators[ 0 ],
															value: getNewValue(
																filter,
																currentFilter,
																element.value
															),
														};
													}
													return _filter;
												}
											),
									  ]
									: [
											...( view.filters ?? [] ),
											{
												field: filter.field,
												operator: filter.operators[ 0 ],
												value: getNewValue(
													filter,
													currentFilter,
													element.value
												),
											},
									  ];
								onChangeView( {
									...view,
									page: 1,
									filters: newFilters,
								} );
							} }
						/>
					}
				>
					{ filter.singleSelection && (
						<SingleSelectionOption
							selected={ currentValue === element.value }
						/>
					) }
					{ ! filter.singleSelection && (
						<MultiSelectionOption
							selected={ currentValue.includes( element.value ) }
						/>
					) }
					<span>{ element.label }</span>
				</Composite.Hover>
			) ) }
		</Composite>
	);
}

function ComboboxList( { view, filter, onChangeView }: SearchWidgetProps ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const deferredSearchValue = useDeferredValue( searchValue );
	const currentFilter = view.filters?.find(
		( _filter ) => _filter.field === filter.field
	);
	const currentValue = getCurrentValue( filter, currentFilter );
	const matches = useMemo( () => {
		const normalizedSearch = normalizeSearchInput( deferredSearchValue );
		return filter.elements.filter( ( item ) =>
			normalizeSearchInput( item.label ).includes( normalizedSearch )
		);
	}, [ filter.elements, deferredSearchValue ] );
	return (
		<Ariakit.ComboboxProvider
			selectedValue={ currentValue }
			setSelectedValue={ ( value ) => {
				const newFilters = currentFilter
					? [
							...( view.filters ?? [] ).map( ( _filter ) => {
								if ( _filter.field === filter.field ) {
									return {
										..._filter,
										operator:
											currentFilter.operator ||
											filter.operators[ 0 ],
										value,
									};
								}
								return _filter;
							} ),
					  ]
					: [
							...( view.filters ?? [] ),
							{
								field: filter.field,
								operator: filter.operators[ 0 ],
								value,
							},
					  ];
				onChangeView( {
					...view,
					page: 1,
					filters: newFilters,
				} );
			} }
			setValue={ setSearchValue }
		>
			<div className="dataviews-filters__search-widget-filter-combobox__wrapper">
				<Ariakit.ComboboxLabel
					render={
						<VisuallyHidden>
							{ __( 'Search items' ) }
						</VisuallyHidden>
					}
				>
					{ __( 'Search items' ) }
				</Ariakit.ComboboxLabel>
				<Ariakit.Combobox
					autoSelect="always"
					placeholder={ __( 'Search' ) }
					className="dataviews-filters__search-widget-filter-combobox__input"
				/>
				<div className="dataviews-filters__search-widget-filter-combobox__icon">
					<Icon icon={ search } />
				</div>
			</div>
			<Ariakit.ComboboxList
				className="dataviews-filters__search-widget-filter-combobox-list"
				alwaysVisible
			>
				{ matches.map( ( element ) => {
					return (
						<Ariakit.ComboboxItem
							resetValueOnSelect={ false }
							key={ element.value }
							value={ element.value }
							className="dataviews-filters__search-widget-listitem"
							hideOnClick={ false }
							setValueOnClick={ false }
							focusOnHover
						>
							{ filter.singleSelection && (
								<SingleSelectionOption
									selected={ currentValue === element.value }
								/>
							) }
							{ ! filter.singleSelection && (
								<MultiSelectionOption
									selected={ currentValue.includes(
										element.value
									) }
								/>
							) }
							<span>
								<Ariakit.ComboboxItemValue
									className="dataviews-filters__search-widget-filter-combobox-item-value"
									value={ element.label }
								/>
								{ !! element.description && (
									<span className="dataviews-filters__search-widget-listitem-description">
										{ element.description }
									</span>
								) }
							</span>
						</Ariakit.ComboboxItem>
					);
				} ) }
				{ ! matches.length && <p>{ __( 'No results found' ) }</p> }
			</Ariakit.ComboboxList>
		</Ariakit.ComboboxProvider>
	);
}

export default function SearchWidget( props: SearchWidgetProps ) {
	const Widget = props.filter.elements.length > 10 ? ComboboxList : ListBox;
	return <Widget { ...props } />;
}
