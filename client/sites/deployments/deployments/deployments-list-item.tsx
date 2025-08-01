import page from '@automattic/calypso-router';
import { Button, Dialog } from '@automattic/components';
import { useLocale } from '@automattic/i18n-utils';
import { Spinner } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { sprintf } from '@wordpress/i18n';
import { useI18n } from '@wordpress/react-i18n';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';
import { getSelectedSite, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import { useDispatch, useSelector } from '../../../state';
import { manageDeploymentPage, viewDeploymentLogs } from '../routes';
import { formatDate } from '../utils/dates';
import { DeleteDeploymentDialog } from './delete-deployment-dialog';
import { DeploymentCommitDetails } from './deployment-commit-details';
import { DeploymentDuration } from './deployment-duration';
import { DeploymentStarterMessage } from './deployment-starter-message';
import { DeploymentStatus, DeploymentStatusValue } from './deployment-status';
import { DeploymentsListItemActions } from './deployments-list-item-actions';
import { CodeDeploymentData } from './use-code-deployments-query';
import { useCreateCodeDeploymentRun } from './use-create-code-deployment-run';
import { useWorkflowValidationError } from './use-workflow-validation-error';

const noticeOptions = {
	duration: 3000,
};

interface DeploymentsListItemProps {
	deployment: CodeDeploymentData;
}

export const DeploymentsListItem = ( { deployment }: DeploymentsListItemProps ) => {
	const siteSlug = useSelector( getSelectedSiteSlug );
	const site = useSelector( getSelectedSite );
	const dispatch = useDispatch();
	const locale = useLocale();
	const { __ } = useI18n();
	const { showWorkflowValidationError, shouldShowWorkflowError } =
		useWorkflowValidationError( dispatch );

	const { triggerManualDeployment, isPending: isTriggeringDeployment } = useCreateCodeDeploymentRun(
		deployment.blog_id,
		deployment.id,
		{
			onSuccess: () => {
				dispatch( recordTracksEvent( 'calypso_hosting_github_manual_deployment_run_success' ) );
				dispatch( successNotice( __( 'Deployment run created.' ), noticeOptions ) );
			},
			onError: ( error ) => {
				dispatch(
					recordTracksEvent( 'calypso_hosting_github_manual_deployment_run_failed', {
						reason: error.message,
					} )
				);

				if ( error.code === 'invalid_workflow_file' ) {
					showWorkflowValidationError( siteSlug as string, deployment.id );
				} else {
					dispatch(
						errorNotice(
							// translators: "reason" is why connecting the branch failed.
							sprintf( __( 'Failed to trigger deployment run: %(reason)s' ), {
								reason: error.message,
							} ),
							{
								...noticeOptions,
							}
						)
					);
				}
			},
		}
	);

	const run = deployment.current_deployment_run;
	const [ installation, repo ] = deployment.repository_name.split( '/' );

	useEffect( () => {
		if (
			run?.failure_code === 'workflow_run_failure' &&
			run?.id &&
			shouldShowWorkflowError( run.id )
		) {
			showWorkflowValidationError( siteSlug as string, deployment.id, run.id );
		}
	}, [
		run?.failure_code,
		run?.id,
		dispatch,
		siteSlug,
		deployment.id,
		showWorkflowValidationError,
		shouldShowWorkflowError,
	] );

	const columns = run ? (
		<>
			<td>{ run && <DeploymentCommitDetails run={ run } deployment={ deployment } /> }</td>
			<td>
				{ run && (
					<DeploymentStatus
						status={ run.status as DeploymentStatusValue }
						href={ viewDeploymentLogs( siteSlug!, deployment.id ) }
					/>
				) }
			</td>
			<td>
				<span>{ formatDate( locale, new Date( run.created_on ) ) }</span>
			</td>
			<td>{ run && <DeploymentDuration run={ run } /> }</td>
		</>
	) : (
		<DeploymentStarterMessage deployment={ deployment } />
	);

	const [ isDisconnectRepositoryDialogVisible, setDisconnectRepositoryDialogVisibility ] =
		useState( false );
	const [ isProductionDeploymentModalVisible, setProductionDeploymentModalVisibility ] =
		useState( false );

	const isProductionSite = ! site?.is_wpcom_staging_site;

	const handleManualDeployment = () => {
		if ( isProductionSite ) {
			setProductionDeploymentModalVisibility( true );
		} else {
			triggerManualDeployment();
		}
	};

	const handleConfirmProductionDeployment = () => {
		setProductionDeploymentModalVisibility( false );
		triggerManualDeployment();
	};

	const handleCancelProductionDeployment = () => {
		setProductionDeploymentModalVisibility( false );
	};

	return (
		<>
			<tr>
				<td>
					<div className="github-deployments-list__repository-details">
						<Button
							onClick={ () => {
								page( manageDeploymentPage( siteSlug!, deployment.id ) );
							} }
						>
							{ repo }
						</Button>
						<span>{ installation }</span>
					</div>
				</td>
				{ columns }
				<td>
					{ isTriggeringDeployment ? (
						<Spinner />
					) : (
						<DeploymentsListItemActions
							siteSlug={ siteSlug! }
							deployment={ deployment }
							onManualDeployment={ handleManualDeployment }
							onDisconnectRepository={ () => setDisconnectRepositoryDialogVisibility( true ) }
						/>
					) }
				</td>
			</tr>
			<DeleteDeploymentDialog
				deployment={ deployment }
				isVisible={ isDisconnectRepositoryDialogVisible }
				onClose={ () => setDisconnectRepositoryDialogVisibility( false ) }
			/>
			<Dialog
				isVisible={ isProductionDeploymentModalVisible }
				showCloseIcon
				buttons={ [
					<Button key="cancel" onClick={ handleCancelProductionDeployment }>
						{ __( 'Cancel' ) }
					</Button>,
					<Button key="deploy" primary onClick={ handleConfirmProductionDeployment }>
						{ __( 'Deploy to production' ) }
					</Button>,
				] }
				onClose={ handleCancelProductionDeployment }
			>
				<div className="github-deployments-production-deployment-dialog">
					<h1>{ __( 'Deploy to production' ) }</h1>
					<p>
						{ __(
							'You are about to deploy changes to your production site. This will replace contents of your live site with the selected repository.'
						) }
					</p>
					<p>{ __( 'Are you sure you want to continue?' ) }</p>
				</div>
			</Dialog>
		</>
	);
};
