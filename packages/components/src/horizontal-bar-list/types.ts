import React from 'react';

export type HorizontalBarListProps = {
	children: React.ReactNode;
	className?: string;
};

export type HorizontalBarListItemProps = {
	data: StatDataObject;
	className?: string;
	maxValue: number;
	url?: string;
	onClick?: ( e: React.MouseEvent | React.KeyboardEvent, data: StatDataObject ) => void;
	hasIndicator?: boolean;
	leftSideItem?: React.ReactNode | undefined;
	renderLeftSideItem?: ( data: StatDataObject ) => React.ReactNode | undefined;
	renderRightSideItem?: ( data: StatDataObject ) => React.ReactNode;
	useShortLabel?: boolean;
	useShortNumber?: boolean;
	leftGroupToggle?: boolean;
	isStatic?: boolean;
	additionalColumns?: React.ReactNode;
	/**
	 * @property {boolean} usePlainCard - for values that are not numeric, add this property to display a string in the values column and avoid showing horizontal bars
	 */
	usePlainCard?: boolean;
	/**
	 * @property {boolean} isLinkUnderlined - use underlined links for item lables (variants without horizontal bars)
	 */
	isLinkUnderlined?: boolean;
	/**
	 * @property {boolean} hasNoBackground - don't render the background bar and adjust indentation
	 */
	hasNoBackground?: boolean;
	/**
	 * @property {Function} formatValue - function to format the value display. Can optionally receive the full item data.
	 */
	formatValue?: ( value: number, item?: StatDataObject ) => React.ReactNode;
};

type StatDataObject = {
	id?: string;
	label: string;
	value: number;
	page?: string;
	actions?: Array< StatsActions >;
	iconClassName?: string;
	icon?: string;
	children?: Array< StatDataObject >;
	className?: string;
	link?: string;
	labelIcon?: string;
	actionMenu?: number;
	countryCode?: string;
	region?: string;
	public?: boolean;
	shortLabel?: string;
};

type StatsActions = {
	data: string;
	type: string;
};

export type StatsCardProps = {
	/**
	 * @property {React.ReactNode} children - the content of the card - not renders when isEmpty is true
	 */
	children?: React.ReactNode;
	className?: string;
	headerClassName?: string;
	title: string;
	titleURL?: string;
	titleAriaLevel?: number;
	/**
	 * @property {React.ReactNode} titleNodes - additional nodes to be displayed next to the title - use TitleExtras component for unified resutl.
	 */
	titleNodes?: React.ReactNode;
	/**
	 * @property {React.ReactNode} downloadCsv - a node to be displayed next to the title - use DownloadCsv component for unified result.
	 */
	downloadCsv?: React.ReactNode;
	footerAction?: {
		label?: string;
		url?: string;
		onClick?: ( event?: React.MouseEvent | React.KeyboardEvent ) => void;
	};
	/**
	 * @property {boolean} isEmpty - renders an empty card with a message (`emptyMessage`) when true. It doesn't render column labels.
	 */
	isEmpty?: boolean;
	isNew?: boolean;
	/**
	 * @property {string | React.ReactNode} emptyMessage - a message (or compoents) to display when the card is empty
	 */
	emptyMessage?: string | React.ReactNode;
	/**
	 * @property {string} metricLabel - a label to use for the values on the right side of the bars - `Views` by default
	 */
	metricLabel?: string;
	/**
	 * @property {React.ReactNode} heroElement - a node placed before the list
	 */
	heroElement?: React.ReactNode;
	/**
	 * @property {boolean} multiHeader - adds a sub-header row, including metric label, after the header containing the name of the card and download csv button
	 */
	multiHeader?: boolean;
	/**
	 * @property {boolean} splitHeader - instead of using a simple header containing the name of the card use additional columns and header items
	 */
	splitHeader?: boolean;
	/**
	 * @property {React.ReactNode} mainItemLabel - a label to be displayed in the main item column
	 */
	mainItemLabel?: React.ReactNode;
	/**
	 * @property {React.ReactNode} additionalHeaderColumns - additional columns to be displayed next to the default `views` column
	 */
	additionalHeaderColumns?: React.ReactNode;
	/**
	 * @property {React.ReactNode} toggleControl - component to be placed in a split header
	 */
	toggleControl?: React.ReactNode;
	/**
	 * @property {React.ReactNode} overlay - an overlay used to hide the module behind a blur overlay
	 */
	overlay?: React.ReactNode;
};

export type StatsCardAvatarProps = {
	url: string;
	altName?: string;
};
