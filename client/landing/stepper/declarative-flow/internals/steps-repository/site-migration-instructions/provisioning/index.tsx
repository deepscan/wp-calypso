import { ExternalLink } from '@automattic/components';
import { Spinner } from '@wordpress/components';
import { Icon, closeSmall } from '@wordpress/icons';
import { translate } from 'i18n-calypso';
import { FC, ReactNode } from 'react';
import { recordMigrationInstructionsLinkClick } from '../tracking';
import './style.scss';

export type Status = 'idle' | 'pending' | 'success' | 'error';

interface ProvisioningProps {
	status: {
		siteTransfer: Status;
		migrationKey: Status;
		pluginInstallation?: Status;
	};
}

export const Provisioning: FC< ProvisioningProps > = ( { status } ) => {
	const {
		siteTransfer: siteTransferStatus,
		migrationKey: migrationKeyStatus,
		pluginInstallation: pluginInstallationStatus,
	} = status;

	const actions = [
		{ status: siteTransferStatus, text: translate( 'Provisioning your new site' ) },
		{ status: pluginInstallationStatus, text: translate( 'Installing the required plugins' ) },
		{ status: migrationKeyStatus, text: translate( 'Getting the migration key' ) },
	].filter( ( action ) => action.status );

	const currentActionIndex = actions.findIndex( ( action ) => action.status !== 'success' );
	const currentAction = actions[ currentActionIndex ];
	if ( ! currentAction ) {
		return;
	}

	let text: ReactNode = translate( "We're preparing everything to ensure your new site is ready." );
	let icon = <Spinner />;

	// Error handler.
	if ( currentAction.status === 'error' ) {
		const contactClickHandler = () => {
			recordMigrationInstructionsLinkClick( 'error-contact-support' );
		};

		text = translate(
			'Sorry, we couldn’t finish setting up your site. {{link}}Please contact support{{/link}}.',
			{
				components: {
					link: (
						<ExternalLink
							href="https://wordpress.com/help/contact"
							icon
							iconSize={ 14 }
							target="_blank"
							onClick={ contactClickHandler }
						/>
					),
				},
			}
		);
		icon = (
			<div className="migration-instructions-provisioning__action-icon-error">
				<Icon icon={ closeSmall } />
			</div>
		);
	}

	return (
		<div className="migration-instructions-provisioning">
			<p className="migration-instructions-provisioning__message">{ text }</p>

			<div className="migration-instructions-provisioning__action">
				<div className="migration-instructions-provisioning__action-icon">{ icon }</div>

				<div className="migration-instructions-provisioning__action-text">
					{ currentAction.text }
				</div>

				<div className="migration-instructions-provisioning__action-progress">
					{ currentActionIndex + 1 }/{ actions.length }
				</div>
			</div>
		</div>
	);
};
