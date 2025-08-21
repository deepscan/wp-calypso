import { useQueryClient } from '@tanstack/react-query';
import { sprintf } from '@wordpress/i18n';
import { useI18n } from '@wordpress/react-i18n';
import { localize } from 'i18n-calypso';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { JetpackConnectionHealthBanner } from 'calypso/components/jetpack/connection-health';
import { USE_SITE_EXCERPTS_QUERY_KEY } from 'calypso/data/sites/use-site-excerpts-query';
import { useSelector } from 'calypso/state';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { fetchAutomatedTransferStatus } from 'calypso/state/automated-transfer/actions';
import {
	transferStates,
	transferInProgress,
	transferRevertingInProgress,
} from 'calypso/state/automated-transfer/constants';
import { getCurrentUserId } from 'calypso/state/current-user/selectors';
import { requestJetpackConnectionHealthStatus } from 'calypso/state/jetpack-connection-health/actions';
import isJetpackConnectionProblem from 'calypso/state/jetpack-connection-health/selectors/is-jetpack-connection-problem';
import { errorNotice, removeNotice, successNotice } from 'calypso/state/notices/actions';
import isJetpackSite from 'calypso/state/sites/selectors/is-jetpack-site';
import { setStagingSiteStatus } from 'calypso/state/staging-site/actions';
import { StagingSiteStatus } from 'calypso/state/staging-site/constants';
import {
	getStagingSiteStatus,
	getIsStagingSiteStatusComplete,
} from 'calypso/state/staging-site/selectors';
import { getIsSyncingInProgress } from 'calypso/state/sync/selectors/get-is-syncing-in-progress';
import { getSelectedSiteId, getSelectedSite } from 'calypso/state/ui/selectors';
import { useAddStagingSiteMutation } from '../../hooks/use-add-staging-site';
import { useCheckStagingSiteStatus } from '../../hooks/use-check-staging-site-status';
import { useDeleteStagingSite } from '../../hooks/use-delete-staging-site';
import { useGetLockQuery, USE_STAGING_SITE_LOCK_QUERY_KEY } from '../../hooks/use-get-lock-query';
import { useHasValidQuotaQuery } from '../../hooks/use-has-valid-quota';
import { useStagingSite } from '../../hooks/use-staging-site';
import { usePullFromStagingMutation, usePushToStagingMutation } from '../../hooks/use-staging-sync';
import { CardContentWrapper } from './card-content/card-content-wrapper';
import { ManageStagingSiteCardContent } from './card-content/manage-staging-site-card-content';
import { NewStagingSiteCardContent } from './card-content/new-staging-site-card-content';
import { StagingSiteLoadingBarCardContent } from './card-content/staging-site-loading-bar-card-content';
import { StagingSiteLoadingErrorCardContent } from './card-content/staging-site-loading-error-card-content';
import { LoadingPlaceholder } from './loading-placeholder';
import './style.scss';
const stagingSiteAddSuccessNoticeId = 'staging-site-add-success';
const stagingSiteAddFailureNoticeId = 'staging-site-add-failure';
const stagingSiteDeleteSuccessNoticeId = 'staging-site-remove-success';
const stagingSiteDeleteFailureNoticeId = 'staging-site-remove-failure';

