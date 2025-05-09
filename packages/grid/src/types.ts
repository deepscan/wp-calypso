/**
 * Grid layout item definition
 */
export interface GridLayoutItem {
	/**
	 * Unique key that matches a child component key.
	 */
	key: string;

	/**
	 * Starting column (0-indexed).
	 */
	x?: number;

	/**
	 * Starting row (0-indexed).
	 */
	y?: number;

	/**
	 * Number of columns this item spans.
	 */
	width?: number;

	/**
	 * Number of rows this item spans.
	 */
	height?: number;
}

/**
 * Props for the Grid component
 */
export interface GridProps {
	/**
	 * Array of layout items.
	 */
	layout: GridLayoutItem[];

	/**
	 * Total number of columns in the grid.
	 * @default 1
	 */
	columns: number;

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
	 * Height of each row (e.g., "50px", "auto")
	 */
	rowHeight?: string;
}
