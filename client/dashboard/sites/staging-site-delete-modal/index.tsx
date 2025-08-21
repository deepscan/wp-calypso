import { recordTracksEvent } from '@automattic/calypso-analytics';
import { useMutation } from '@tanstack/react-query';
import {
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	Button,
	Modal,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { stagingSiteDeleteMutation } from '../../app/queries/site-staging-sites';
import type { Site } from '../../data/types';

export default function StagingSiteDeleteModal( {
	site,
	onClose,
}: {
	site: Site;
	onClose: () => void;
} ) {
	const { createErrorNotice } = useDispatch( noticesStore );

	const productionSiteId = site.options?.wpcom_production_blog_id;

	const mutation = useMutation( stagingSiteDeleteMutation( site.ID, productionSiteId ?? 0 ) );

	if ( ! productionSiteId ) {
		return null;
	}

	const handleDelete = () => {
		recordTracksEvent( 'calypso_hosting_configuration_staging_site_delete_click' );
		mutation.mutate( undefined, {
			onError: ( error: Error ) => {
				recordTracksEvent( 'calypso_hosting_configuration_staging_site_delete_failure' );
				createErrorNotice( error.message || __( 'Failed to delete staging site' ), {
					type: 'snackbar',
				} );
			},
			onSuccess: () => {
				recordTracksEvent( 'calypso_hosting_configuration_staging_site_delete_success' );
				onClose();
			},
		} );
	};

	return (
		<Modal title={ __( 'Delete staging site' ) } size="medium" onRequestClose={ onClose }>
			<VStack spacing={ 4 }>
				<Text as="p">
					{ __(
						'Are you sure you want to delete this staging site? This action cannot be undone and will permanently remove all staging site content.'
					) }
				</Text>
				<HStack justify="flex-end">
					<Button variant="tertiary" disabled={ mutation.isPending } onClick={ onClose }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						isDestructive
						isBusy={ mutation.isPending }
						disabled={ mutation.isPending }
						onClick={ handleDelete }
					>
						{ __( 'Delete staging site' ) }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
}
