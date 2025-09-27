import { isWpError } from '@automattic/api-core';
import {
	siteSshAccessEnableMutation,
	siteSshAccessDisableMutation,
	siteSshKeysQuery,
	siteSshKeysAttachMutation,
	siteSshKeysDetachMutation,
	sshKeysQuery,
} from '@automattic/api-queries';
import { Badge } from '@automattic/ui';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	BaseControl,
	Button,
	Card,
	CardBody,
	ExternalLink,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { createInterpolateElement } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo, useState } from 'react';
import { useAuth } from '../../app/auth';
import { ButtonStack } from '../../components/button-stack';
import ClipboardInputControl from '../../components/clipboard-input-control';
import InlineSupportLink from '../../components/inline-support-link';
import { SectionHeader } from '../../components/section-header';
import type { SftpUser, SiteSshKey, UserSshKey } from '@automattic/api-core';
import type { DataFormControlProps, Field } from '@wordpress/dataviews';

type SshCardFormData = {
	connection_command: string;
	ssh_key: string;
};

const SshKeyCard = ( {
	siteSshKey,
	userLocale,
	isBusy,
	onDetach,
}: {
	siteSshKey: SiteSshKey;
	userLocale: string;
	isBusy: boolean;
	onDetach: ( siteSshKey: SiteSshKey ) => void;
} ) => {
	return (
		<Card size="small">
			<CardBody>
				<HStack spacing={ 4 } justify="space-between" alignment="flex-start">
					<VStack spacing={ 3 } alignment="flex-start">
						<VStack spacing={ 1 }>
							<Text>{ `${ siteSshKey.user_login }-${ siteSshKey.name }` }</Text>
							<Text variant="muted">{ siteSshKey.sha256 }</Text>
						</VStack>
						<Badge intent="info" style={ { height: '24px' } }>
							{ sprintf(
								/* translators: %s is when the SSH key was attached. */
								__( 'Attached on %s' ),
								new Intl.DateTimeFormat( userLocale, {
									dateStyle: 'long',
									timeStyle: 'medium',
								} ).format( new Date( siteSshKey.attached_at ) )
							) }
						</Badge>
					</VStack>
					<Button
						icon={ trash }
						label={ __( 'Detach' ) }
						isBusy={ isBusy }
						style={ { margin: '-6px' } }
						onClick={ () => onDetach( siteSshKey ) }
					/>
				</HStack>
			</CardBody>
		</Card>
	);
};

