import { userPreferenceQuery, userPreferenceMutation } from '@automattic/api-queries';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
	Button,
	Card,
	CardBody,
	CheckboxControl,
	__experimentalVStack as VStack,
	ExternalLink,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { useState, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useAnalytics } from '../../app/analytics';
import FlashMessage from '../../components/flash-message';
import { Notice } from '../../components/notice';
import { Text } from '../../components/text';
import type { Field } from '@wordpress/dataviews';

interface OptInFormData {
	enabled: boolean;
}

const form = {
	layout: {
		type: 'regular' as const,
		labelPosition: 'top' as const,
	},
	fields: [
		{
			id: 'optInForm',
			label: __( 'Try the new Hosting Dashboard' ),
			children: [ 'description', 'enabled' ],
		},
	],
};

const fields: Field< OptInFormData >[] = [
	{
		id: 'enabled',
		label: __( 'I want to try the beta version.' ),
		Edit: ( { field, onChange, data, hideLabelFromVision } ) => {
			return (
				<CheckboxControl
					__nextHasNoMarginBottom
					checked={ field.getValue( { item: data } ) }
					label={ hideLabelFromVision ? '' : field.label }
					onChange={ ( value ) => {
						onChange( { [ field.id ]: value } );
					} }
				/>
			);
		},
	},
	{
		id: 'description',
		Edit: () => (
			<Text as="p" variant="muted">
				{ __(
					'We’ve recently updated the dashboard with a modern design and smarter tools for managing your hosting.'
				) }
			</Text>
		),
	},
];

export default function PreferencesLanguageForm() {
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { recordTracksEvent } = useAnalytics();
	const { data: optIn } = useSuspenseQuery( userPreferenceQuery( 'hosting-dashboard-opt-in' ) );
	const { mutate: saveOptInPreference, isPending } = useMutation(
		userPreferenceMutation( 'hosting-dashboard-opt-in' )
	);
	const [ formData, setFormData ] = useState< OptInFormData >( {
		enabled: optIn.value === 'opt-in',
	} );
	const [ isRedirecting, setIsRedirecting ] = useState( false );

	const isDirty = formData.enabled !== ( optIn.value === 'opt-in' );

	const handleSubmit = ( e: React.FormEvent ) => {
		e.preventDefault();

		recordTracksEvent( 'calypso_dashboard_me_preferences_new_hosting_dashboard_toggle', {
			enabled: formData.enabled,
		} );

		saveOptInPreference(
			{
				value: formData.enabled ? 'opt-in' : 'opt-out',
				updated_at: new Date().toISOString(),
			},
			{
				onSuccess( _, { value } ) {
					if ( value === 'opt-in' ) {
						createSuccessNotice( __( 'New Hosting Dashboard enabled.' ), { type: 'snackbar' } );
					} else {
						setIsRedirecting( true );
						window.location.href = '/me/account?updated=dashboard';
					}
				},
				onError( _, { value } ) {
					createErrorNotice(
						value === 'opt-in'
							? __( 'Failed to enable new Hosting Dashboard.' )
							: __( 'Failed to disable new Hosting Dashboard.' ),
						{
							type: 'snackbar',
						}
					);
				},
			}
		);
	};

	return (
		<Card>
			<FlashMessage value="dashboard" message={ __( 'Successfully saved preference.' ) } />
			<CardBody>
				<VStack as="form" onSubmit={ handleSubmit } spacing={ 4 } alignment="flex-start">
					<DataForm< OptInFormData >
						data={ formData }
						fields={ fields }
						form={ form }
						onChange={ ( edits ) => {
							setFormData( ( current ) => ( { ...current, ...edits } ) );
						} }
					/>
					{ ! formData.enabled && ( optIn.value === 'opt-in' || isRedirecting ) && (
						<Notice title={ __( 'Prefer the previous version?' ) } variant="info">
							{ createInterpolateElement(
								__(
									'<surveyLink>Please complete this short survey</surveyLink> to help us understand what didn’t work and how we can improve.'
								),
								{
									surveyLink: (
										<ExternalLink
											href="https://automattic.survey.fm/new-hosting-dashboard-opt-out-survey"
											onClick={ () =>
												recordTracksEvent(
													'calypso_dashboard_me_preferences_new_hosting_dashboard_survey_click'
												)
											}
											children={ null }
										/>
									),
								}
							) }
						</Notice>
					) }
					<Button
						variant="primary"
						type="submit"
						__next40pxDefaultSize
						accessibleWhenDisabled
						isBusy={ isPending || isRedirecting }
						disabled={ isPending || isRedirecting || ! isDirty }
					>
						{ __( 'Save' ) }
					</Button>
				</VStack>
			</CardBody>
		</Card>
	);
}
