import emailValidator from 'email-validator';
import { useTranslate } from 'i18n-calypso';
import { useState, useCallback } from 'react';
import { CAPTURE_URL_RGX } from 'calypso/blocks/import/util';
import useReferHostingMutation from './use-refer-hosting-mutation';
import type { ReferHostingFormData, FormFieldsConfig } from '../types';

const DEFAULT_FORM_DATA: ReferHostingFormData = {
	companyName: '',
	address: '',
	country: '',
	city: '',
	zip: '',
	firstName: '',
	lastName: '',
	title: '',
	phone: '',
	email: '',
	website: '',
	opportunityDescription: '',
	leadType: '',
	isRfp: false,
};

export default function useReferHostingForm(
	fieldsConfig: FormFieldsConfig = {},
	apiEndpoint: string
) {
	const translate = useTranslate();

	const [ formData, setFormData ] = useState< ReferHostingFormData >( {
		...DEFAULT_FORM_DATA,
	} );

	const [ validationError, setValidationError ] = useState< Record< string, string > >( {} );

	const { mutate: submit, isPending } = useReferHostingMutation( apiEndpoint );

	const updateValidationError = useCallback(
		( newState: Record< string, string > ) => {
			setValidationError( ( prev ) => ( { ...prev, ...newState } ) );
		},
		[ setValidationError ]
	);

	const resetForm = useCallback( () => {
		setFormData( {
			...DEFAULT_FORM_DATA,
		} );
	}, [] );

	const validate = useCallback(
		( payload: Partial< ReferHostingFormData > ) => {
			const newValidationError: Record< string, string > = {};

			if ( payload.companyName?.trim() === '' ) {
				newValidationError.companyName = translate( 'Please enter your company name' );
			}

			if ( payload.address?.trim() === '' ) {
				newValidationError.address = translate( 'Please enter your company address' );
			}

			if ( payload.country?.trim() === '' ) {
				newValidationError.country = translate( 'Please enter your country code' );
			}

			if ( payload.city?.trim() === '' ) {
				newValidationError.city = translate( 'Please enter your city' );
			}

			if ( payload.zip?.trim() === '' ) {
				newValidationError.zip = translate( 'Please enter your ZIP/Postal code' );
			}

			if ( payload.firstName?.trim() === '' ) {
				newValidationError.firstName = translate( 'Please enter your first name' );
			}

			if ( payload.lastName?.trim() === '' ) {
				newValidationError.lastName = translate( 'Please enter your last name' );
			}

			if ( payload.title?.trim() === '' ) {
				newValidationError.title = translate( 'Please enter your title' );
			}

			if ( payload.email?.trim() === '' ) {
				newValidationError.email = translate( 'Please enter your email' );
			}

			if ( payload.email && ! emailValidator.validate( payload.email ) ) {
				newValidationError.email = translate( 'Please enter a valid email' );
			}

			if ( payload.website?.trim() === '' ) {
				newValidationError.website = translate( 'Please enter your website' );
			}

			if (
				payload.website &&
				payload.website?.trim() !== '' &&
				! CAPTURE_URL_RGX.test( payload.website )
			) {
				newValidationError.website = translate( 'Please enter a valid URL' );
			}

			if ( payload.opportunityDescription?.trim() === '' ) {
				newValidationError.opportunityDescription = translate(
					'Please tell us about the opportunity'
				);
			}

			if ( fieldsConfig.leadType?.enabled && payload.leadType?.trim() === '' ) {
				newValidationError.leadType = translate( 'Please select a lead type' );
			}

			if ( Object.keys( newValidationError ).length > 0 ) {
				setValidationError( newValidationError );
				return newValidationError;
			}

			return null;
		},
		[ translate, fieldsConfig ]
	);

	const updateFormData = useCallback(
		( name: string, value: string | string[] | boolean | File | undefined ) => {
			setFormData( ( prev ) => ( { ...prev, [ name ]: value } ) );
		},
		[ setFormData ]
	);

	return {
		formData,
		updateFormData,
		validationError,
		updateValidationError,
		validate,
		submit,
		isPending,
		resetForm,
	};
}
