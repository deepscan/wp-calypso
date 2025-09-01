import { DotcomFeatures } from '@automattic/api-core';
import { useMutation } from '@tanstack/react-query';
import { __experimentalVStack as VStack, Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { addQueryArgs } from '@wordpress/url';
import { sitePlanSoftwareRestoreMutation } from '../../app/queries/site-plans';
import { ActionList } from '../../components/action-list';
import { SectionHeader } from '../../components/section-header';
import { hasPlanFeature } from '../../utils/site-features';
import { canViewSiteActions } from '../features';
import type { Site } from '@automattic/api-core';

const RestorePlanSoftware = ( { site }: { site: Site } ) => {
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const mutation = useMutation( sitePlanSoftwareRestoreMutation( site.ID ) );

	const handleClick = () => {
		mutation.mutate( undefined, {
			onSuccess: () => {
				createSuccessNotice(
					__( 'Requested restoration of plugins and themes that come with your plan.' ),
					{ type: 'snackbar' }
				);
			},
			onError: () => {
				createErrorNotice( __( 'Failed to request restoration of plan plugin and themes.' ), {
					type: 'snackbar',
				} );
			},
		} );
	};

	return (
		<ActionList.ActionItem
			title={ __( 'Re-install plugins & themes' ) }
			description={ __(
				'If your website is missing plugins and themes that come with your plan you can re-install them here.'
			) }
			actions={
				<Button
					variant="secondary"
					size="compact"
					isBusy={ mutation.isPending }
					onClick={ handleClick }
				>
					{ __( 'Restore' ) }
				</Button>
			}
		/>
	);
};

const DuplicateSite = ( { site }: { site: Site } ) => {
	return (
		<ActionList.ActionItem
			title={ __( 'Duplicate site' ) }
			description={ __( 'Create a duplicate of this site.' ) }
			actions={
				<Button
					variant="secondary"
					size="compact"
					href={ addQueryArgs( '/setup/copy-site', {
						sourceSlug: site.slug,
					} ) }
				>
					{ __( 'Duplicate' ) }
				</Button>
			}
		/>
	);
};

export default function SiteActions( { site }: { site: Site } ) {
	if ( ! canViewSiteActions( site ) ) {
		return null;
	}

	const actions = [
		site.is_wpcom_atomic && <RestorePlanSoftware key="restore-plan-software" site={ site } />,
		hasPlanFeature( site, DotcomFeatures.COPY_SITE ) && (
			<DuplicateSite key="duplicate-site" site={ site } />
		),
	].filter( Boolean );

	if ( ! actions.length ) {
		return null;
	}

	return (
		<VStack spacing={ 3 }>
			<SectionHeader title={ __( 'Actions' ) } level={ 3 } />
			<ActionList>{ actions }</ActionList>
		</VStack>
	);
}
