import { HostingFeatures } from '@automattic/api-core';
import {
	siteDefensiveModeSettingsQuery,
	siteDefensiveModeSettingsMutation,
	siteBySlugQuery,
} from '@automattic/api-queries';
import { useQuery, useSuspenseQuery, useMutation } from '@tanstack/react-query';
import {
	Card,
	CardBody,
	ExternalLink,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	Button,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useState } from 'react';
import { ButtonStack } from '../../components/button-stack';
import InlineSupportLink from '../../components/inline-support-link';
import Notice from '../../components/notice';
import PageLayout from '../../components/page-layout';
import { SectionHeader } from '../../components/section-header';
import { hasHostingFeature } from '../../utils/site-features';
import HostingFeatureGatedWithCallout from '../hosting-feature-gated-with-callout';
import SettingsPageHeader from '../settings-page-header';
import type { DefensiveModeSettingsUpdate } from '@automattic/api-core';
import type { Field } from '@wordpress/dataviews';

const availableTtls = [
	{
		label: __( '1 hour' ),
		value: '3600',
	},
	{
		label: __( '12 hours' ),
		value: '43200',
	},
	{
		label: __( '24 hours' ),
		value: '86400',
	},
	{
		label: __( '2 days' ),
		value: '172800',
	},
	{
		label: __( '7 days' ),
		value: '604800',
	},
];

const fields: Field< { ttl: string } >[] = [
	{
		id: 'ttl',
		label: __( 'Duration' ),
		Edit: 'select',
		elements: availableTtls,
	},
];

const form = {
	layout: { type: 'regular' as const },
	fields: [ 'ttl' ],
};

export default function DefensiveModeSettings( { siteSlug }: { siteSlug: string } ) {
	const { data: site } = useSuspenseQuery( siteBySlugQuery( siteSlug ) );
	const { data } = useQuery( {
		...siteDefensiveModeSettingsQuery( site.ID ),
		enabled: hasHostingFeature( site, HostingFeatures.DEFENSIVE_MODE ),
	} );
	const mutation = useMutation( siteDefensiveModeSettingsMutation( site.ID ) );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const [ formData, setFormData ] = useState< { ttl: string } >( {
		ttl: availableTtls[ 0 ].value,
	} );

	const { isPending } = mutation;

	const handleSubmit = ( data: DefensiveModeSettingsUpdate ) => {
		mutation.mutate( data, {
			onSuccess: () => {
				createSuccessNotice(
					data.active ? __( 'Defensive mode enabled.' ) : __( 'Defensive mode disabled.' ),
					{ type: 'snackbar' }
				);
			},
			onError: () => {
				createErrorNotice( __( 'Failed to save defensive mode settings.' ), {
					type: 'snackbar',
				} );
			},
		} );
	};

	const renderEnabled = () => {
		if ( ! data ) {
			return null;
		}

		const { enabled_by_a11n, enabled_until } = data;

		const date = new Date( enabled_until * 1000 );
		const enabledUntil = date.toLocaleString( undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		} );

		const handleDisable = () => {
			handleSubmit( {
				active: false,
			} );
		};

		return (
			<Notice
				variant="success"
				title={ __( 'Defensive mode is enabled' ) }
				actions={
					! enabled_by_a11n && (
						<Button
							variant="primary"
							size="compact"
							type="submit"
							isBusy={ isPending }
							disabled={ isPending }
							onClick={ handleDisable }
						>
							{ __( 'Disable' ) }
						</Button>
					)
				}
			>
				<VStack>
					{ enabled_by_a11n && (
						<Text as="p">
							{ createInterpolateElement(
								__(
									'We’ve enabled defensive mode to protect your site. <link>Contact a Happiness Engineer</link> if you need assistance.'
								),
								{
									// @ts-expect-error children prop is injected by createInterpolateElement
									link: <ExternalLink href="/help/contact" />,
								}
							) }
						</Text>
					) }

					<Text as="p">
						{ sprintf(
							// translators: %s: timestamp, e.g. May 27, 2025 11:02 AM
							__( 'This will be automatically disabled on %s.' ),
							enabledUntil
						) }
					</Text>
				</VStack>
			</Notice>
		);
	};

	const renderDisabled = () => {
		const handleEnable = ( event: React.FormEvent ) => {
			event.preventDefault();
			handleSubmit( {
				active: true,
				ttl: Number( formData.ttl ),
			} );
		};

		return (
			<VStack spacing={ 8 }>
				<Notice>{ __( 'Defensive mode is disabled.' ) }</Notice>
				<Card>
					<CardBody>
						<form onSubmit={ handleEnable }>
							<VStack spacing={ 4 }>
								<SectionHeader title={ __( 'Enable defensive mode' ) } level={ 3 } />
								<DataForm< { ttl: string } >
									data={ formData }
									fields={ fields }
									form={ form }
									onChange={ ( edits: { ttl?: string } ) => {
										setFormData( ( data ) => ( { ...data, ...edits } ) );
									} }
								/>
								<ButtonStack justify="flex-start">
									<Button
										__next40pxDefaultSize
										variant="primary"
										type="submit"
										isBusy={ isPending }
										disabled={ isPending }
									>
										{ __( 'Enable' ) }
									</Button>
								</ButtonStack>
							</VStack>
						</form>
					</CardBody>
				</Card>
			</VStack>
		);
	};

	return (
		<PageLayout
			size="small"
			header={
				<SettingsPageHeader
					title={ __( 'Defensive mode' ) }
					description={ createInterpolateElement(
						__(
							'Extra protection against spam bots and attacks. Visitors will see a quick loading page while we run additional security checks. <link>Learn more</link>'
						),
						{
							link: <InlineSupportLink supportContext="hosting-defensive-mode" />,
						}
					) }
				/>
			}
		>
			<HostingFeatureGatedWithCallout
				site={ site }
				feature={ HostingFeatures.DEFENSIVE_MODE }
				tracksFeatureId="settings-defensive-mode"
			>
				{ data?.enabled ? renderEnabled() : renderDisabled() }
			</HostingFeatureGatedWithCallout>
		</PageLayout>
	);
}
