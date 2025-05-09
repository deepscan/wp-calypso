import { Grid } from '../grid';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof Grid > = {
	title: 'Grid',
	component: Grid,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		children: { control: false },
	},
};
export default meta;

function Card( {
	style,
	color,
	children,
}: {
	style?: React.CSSProperties;
	color: string;
	children: React.ReactNode;
} ) {
	return (
		<div
			key="a"
			style={ {
				backgroundColor: color,
				color: 'white',
				padding: '20px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				...style,
			} }
		>
			{ children }
		</div>
	);
}

/**
 * Basic usage example of the Grid component
 */
export const Default: StoryObj< typeof Grid > = {
	args: {
		layout: [
			{ key: 'a', x: 0, y: 0, width: 1 },
			{ key: 'b', x: 1, y: 0, width: 3 },
			{ key: 'c', x: 4, y: 0, width: 1 },
		],
		columns: 6,
		children: [
			<Card key="a" color="#f44336">
				A
			</Card>,
			<Card key="b" color="#2196f3">
				B
			</Card>,
			<Card key="c" color="#4caf50">
				C
			</Card>,
		],
	},
};

/**
 * Basic usage example of the Grid component with implicit positions
 */
export const Implicit: StoryObj< typeof Grid > = {
	args: {
		layout: [
			{ key: 'a', width: 1 },
			{ key: 'b', width: 3 },
			{ key: 'c', width: 1 },
		],
		columns: 6,
		spacing: 2,
		rowHeight: '100px',
		children: [
			<Card key="a" color="#f44336">
				A
			</Card>,
			<Card key="b" color="#2196f3">
				B
			</Card>,
			<Card key="c" color="#4caf50">
				C
			</Card>,
		],
	},
};

/**
 * Multi-row grid layout example
 */
export const MultiRowLayout: StoryObj< typeof Grid > = {
	args: {
		layout: [
			{ key: 'a', x: 0, y: 0, width: 2, height: 1 },
			{ key: 'b', x: 2, y: 0, width: 3, height: 2 },
			{ key: 'c', x: 5, y: 0, width: 1, height: 1 },
			{ key: 'd', x: 0, y: 1, width: 2, height: 1 },
			{ key: 'e', x: 5, y: 1, width: 1, height: 1 },
		],
		columns: 6,
		spacing: 2,
		rowHeight: '100px',
		children: [
			<Card key="a" color="#f44336">
				A
			</Card>,
			<Card key="b" color="#2196f3">
				B
			</Card>,
			<Card key="c" color="#4caf50">
				C
			</Card>,
			<Card key="d" color="#ff9800">
				D
			</Card>,
			<Card key="e" color="#9c27b0">
				E
			</Card>,
			<Card key="f" color="black">
				F
			</Card>,
		],
	},
};
