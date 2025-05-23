<!-- This file lists the modifications done to the base package `@wordpress/dataviews` that are published under `@automattic/dataviews`. -->

## Next

- Add a new DataForm Edit control: `toggleGroup`, which renders a `<ToggleGroupControl />`. If the field elements (options) have a `description`, then the selected option's description will be also rendered.
- Implement the `media` field type definition and allow type definitions to provide a new default: `enableSorting`.
- Add new `boolean` field type definition and edit control. Field type definitions are able to define a default render function that will be used if the field doesn't define one.
- Pin the actions column on the table view when the width is insufficient.
- Bring changes from @wordpress/dataviews 4.19.0 (no updates in this version).$
- Add `renderItemLink` prop support in the `DataViews` component. It replaces `onClickItem`prop and allows integration with router libraries.
- Enhance filter component styles.
- Adds new story that combines DataViews and DataForm.
- Add user input filter support based on the `Edit` property of the field type definitions.
- Add new filter operators: `lessThan`, `greaterThan`, `lessThanOrEqual`, and `greaterThanOrEqual` for numeric and comparable fields.

## 0.1.1

- Add support for free composition in the `DataViews` component by exporting subcomponents: `<DataViews.ViewConfig />`, `<DataViews.Search />`, `<DataViews.Pagination />`, `<DataViews.LayoutSwitcher />`, `<DataViews.Layout />`, `<DataViews.FiltersToggle />`, `<DataViews.Filters />`, `<DataViews.BulkActionToolbar />`.
- Fix `filterSortAndPaginate` to handle undefined values for the `is` filter.

## 0.1.0

- First release of the `@automattic/dataviews` package. It bundles all changes from `@wordpress/dataviews` 4.18.0.