export const StagingSiteCard = ( {
	currentUserId,
	siteId,
	siteOwnerId,
	translate,
	isJetpack,
	isPossibleJetpackConnectionProblem,
	dispatch,
	isDevelopmentSite,
} ) => {
	const { __ } = useI18n();
	const queryClient = useQueryClient();
	const [ syncError, setSyncError ] = useState( null );
	const [ didInitiateAdd, setDidInitiateAdd ] = useState( false );

	const isSyncInProgress = useSelector( ( state ) => getIsSyncingInProgress( state, siteId ) );

	const removeAllNotices = () => {
		dispatch( removeNotice( stagingSiteAddSuccessNoticeId ) );
		dispatch( removeNotice( stagingSiteAddFailureNoticeId ) );
		dispatch( removeNotice( stagingSiteDeleteSuccessNoticeId ) );
		dispatch( removeNotice( stagingSiteDeleteFailureNoticeId ) );
	};

	const {
		data: hasValidQuota,
		isLoading: isLoadingQuotaValidation,
		error: isErrorValidQuota,
	} = useHasValidQuotaQuery( siteId );

	const {
		data: stagingSites,
		isLoading: isLoadingStagingSites,
		error: loadingError,
	} = useStagingSite( siteId );

	useEffect( () => {
		if ( loadingError ) {
			dispatch(
				recordTracksEvent( 'calypso_hosting_configuration_staging_site_load_failure', {
					code: loadingError.code,
				} )
			);
		}
	}, [ dispatch, loadingError ] );

	const stagingSite = useMemo( () => {
		return stagingSites?.length ? stagingSites[ 0 ] : {};
	}, [ stagingSites ] );

	const stagingSiteStatus = useSelector( ( state ) => getStagingSiteStatus( state, siteId ) );

	const { addStagingSite, isLoading: isLoadingAddStagingSite } = useAddStagingSiteMutation(
		siteId,
		{
			onMutate: () => {
				removeAllNotices();
			},
			onSuccess: ( response ) => {
				queryClient.invalidateQueries( [ USE_STAGING_SITE_LOCK_QUERY_KEY, siteId ] );
				dispatch( fetchAutomatedTransferStatus( response.id ) );
			},
			onError: ( error ) => {
				queryClient.invalidateQueries( [ USE_STAGING_SITE_LOCK_QUERY_KEY, siteId ] );
				dispatch(
					recordTracksEvent( 'calypso_hosting_configuration_staging_site_add_failure', {
						code: error.code,
					} )
				);
				dispatch(
					errorNotice(
						// translators: "reason" is why adding the staging site failed.
						sprintf( __( 'Failed to add staging site: %(reason)s' ), { reason: error.message } ),
						{
							id: stagingSiteAddFailureNoticeId,
						}
					)
				);
			},
		}
	);

	const { data: lock, isLoading: isLoadingLockQuery } = useGetLockQuery( siteId, {
		refetchInterval: () => {
			return isLoadingAddStagingSite ? 5000 : 0;
		},
	} );

	const hasCompletedInitialLoading =
		! isLoadingStagingSites && ! isLoadingQuotaValidation && ! isLoadingLockQuery;

	const isStagingSiteTransferComplete = useSelector( ( state ) =>
		getIsStagingSiteStatusComplete( state, siteId )
	);
	const transferStatus = useCheckStagingSiteStatus( stagingSite.id, hasCompletedInitialLoading );
	const hasSiteAccess =
		! hasCompletedInitialLoading ||
		! stagingSite.id ||
		( Boolean( stagingSite.user_has_permission ) && ! lock );

	const showAddStagingSiteCard = useMemo( () => {
		return hasCompletedInitialLoading && ! stagingSite.id && isStagingSiteTransferComplete === true;
	}, [ hasCompletedInitialLoading, isStagingSiteTransferComplete, stagingSite ] );

	const showManageStagingSiteCard = useMemo( () => {
		return hasCompletedInitialLoading && stagingSite.id && isStagingSiteTransferComplete === true;
	}, [ hasCompletedInitialLoading, isStagingSiteTransferComplete, stagingSite ] );

	const {
		deleteStagingSite,
		isReverting,
		isLoading: isDeletingLoading,
	} = useDeleteStagingSite( {
		siteId,
		stagingSiteId: stagingSite.id,
		onMutate: () => {
			removeAllNotices();
		},
		onError: ( error ) => {
			dispatch(
				recordTracksEvent( 'calypso_hosting_configuration_staging_site_delete_failure', {
					code: error.code,
				} )
			);
			dispatch(
				errorNotice(
					// translators: "reason" is why deleting the staging site failed.
					sprintf( __( 'Failed to delete staging site: %(reason)s' ), { reason: error.message } ),
					{
						id: stagingSiteDeleteFailureNoticeId,
					}
				)
			);
		},
	} );

	useEffect( () => {
		if ( stagingSiteStatus === StagingSiteStatus.COMPLETE ) {
			queryClient.invalidateQueries( [ USE_SITE_EXCERPTS_QUERY_KEY ] );
			dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.NONE ) );
			dispatch(
				successNotice( __( 'Staging site added.' ), { id: stagingSiteAddSuccessNoticeId } )
			);
		}
	}, [ __, dispatch, queryClient, siteId, stagingSiteStatus ] );

	useEffect( () => {
		//Something went wrong, and we want to set the status to none.
		// Lock is not there (expired), neither is the staging site.
		// but the status is still in progress.
		// Only reset if THIS staging card initiated the add operation
		if (
			didInitiateAdd &&
			! isLoadingAddStagingSite &&
			! lock &&
			! stagingSite.id &&
			stagingSiteStatus === StagingSiteStatus.INITIATE_TRANSFERRING
		) {
			queryClient.invalidateQueries( [ USE_SITE_EXCERPTS_QUERY_KEY ] );
			dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.NONE ) );
			dispatch(
				errorNotice( __( 'Could not add staging site. Please try again.' ), {
					id: stagingSiteAddFailureNoticeId,
				} )
			);
			setDidInitiateAdd( false );
		}
	}, [
		__,
		didInitiateAdd,
		dispatch,
		isLoadingAddStagingSite,
		lock,
		queryClient,
		siteId,
		stagingSite.id,
		stagingSiteStatus,
	] );

	useEffect( () => {
		// If we are done with the transfer, and we have not errored we want to set the action to NONE, and display a success notice.
		if ( stagingSiteStatus === StagingSiteStatus.REVERTED ) {
			dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.NONE ) );
			// Refetch the sites to remove the deleted staging site from the list
			queryClient.invalidateQueries( [ USE_SITE_EXCERPTS_QUERY_KEY ] );
			dispatch(
				successNotice( __( 'Staging site deleted.' ), { id: stagingSiteDeleteSuccessNoticeId } )
			);
		}
	}, [ __, dispatch, queryClient, siteId, stagingSiteStatus ] );

	const handleNullTransferStatus = useCallback( () => {
		// When a revert is finished, the status after deletion becomes null, as the API doesn't return any value ( returns an error ) due to the staging site's deletion.
		// There's a chance that the user will reload the page and the status will not end up being "reverted" as a result of refresh.
		// More info:
		if ( stagingSiteStatus === StagingSiteStatus.REVERTING ) {
			dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.REVERTED ) );
			return;
		}

		// If we are in the process of adding a staging site, fetching the lock, gives us the status of the transfer
		// until the automated transfer status is updated.
		// In case the cache is deleted we want to update the status to be in progress.
		if ( lock ) {
			dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.INITIATE_TRANSFERRING ) );
			return;
		}

		// In case we have just initialized our transfer, do nothing.
		if ( stagingSiteStatus === StagingSiteStatus.INITIATE_TRANSFERRING ) {
			return;
		}

		if ( stagingSite.id && stagingSiteStatus === StagingSiteStatus.INITIATE_REVERTING ) {
			return;
		}

		// In any other case, we want to update the status to none.
		// NOTE: We could easily set the status back to an empty string, and avoid having a none value.
		// That however makes the status to not being stored in cache in case we had
		// another value before.
		dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.NONE ) );
	}, [ dispatch, lock, siteId, stagingSiteStatus, stagingSite.id ] );

	const handleCompleteTransferStatus = useCallback( () => {
		// automated-transfer returns complete, even after a reload, in case of a transfer.
		// Because of that, there is a chance that we had initiated a revert, but the automated-transfer will still return complete.
		// In that case, or when we have already update the status before, or the cache is cleared in the meantime, do nonthing.
		if (
			stagingSiteStatus === StagingSiteStatus.UNSET ||
			stagingSiteStatus === StagingSiteStatus.NONE ||
			stagingSiteStatus === StagingSiteStatus.INITIATE_REVERTING ||
			stagingSiteStatus === StagingSiteStatus.COMPLETE
		) {
			return;
		}

		dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.COMPLETE ) );
	}, [ dispatch, siteId, stagingSiteStatus ] );

	useEffect( () => {
		// If anything is still loading, we don't want to do anything.
		if (
			! hasCompletedInitialLoading ||
			isLoadingAddStagingSite ||
			isDeletingLoading ||
			transferStatus === ''
		) {
			return;
		}

		switch ( transferStatus ) {
			case null:
				handleNullTransferStatus();
				break;

			case transferStates.COMPLETE:
				handleCompleteTransferStatus();
				break;

			// In case the automated-transfer returns an error, or the request fails, we want to set the status to none.
			// This make the notices to not be displayed.
			case transferStates.ERROR:
			case transferStates.REQUEST_FAILURE:
				dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.NONE ) );
				break;

			// If the revert is done we want update the staging site status to reverted.(this make notice to be displayed)
			case transferStates.REVERTED:
				// If the cache is deleted or we have already setup this before, do nothing.
				if (
					stagingSiteStatus === StagingSiteStatus.UNSET ||
					stagingSiteStatus === StagingSiteStatus.NONE ||
					stagingSiteStatus === StagingSiteStatus.REVERTED
				) {
					return;
				}
				dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.REVERTED ) );
				break;

			default:
				// If the automated-transfer revert status is in progress update the staging site status to reverting.
				if ( transferRevertingInProgress.includes( transferStatus ) ) {
					dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.REVERTING ) );
					return;
				}
				// If the automated-transfer reverting is in progress update the staging site status to transferring.
				if ( transferInProgress.includes( transferStatus ) ) {
					dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.TRANSFERRING ) );
					return;
				}
				break;
		}
	}, [
		dispatch,
		handleCompleteTransferStatus,
		handleNullTransferStatus,
		hasCompletedInitialLoading,
		isDeletingLoading,
		isLoadingAddStagingSite,
		siteId,
		stagingSiteStatus,
		transferStatus,
	] );

	const onAddClick = useCallback( () => {
		setDidInitiateAdd( true );
		dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.INITIATE_TRANSFERRING ) );
		dispatch( recordTracksEvent( 'calypso_hosting_configuration_staging_site_add_click' ) );
		addStagingSite();
	}, [ dispatch, siteId, addStagingSite ] );

	const initiateDelete = useCallback( () => {
		dispatch( setStagingSiteStatus( siteId, StagingSiteStatus.INITIATE_REVERTING ) );
		deleteStagingSite();
	}, [ dispatch, siteId, deleteStagingSite ] );

	const shouldDelete = !! sessionStorage.getItem( 'deleteStagingSite' );

	useEffect( () => {
		if ( shouldDelete && siteId && stagingSites?.length && ! isLoadingStagingSites ) {
			sessionStorage.removeItem( 'deleteStagingSite' );
			initiateDelete();
		}
	}, [ initiateDelete, shouldDelete, siteId, stagingSites, isLoadingStagingSites ] );

	const { pushToStaging } = usePushToStagingMutation( siteId, stagingSite?.id, {
		onSuccess: () => {
			dispatch( recordTracksEvent( 'calypso_hosting_configuration_staging_site_push_success' ) );
			setSyncError( null );
		},
		onError: ( error ) => {
			dispatch(
				recordTracksEvent( 'calypso_hosting_configuration_staging_site_push_failure', {
					code: error.code,
				} )
			);
			setSyncError( error.code );
		},
	} );

	const { pullFromStaging } = usePullFromStagingMutation( siteId, stagingSite?.id, {
		onSuccess: () => {
			dispatch( recordTracksEvent( 'calypso_hosting_configuration_staging_site_pull_success' ) );
			setSyncError( null );
		},
		onError: ( error ) => {
			dispatch(
				recordTracksEvent( 'calypso_hosting_configuration_staging_site_pull_failure', {
					code: error.code,
				} )
			);
			setSyncError( error.code );
		},
	} );

	const getTransferringStagingSiteContent = useCallback( () => {
		return (
			<>
				<StagingSiteLoadingBarCardContent
					isOwner={ siteOwnerId === currentUserId }
					isReverting={
						StagingSiteStatus.REVERTING === stagingSiteStatus ||
						StagingSiteStatus.INITIATE_REVERTING === stagingSiteStatus ||
						isReverting
					}
				/>
			</>
		);
	}, [ siteOwnerId, currentUserId, stagingSiteStatus, isReverting ] );

	let stagingSiteCardContent;

	if ( hasCompletedInitialLoading && loadingError ) {
		stagingSiteCardContent = (
			<StagingSiteLoadingErrorCardContent
				message={ __(
					'Unable to load staging sites. Please contact support if you believe you are seeing this message in error.'
				) }
			/>
		);
	} else if ( hasCompletedInitialLoading && isErrorValidQuota ) {
		// Can be removed. Handled in new UI.
		stagingSiteCardContent = (
			<StagingSiteLoadingErrorCardContent
				message={ __(
					'Unable to validate your site quota. Please contact support if you believe you are seeing this message in error.'
				) }
			/>
		);
	} else if ( ! hasSiteAccess && transferStatus !== null ) {
		stagingSiteCardContent = (
			<StagingSiteLoadingErrorCardContent
				message={ translate(
					'Unable to access the staging site {{a}}%(stagingSiteName)s{{/a}}. Please contact the site owner.',
					{
						args: {
							stagingSiteName: stagingSite.url,
						},
						components: {
							a: <a href={ stagingSite.url } />,
						},
					}
				) }
				testId="staging-sites-access-message"
			/>
		);
	} else if ( isLoadingAddStagingSite || isReverting || isStagingSiteTransferComplete === false ) {
		stagingSiteCardContent = getTransferringStagingSiteContent();
	} else if ( showManageStagingSiteCard ) {
		stagingSiteCardContent = (
			<ManageStagingSiteCardContent
				stagingSite={ stagingSite }
				siteId={ siteId }
				onDeleteClick={ initiateDelete }
				onPushClick={ pushToStaging }
				onPullClick={ pullFromStaging }
				isButtonDisabled={ isSyncInProgress }
				isBusy={ isReverting }
				error={ syncError }
			/>
		);
	} else if ( showAddStagingSiteCard ) {
		const getDisabledMessage = () => {
			if ( isSyncInProgress ) {
				return translate(
					'Unable to create a new staging site. If the issue persists, please contact support.'
				);
			}
			if ( isPossibleJetpackConnectionProblem ) {
				return translate(
					'Unable to create a new staging site. There is a site connection issue. If the issue persists, please contact support.'
				);
			}
			return null;
		};

		const disabledMessage = getDisabledMessage();
		stagingSiteCardContent = (
			<NewStagingSiteCardContent
				siteId={ siteId }
				onAddClick={ onAddClick }
				isDevelopmentSite={ isDevelopmentSite }
				disabledMessage={ disabledMessage }
				isButtonDisabled={
					isLoadingAddStagingSite ||
					isLoadingQuotaValidation ||
					! hasValidQuota ||
					isSyncInProgress ||
					isPossibleJetpackConnectionProblem ||
					isDevelopmentSite
				}
				showQuotaError={ ! hasValidQuota && ! isLoadingQuotaValidation }
			/>
		);
	} else if ( ! hasCompletedInitialLoading ) {
		stagingSiteCardContent = <LoadingPlaceholder />;
	}

	// Get the fresh jetpack connection health status
	useEffect( () => {
		if ( isJetpack && siteId ) {
			dispatch( requestJetpackConnectionHealthStatus( siteId ) );
		}
	}, [ dispatch, isJetpack, siteId ] );

	return (
		<CardContentWrapper>
			{ isJetpack && isPossibleJetpackConnectionProblem && (
				<JetpackConnectionHealthBanner siteId={ siteId } />
			) }
			{ stagingSiteCardContent }
		</CardContentWrapper>
	);
};

export default connect( ( state ) => {
	const currentUserId = getCurrentUserId( state );
	const siteId = getSelectedSiteId( state );
	const siteOwnerId = getSelectedSite( state )?.site_owner;
	const isDevelopmentSite = getSelectedSite( state )?.is_a4a_dev_site || false;

	return {
		currentUserId,
		isJetpack: isJetpackSite( state, siteId ),
		isPossibleJetpackConnectionProblem: isJetpackConnectionProblem( state, siteId ),
		siteId,
		siteOwnerId,
		isDevelopmentSite,
	};
} )( localize( StagingSiteCard ) );