export default function SshCard( {
	siteId,
	sftpUsers,
	sshEnabled,
}: {
	siteId: number;
	sftpUsers: SftpUser[];
	sshEnabled: boolean;
} ) {
	const { user } = useAuth();
	const { data: siteSshKeys } = useQuery( siteSshKeysQuery( siteId ) );
	const { data: userSshKeys, error: userSshKeysError } = useQuery( {
		...sshKeysQuery(),
		enabled: sshEnabled,
	} );
	const toggleSshAccessMutation = useMutation(
		! sshEnabled ? siteSshAccessEnableMutation( siteId ) : siteSshAccessDisableMutation( siteId )
	);
	const attachSshKeyMutation = useMutation( siteSshKeysAttachMutation( siteId ) );
	const detachSshKeyMutation = useMutation( siteSshKeysDetachMutation( siteId ) );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const userLocale = user.locale_variant || user.language || 'en';
	const hasUserSshKeys = userSshKeys && userSshKeys.length > 0;
	const [ formData, setFormData ] = useState< SshCardFormData >( {
		connection_command: `ssh ${ sftpUsers[ 0 ]?.username }@ssh.wp.com`,
		ssh_key: 'default',
	} );

	const userKeyIsAttached = useMemo( () => {
		if ( ! siteSshKeys ) {
			return false;
		}
		return !! siteSshKeys.find( ( { user_login }: SiteSshKey ) => user_login === user.username );
	}, [ siteSshKeys, user.username ] );

	const handleCopy = ( label?: React.ReactNode ) => {
		if ( ! label ) {
			return;
		}

		createSuccessNotice(
			sprintf(
				/* translators: %s is the copied field */
				__( 'Copied %s to clipboard.' ),
				label
			),
			{
				type: 'snackbar',
			}
		);
	};

	const handleToggleSshAccess = () => {
		toggleSshAccessMutation.mutate( undefined, {
			onSuccess: () => {
				createSuccessNotice(
					sshEnabled
						? __( 'SSH access has been successfully disabled for this site.' )
						: __( 'SSH access has been successfully enabled for this site.' ),
					{
						type: 'snackbar',
					}
				);
			},
			onError: () => {
				createErrorNotice(
					sshEnabled
						? __(
								'Sorry, we had a problem disabling SSH access for this site. Please refresh the page and try again.'
						  )
						: __(
								'Sorry, we had a problem enabling SSH access for this site. Please refresh the page and try again.'
						  ),
					{
						type: 'snackbar',
					}
				);
			},
		} );
	};

	const handleAttachSshKey = () => {
		attachSshKeyMutation.mutate( formData.ssh_key, {
			onError: () => {
				createErrorNotice(
					__(
						'Sorry, we had a problem attaching SSH key to this site. Please refresh the page and try again.'
					),
					{
						type: 'snackbar',
					}
				);
			},
		} );
	};

	const handleDetachSshKey = ( siteSshKey: SiteSshKey ) => {
		detachSshKeyMutation.mutate( siteSshKey, {
			onError: () => {
				createErrorNotice(
					__(
						'Sorry, we had a problem detaching SSH key from this site. Please refresh the page and try again.'
					),
					{
						type: 'snackbar',
					}
				);
			},
		} );
	};

	const SshKeysControl = < Item, >( { field }: DataFormControlProps< Item > ) => (
		<BaseControl label={ field.label } __nextHasNoMarginBottom>
			<VStack>
				{ siteSshKeys?.map( ( siteSshKey: SiteSshKey ) => (
					<SshKeyCard
						key={ siteSshKey.sha256 }
						siteSshKey={ siteSshKey }
						userLocale={ userLocale }
						isBusy={ detachSshKeyMutation.isPending }
						onDetach={ handleDetachSshKey }
					/>
				) ) }
			</VStack>
		</BaseControl>
	);

	const fields: Field< SshCardFormData >[] = [
		{
			id: 'connection_command',
			label: __( 'Connection command' ),
			Edit: ( { field, data } ) => {
				return (
					<ClipboardInputControl
						label={ field.label }
						value={ field.getValue( { item: data } ) }
						readOnly
						__next40pxDefaultSize
						onCopy={ handleCopy }
					/>
				);
			},
		},
		{
			id: 'ssh_key',
			label: __( 'SSH key' ),
			Edit: ( { data, field, onChange, hideLabelFromVision } ) => {
				if ( siteSshKeys && siteSshKeys.length > 0 ) {
					return (
						<SshKeysControl
							data={ data }
							field={ field }
							onChange={ onChange }
							hideLabelFromVision={ hideLabelFromVision }
						/>
					);
				}

				return (
					<SelectControl
						label={ field.label }
						value={ field.getValue( { item: data } ) ?? '' }
						help={ field.description }
						options={ field.elements }
						disabled={ ! hasUserSshKeys }
						onChange={ ( newValue: any ) =>
							onChange( {
								[ field.id ]: newValue,
							} )
						}
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						hideLabelFromVision={ hideLabelFromVision }
					/>
				);
			},
			elements: hasUserSshKeys
				? userSshKeys.map( ( userSshKey: UserSshKey ) => ( {
						label: `${ user.username }-${ userSshKey.name }`,
						value: userSshKey.name,
				  } ) )
				: [
						{
							label: __( 'No SSH keys available' ),
							value: '',
						},
				  ],
		},
	];

	const form = {
		layout: { type: 'regular' as const },
		fields: [ 'connection_command', 'ssh_key' ],
	};

	if ( isWpError( userSshKeysError ) && userSshKeysError.code === 'reauthorization_required' ) {
		const currentPath = window.location.pathname;
		const loginUrl = `/me/reauth-required?redirect_to=${ encodeURIComponent( currentPath ) }`;
		window.location.href = loginUrl;
		return null;
	}

	return (
		<Card>
			<CardBody>
				<VStack spacing={ 4 }>
					<SectionHeader
						title={ __( 'SSH' ) }
						description={ createInterpolateElement(
							__(
								'SSH lets you access your site’s backend via a terminal, so you can manage files and use <wpCliLink>WP-CLI</wpCliLink> for quick changes and troubleshooting. <learnMoreLink>Learn more</learnMoreLink>'
							),
							{
								wpCliLink: <ExternalLink href="https://wp-cli.org/" children={ null } />,
								learnMoreLink: <InlineSupportLink supportContext="hosting-connect-to-ssh" />,
							}
						) }
						level={ 3 }
					/>
					<ToggleControl
						label={ __( 'Enable SSH access for this site' ) }
						checked={ sshEnabled }
						disabled={ toggleSshAccessMutation.isPending }
						onChange={ handleToggleSshAccess }
						__nextHasNoMarginBottom
					/>
					{ sshEnabled && (
						<DataForm< SshCardFormData >
							data={ formData }
							fields={ fields }
							form={ form }
							onChange={ ( edits: Partial< SshCardFormData > ) => {
								setFormData( ( data ) => ( { ...data, ...edits } ) );
							} }
						/>
					) }
					{ sshEnabled && ! userKeyIsAttached && (
						<ButtonStack justify="flex-start">
							<Button
								variant="primary"
								isBusy={ attachSshKeyMutation.isPending }
								disabled={ ! hasUserSshKeys }
								onClick={ handleAttachSshKey }
							>
								{ __( 'Attach SSH key to site' ) }
							</Button>
							<Button
								variant="secondary"
								target="_blank"
								href="/me/security/ssh-key"
								rel="noreferrer"
							>
								{ __( 'Add new SSH key ↗' ) }
							</Button>
						</ButtonStack>
					) }
				</VStack>
			</CardBody>
		</Card>
	);
}
