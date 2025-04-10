import { Button } from '@wordpress/components';
import { Icon } from '@wordpress/icons';
import clsx from 'clsx';
import { TranslateResult } from 'i18n-calypso';
import React from 'react';

const ICON_SIZE = 32;

type Props = {
	buttonProps?: React.ComponentProps< typeof Button >;
	children?: JSX.Element;
	description: TranslateResult;
	disabled?: boolean;
	heading: TranslateResult;
	icon: JSX.Element;
	isBanner?: boolean;
};

export const MenuItem: React.FC< Props > = ( {
	buttonProps,
	children,
	description,
	disabled,
	heading,
	icon,
	isBanner,
} ) => {
	return (
		<Button
			{ ...buttonProps }
			className={ clsx( 'sites-add-new-site__popover-button', {
				'is-banner': isBanner,
				'is-disabled': disabled,
			} ) }
		>
			<div className="sites-add-new-site__popover-button-icon">
				<Icon className="sidebar__menu-icon" icon={ icon } size={ ICON_SIZE } />
			</div>
			<div className="sites-add-new-site__popover-button-content">
				<div className="sites-add-new-site__popover-button-heading">{ heading }</div>
				<div className="sites-add-new-site__popover-button-description">{ description }</div>
				{ children }
			</div>
		</Button>
	);
};
