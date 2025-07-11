import { recordTracksEvent } from '@automattic/calypso-analytics';
import {
	Site,
	type SiteSelect,
	defaultSuccessCallback,
	useSortedLaunchpadTasks,
} from '@automattic/data-stores';
import { useSelect } from '@wordpress/data';
import { useState } from 'react';
import { ShareSiteModal } from './action-components';
import LaunchpadInternal from './launchpad-internal';
import { setUpActionsForTasks } from './setup-actions';
import type { EventHandlers, Task } from './types';

export const SITE_STORE = Site.register( { client_id: '', client_secret: '' } );

type LaunchpadProps = {
	siteSlug: string | null;
	checklistSlug: string;
	launchpadContext: string;
	onSiteLaunched?: () => void;
	onTaskClick?: EventHandlers[ 'onTaskClick' ];
	onPostFilterTasks?: ( tasks: Task[] ) => Task[];
	highlightNextAction?: boolean;
};

const Launchpad = ( {
	siteSlug,
	checklistSlug,
	launchpadContext,
	onSiteLaunched,
	onTaskClick,
	onPostFilterTasks,
	highlightNextAction,
}: LaunchpadProps ) => {
	const {
		data: { checklist },
	} = useSortedLaunchpadTasks( siteSlug, checklistSlug, launchpadContext );

	const tasklistCompleted = checklist?.every( ( task: Task ) => task.completed ) || false;

	const tracksData = { recordTracksEvent, checklistSlug, tasklistCompleted, launchpadContext };

	const site = useSelect(
		( select ) => {
			return siteSlug ? ( select( SITE_STORE ) as SiteSelect ).getSite( siteSlug ) : null;
		},
		[ siteSlug ]
	);
	const [ shareSiteModalIsOpen, setShareSiteModalIsOpen ] = useState( false );

	const taskFilter = ( tasks: Task[] ) => {
		const baseTasks = setUpActionsForTasks( {
			tasks,
			siteSlug,
			tracksData,
			extraActions: {
				setShareSiteModalIsOpen,
			},
			eventHandlers: {
				onSiteLaunched,
				onTaskClick,
			},
		} );

		if ( onPostFilterTasks ) {
			return onPostFilterTasks( baseTasks );
		}

		return baseTasks;
	};

	const launchpadOptions = {
		onSuccess: defaultSuccessCallback,
	};

	if ( ! launchpadContext ) {
		return null;
	}
	const shareSiteTask = checklist?.find( ( task: Task ) => task.id === 'share_site' ) ?? null;
	return (
		<>
			{ shareSiteModalIsOpen && site && (
				<ShareSiteModal
					setModalIsOpen={ setShareSiteModalIsOpen }
					site={ site }
					task={ shareSiteTask }
				/>
			) }
			<LaunchpadInternal
				site={ site }
				siteSlug={ siteSlug }
				checklistSlug={ checklistSlug }
				taskFilter={ taskFilter }
				useLaunchpadOptions={ launchpadOptions }
				launchpadContext={ launchpadContext }
				highlightNextAction={ highlightNextAction }
			/>
		</>
	);
};

export default Launchpad;
