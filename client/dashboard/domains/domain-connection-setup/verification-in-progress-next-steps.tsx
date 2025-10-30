import { Icon, type IconType } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { rotateRight, globe, published } from '@wordpress/icons';
import { ActionList } from '../../components/action-list';
import { CollapsibleCard } from '../../components/collapsible-card';
import { SectionHeader } from '../../components/section-header';

import './style.scss';

interface DomainConnectionNextStep {
	id: string;
	title: string;
	description: string;
	icon: IconType;
}

export default function VerificationInProgressNextSteps() {
	const data: DomainConnectionNextStep[] = [
		{
			id: 'automatic-verification',
			title: __( 'Automatic verification' ),
			description: __( 'We’ll continue checking your name servers until they’re all verified.' ),
			icon: rotateRight,
		},
		{
			id: 'global-propagation',
			title: __( 'Global propagation' ),
			description: __(
				'Once name servers are verified, your domain name will gradually become live globally.'
			),
			icon: globe,
		},
		{
			id: 'cache-propagation',
			title: __( 'We’ll notify you when it’s ready' ),
			description: __( 'No need to refresh this page. We’ll email you as soon as it’s done.' ),
			icon: published,
		},
	];

	return (
		<CollapsibleCard
			header={ <SectionHeader level={ 3 } title={ __( 'What happens next' ) } /> }
			className="verification-in-progress-next-steps"
		>
			{ /* TODO: We should replace with ItemList component once it's available.
			See https://github.com/Automattic/wp-calypso/pull/106628#discussion_r2475530089 */ }
			{ data.map( ( item ) => (
				<ActionList.ActionItem
					key={ item.id }
					title={ item.title }
					description={ item.description }
					decoration={ <Icon icon={ item.icon } /> }
					actions={ null }
				/>
			) ) }
		</CollapsibleCard>
	);
}
