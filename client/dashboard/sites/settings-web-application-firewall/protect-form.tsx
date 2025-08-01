import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
	Card,
	CardBody,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useState } from 'react';
import {
	siteJetpackModulesQuery,
	siteJetpackModuleMutation,
} from '../../app/queries/site-jetpack-module';
import { SectionHeader } from '../../components/section-header';
import { JetpackModules } from '../../data/constants';
import type { Site } from '../../data/types';

const fields = [
	{
		id: 'protect',
		label: __( 'Enable brute force login protection' ),
		Edit: 'checkbox',
	},
];

const form = {
	type: 'regular' as const,
	fields: [ 'protect' ],
};

export default function ProtectForm( { site }: { site: Site } ) {
	const { data: jetpackModules } = useSuspenseQuery( siteJetpackModulesQuery( site.ID ) );
	const mutation = useMutation( siteJetpackModuleMutation( site.ID ) );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const currentProtect = jetpackModules?.includes( JetpackModules.PROTECT ) ?? false;

	const [ formData, setFormData ] = useState< { protect: boolean } >( {
		protect: currentProtect,
	} );

	const handleSubmit = ( e: React.FormEvent ) => {
		e.preventDefault();
		mutation.mutate(
			{ module: 'protect', value: formData.protect },
			{
				onSuccess: () => {
					createSuccessNotice(
						formData.protect
							? __( 'Brute force login protection enabled.' )
							: __( 'Brute force login protection disabled.' ),
						{ type: 'snackbar' }
					);
				},
				onError: () => {
					createErrorNotice(
						formData.protect
							? __( 'Failed to enable brute force login protection.' )
							: __( 'Failed to disable brute force login protection.' ),
						{ type: 'snackbar' }
					);
				},
			}
		);
	};

	const isDirty = formData.protect !== currentProtect;
	const { isPending } = mutation;

	return (
		<Card>
			<CardBody>
				<form onSubmit={ handleSubmit }>
					<VStack spacing={ 4 }>
						<SectionHeader
							title={ __( 'Brute force login protection' ) }
							description={ __(
								'Prevent and block unwanted login attempts from bots and hackers attempting to log in to your website with common username and password combinations.'
							) }
							level={ 3 }
						/>
						<DataForm< { protect: boolean } >
							data={ formData }
							fields={ fields }
							form={ form }
							onChange={ ( edits: { protect?: boolean } ) => {
								setFormData( ( data ) => ( { ...data, ...edits } ) );
							} }
						/>
						<HStack justify="flex-start">
							<Button
								variant="primary"
								type="submit"
								isBusy={ isPending }
								disabled={ isPending || ! isDirty }
							>
								{ __( 'Save' ) }
							</Button>
						</HStack>
					</VStack>
				</form>
			</CardBody>
		</Card>
	);
}
