# Bredcrumb (TSX)

This component displays an array of items as a breadcrumb.
Each item should have at least a label.

## How to use

```js
import Breadcrumb from 'calypso/components/breadcrumb';

const BreadcrumbExamples = () => {
	const navigationItems = [
		{ label: 'Plugins', href: `/plugins` },
		{ label: 'Search', href: `/plugins?s=woo` },
		{ label: 'Woocommerce' },
	];

	return (
		<>
			<Breadcrumb items={ [ { label: 'Plugins' } ] } />
			<br />
			<Breadcrumb items={ navigationItems } />
			<br />
			<Breadcrumb items={ navigationItems } mobileItem="Go Back" compact />
		</>
	);
};
```

## Props

- `items` (`{ label: string; href?: string; helpBubble?: React.ReactElement; onClick?: () => void }[]`) - The Navigations items to be shown
- `compact` (`boolean`) - Displays only the previous item URL (optional)
- `mobileItem` (`{ label: string; href?: string; helpBubble?: React.ReactElement; onClick?: () => void }`) - In compact version, displays this value. If not passed defaults to "Back" and the href of the second-to-last item (optional)
