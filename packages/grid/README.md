# Grid

A flexible grid component for React applications. This component uses CSS Grid to create layouts with automatic positioning of elements.

## Installation

```bash
yarn add @automattic/grid
```

## Usage

```jsx
import { Grid } from '@automattic/grid';

const MyLayout = () => {
	const layout = [
		{ key: 'a', width: 1 },
		{ key: 'b', width: 3 },
		{ key: 'c', width: 1 },
	];

	return (
		<Grid layout={ layout } columns={ 6 }>
			<div key="a">a</div>
			<div key="b">b</div>
			<div key="c">c</div>
		</Grid>
	);
};
```

## API

### `Grid` Component

The main component exported by this package.

#### Props

- `layout` (required): An array of layout items with the following properties:
  - `key` (string): A unique identifier that matches the `key` prop of the corresponding child component
  - `width` (number): The number of columns this item spans
  - `height` (number, optional): The number of rows this item spans (defaults to 1)
  - `order` (number, optional): In responsive mode, determines the order of items (lower values displayed first)
  - `fullWidth` (boolean, optional): In responsive mode, forces an item to always span all available columns
- `columns` (required): Total number of columns in the grid
- `className` (optional): Additional CSS class to apply to the grid container
- `spacing` (optional): Grid gap multiplier size, defaults to 2 (e.g. A spacing of 2 results in a gap of 8px, it's multiplied by 4)
- `rowHeight` (optional): Height of each row in pixels or auto (e.g., 50, "auto")
- `minColumnWidth` (optional): Minimum width in pixels for each column; when provided, enables responsive mode that automatically adjusts columns based on container width
- `editMode` (optional): Enables drag-and-drop reordering and resize functionality
- `onChangeLayout` (optional): Callback fired when the layout changes (required when `editMode` is true)

#### Child Components Props

Child components can accept special props that affect their behavior within the grid:

- `actionableArea` (optional): React content rendered above the draggable area that remains interactive during edit mode. Useful for controls like action buttons, inputs, or links that need to stay actionable when `editMode` is enabled. Note that positioning and styling of this content is the consumer's responsibility - you'll need to use absolute positioning or similar techniques to place elements where needed within the grid tile.

```jsx
// Example with actionable area in edit mode
<Grid layout={ layout } editMode onChangeLayout={ setLayout }>
	<Card
		key="a"
		actionableArea={
			<button onClick={ handleClose }>×</button>
		}
	>
		Card content
	</Card>
</Grid>
```

## Standard vs. Responsive Mode

The Grid component can operate in two modes:

### Standard Mode (Default)

In standard mode, items are positioned automatically in a grid with the specified number of columns. Each item can span multiple columns and rows.

```jsx
// Standard layout with 6 columns
<Grid
	layout={ [
		{ key: 'a', width: 2 },
		{ key: 'b', width: 4 },
	] }
	columns={ 6 }
>
	<div key="a">Item A</div>
	<div key="b">Item B</div>
</Grid>
```

### Responsive Mode

When `minColumnWidth` is provided, the Grid activates responsive mode, which automatically adjusts the number of columns based on the container width. In this mode:

1. Items flow according to their `order` property (or original array order if not specified)
2. The grid will use the available space to fit as many columns as possible, based on the `minColumnWidth`
3. Items that can't fit on a row will wrap to the next row
4. Items with `fullWidth` set to `true` will always span all available columns

```jsx
// Responsive layout that adapts to container width
<Grid
	layout={ [
		{ key: 'a', width: 2, order: 1 },
		{ key: 'b', width: 2, order: 2 },
		{ key: 'c', width: 4, order: 3, fullWidth: true },
	] }
	minColumnWidth={ 150 } // Each column should be at least 150px
>
	<div key="a">Item A</div>
	<div key="b">Item B</div>
	<div key="c">Item C (always full width)</div>
</Grid>
```
