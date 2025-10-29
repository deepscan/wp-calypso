import { __experimentalVStack as VStack, __experimentalText as Text } from '@wordpress/components';
import { forwardRef } from 'react';
import { Card, CardBody } from '../card';
import ActionItem from './action-item';
import type { ActionListProps } from './types';
import './style.scss';

function UnforwardedActionList(
	{ title, description, children }: ActionListProps,
	ref: React.ForwardedRef< HTMLDivElement >
) {
	return (
		<Card className="action-list" ref={ ref }>
			<CardBody>
				{ ( title || description ) && (
					<VStack className="action-list__heading" spacing={ 2 }>
						{ title && (
							<Text size="15px" weight={ 500 } lineHeight="20px">
								{ title }
							</Text>
						) }
						{ description && (
							<Text variant="muted" lineHeight="20px">
								{ description }
							</Text>
						) }
					</VStack>
				) }
				<VStack className="action-list__actions" spacing={ 0 }>
					{ children }
				</VStack>
			</CardBody>
		</Card>
	);
}

export const ActionList = Object.assign( forwardRef( UnforwardedActionList ), {
	/**
	 * Renders a action item inside the `ActionList` component.
	 */
	ActionItem: Object.assign( ActionItem, {
		displayName: 'ActionList.ActionItem',
	} ),
} );

export default ActionList;
