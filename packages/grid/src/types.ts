/**
 * Grid layout item definition
 */
export interface GridLayoutItem {
	/**
	 * Unique key that matches a child component key.
	 */
	key: string;

	/**
	 * Number of columns this item spans.
	 */
	width?: number;

	/**
	 * Number of rows this item spans.
	 */
	height?: number;

	/**
	 * Optional order value for responsive mode (lower values displayed first)
	 */
	order?: number;

	/**
	 * Whether this item should always span all available columns in responsive mode
	 */
	fullWidth?: boolean;
}

export interface NormalizedGridLayoutItem extends GridLayoutItem {
	order: number;
	width: number;
	height: number;
}

/**
 * Props for the Grid component
 */
interface BaseGridProps {
	/**
	 * Array of layout items.
	 */
	layout: GridLayoutItem[];

	/**
	 * Grid children.
	 */
	children: React.ReactNode;

	/**
	 * Additional CSS class.
	 */
	className?: string;

	/**
	 * Grid gap multiplier size (e.g., a spacing of 2 results in a gap of 8px, it's multiplied by 4).
	 * @default 2
	 */
	spacing?: number;

	/**
	 * Height of each row in pixes or auto (e.g., 20, "auto")
	 */
	rowHeight?: number | 'auto';

	/**
	 * Whether the grid is in edit mode (allows dragging and repositioning items)
	 * @default false
	 */
	editMode?: boolean;

	/**
	 * Callback fired when layout changes due to item dragging
	 */
	onChangeLayout?: ( newLayout: GridLayoutItem[] ) => void;
}

interface StandardGridProps extends BaseGridProps {
	/**
	 * Total number of columns in the grid.
	 * @default 6
	 */
	columns: number;

	minColumnWidth?: never;
}

interface ResponsiveGridProps extends BaseGridProps {
	/**
	 * Minimum width in pixels for each column in responsive mode.
	 * If provided, enables responsive mode which automatically adjusts columns based on container width.
	 */
	minColumnWidth?: number;

	columns?: never;
}

export type GridProps = StandardGridProps | ResponsiveGridProps;
