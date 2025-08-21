import { SearchableDropdown } from '@automattic/components';
import { Button } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import Form from 'calypso/a8c-for-agencies/components/form';
import FormField from 'calypso/a8c-for-agencies/components/form/field';
import FormSection from 'calypso/a8c-for-agencies/components/form/section';
import { A4A_MARKETPLACE_HOSTING_PRESSABLE_LINK } from 'calypso/a8c-for-agencies/components/sidebar-menu/lib/constants';
import { useCountriesAndStates } from 'calypso/a8c-for-agencies/sections/signup/agency-details-form/hooks/use-countries-and-states';
import FormRadio from 'calypso/components/forms/form-radio';
import FormTextInput from 'calypso/components/forms/form-text-input';
import FormTextarea from 'calypso/components/forms/form-textarea';
import { useDispatch } from 'calypso/state';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';
import useReferHostingForm from './hooks/use-refer-hosting-form';
import { getReferralFormData } from './lib/get-form-data';
import { getReferralConfig } from './lib/get-referral-config';

type FieldProps = {
	label: string;
	name: string;
	error?: string;
	value?: string;
	placeholder?: string;
	onChange: ( value: string ) => void;
};

const TextField = ( { label, name, error, value, onChange }: FieldProps ) => {
	return (
		<FormField label={ label } labelFor={ name } error={ error }>
			<FormTextInput
				id={ name }
				name={ name }
				value={ value }
				onChange={ ( e: ChangeEvent< HTMLInputElement > ) => onChange( e.target.value ) }
			/>
		</FormField>
	);
};

const TextAreaField = ( { label, name, error, value, onChange }: FieldProps ) => {
	return (
		<FormField label={ label } labelFor={ name } error={ error }>
			<FormTextarea
				id={ name }
				name={ name }
				value={ value }
				onChange={ ( e: ChangeEvent< HTMLTextAreaElement > ) => onChange( e.target.value ) }
			/>
		</FormField>
	);
};

const SearchableDropdownField = ( {
	label,
	name,
	error,
	value,
	onChange,
	placeholder,
	options,
}: FieldProps & {
	options: {
		value: string;
		label: string;
	}[];
} ) => {
	return (
		<FormField label={ label } labelFor={ name } error={ error }>
			<SearchableDropdown
				options={ options }
				value={ value }
				onChange={ ( value: string | null | undefined ) => onChange( value ?? '' ) }
				placeholder={ placeholder }
			/>
		</FormField>
	);
};

const RadioButtonField = ( {
	label,
	name,
	error,
	value,
	onChange,
	options,
}: FieldProps & {
	options: {
		value: string;
		label: string;
	}[];
} ) => {
	return (
		<FormField label={ label } labelFor={ name } error={ error }>
			<div className="refer-hosting-form__radio-group">
				{ options.map( ( option ) => (
					<FormRadio
						key={ option.value }
						id={ `${ name }-${ option.value }` }
						name={ name }
						value={ option.value }
						checked={ value === option.value }
						onChange={ () => onChange( option.value ) }
						label={ option.label }
					/>
				) ) }
			</div>
		</FormField>
	);
};

export default function ReferHostingForm( {
	config,
}: {
	config: ReturnType< typeof getReferralConfig >;
} ) {
	const translate = useTranslate();
	const dispatch = useDispatch();

	const { formTitle, successTitle, ctaText, companyTitle, contactTitle, events, fields, api } =
		config;

	const { countryOptions } = useCountriesAndStates();

	const countries = useMemo( () => {
		return countryOptions.map( ( country ) => country.label );
	}, [ countryOptions ] );

	const {
		formData,
		updateFormData,
		validationError,
		updateValidationError,
		submit,
		isPending,
		validate,
	} = useReferHostingForm( fields, api.endpoint );

	const [ isSuccess, setIsSuccess ] = useState( false );

	const handleInputChange = (
		name: string,
		value: string | string[] | boolean | File | undefined
	) => {
		updateFormData( name, value );
		updateValidationError( { [ name ]: '' } );
	};

	const handleSubmit = useCallback( () => {
		const error = validate( formData );

		if ( error ) {
			updateValidationError( error );
		} else {
			dispatch( recordTracksEvent( events.formSubmit ) );
			const udpdatedFormData = getReferralFormData( fields, formData );
			submit( udpdatedFormData, {
				onSuccess: () => {
					dispatch( successNotice( translate( 'Your request has been submitted successfully.' ) ) );
					setIsSuccess( true );
				},
				onError: () => {
					dispatch(
						errorNotice( translate( 'An error occurred while submitting your request.' ) )
					);
				},
			} );
		}
	}, [
		validate,
		formData,
		updateValidationError,
		dispatch,
		events.formSubmit,
		fields,
		submit,
		translate,
	] );

	const handleBackToMarketplace = () => {
		dispatch( recordTracksEvent( events.backToMarketplace as string ) );
	};

	if ( isSuccess ) {
		return (
			<Form
				className="refer-hosting-form"
				title={ successTitle }
				description={ translate(
					"We value your partnership—thank you for helping us identify great opportunities! Once you submit your referral, our team will move quickly to review it and support you. We'll keep you updated at each step, so you always know what's happening and can stay connected as the opportunity progresses."
				) }
			>
				<div className="refer-hosting-form__footer">
					<Button
						variant="primary"
						href={ A4A_MARKETPLACE_HOSTING_PRESSABLE_LINK }
						onClick={ handleBackToMarketplace }
					>
						{ translate( 'Back to the marketplace' ) }
					</Button>
				</div>
			</Form>
		);
	}

	return (
		<Form
			className="refer-hosting-form"
			title={ formTitle }
			autocomplete="off"
			description={ translate(
				'Once submitted, our team will take it from there. We will keep you informed of our progress along the way. All fields are required unless marked as optional'
			) }
		>
			<FormSection title={ companyTitle }>
				<TextField
					label={ translate( 'Company name' ) }
					name="companyName"
					error={ validationError.companyName }
					value={ formData.companyName }
					onChange={ ( value: string ) => handleInputChange( 'companyName', value ) }
				/>

				<TextField
					label={ translate( 'Company address' ) }
					name="address"
					error={ validationError.address }
					value={ formData.address }
					onChange={ ( value: string ) => handleInputChange( 'address', value ) }
				/>

				<SearchableDropdownField
					label={ translate( 'Country' ) }
					name="country"
					error={ validationError.country }
					value={ formData.country }
					onChange={ ( value: string ) => handleInputChange( 'country', value ) }
					placeholder={ translate( 'Select country' ) }
					options={ countries.map( ( country ) => ( { value: country, label: country } ) ) }
				/>

				<TextField
					label={ translate( 'State/Province (optional)' ) }
					name="state"
					error={ validationError.state }
					value={ formData.state }
					onChange={ ( value: string ) => handleInputChange( 'state', value ) }
				/>

				<TextField
					label={ translate( 'City' ) }
					name="city"
					error={ validationError.city }
					value={ formData.city }
					onChange={ ( value: string ) => handleInputChange( 'city', value ) }
				/>

				<TextField
					label={ translate( 'ZIP/Postal code' ) }
					name="zip"
					error={ validationError.zip }
					value={ formData.zip }
					onChange={ ( value: string ) => handleInputChange( 'zip', value ) }
				/>
			</FormSection>

			<FormSection title={ contactTitle }>
				<div className="refer-hosting-form__contact-name">
					<TextField
						label={ translate( 'First name' ) }
						name="firstName"
						error={ validationError.firstName }
						value={ formData.firstName }
						onChange={ ( value: string ) => handleInputChange( 'firstName', value ) }
					/>

					<TextField
						label={ translate( 'Last name' ) }
						name="lastName"
						error={ validationError.lastName }
						value={ formData.lastName }
						onChange={ ( value: string ) => handleInputChange( 'lastName', value ) }
					/>
				</div>

				<TextField
					label={ translate( 'Title' ) }
					name="title"
					error={ validationError.title }
					value={ formData.title }
					onChange={ ( value: string ) => handleInputChange( 'title', value ) }
				/>

				<TextField
					label={ translate( 'Phone (optional)' ) }
					name="phone"
					value={ formData.phone }
					onChange={ ( value: string ) => handleInputChange( 'phone', value ) }
				/>

				<TextField
					label={ translate( 'Email' ) }
					name="email"
					error={ validationError.email }
					value={ formData.email }
					onChange={ ( value: string ) => handleInputChange( 'email', value ) }
				/>

				<TextField
					label={ translate( 'Website' ) }
					name="website"
					error={ validationError.website }
					value={ formData.website }
					onChange={ ( value: string ) => handleInputChange( 'website', value ) }
				/>
			</FormSection>

			<FormSection title={ translate( 'Opportunity information' ) }>
				<TextAreaField
					label={ translate( 'Tell us more about this opportunity' ) }
					name="opportunityDescription"
					error={ validationError.opportunityDescription }
					value={ formData.opportunityDescription }
					onChange={ ( value: string ) => handleInputChange( 'opportunityDescription', value ) }
				/>

				{ fields.leadType?.enabled && (
					<SearchableDropdownField
						label={ translate( 'Type of lead' ) }
						name="leadType"
						error={ validationError.leadType }
						value={ formData.leadType }
						onChange={ ( value: string ) => handleInputChange( 'leadType', value ) }
						placeholder={ translate( 'Select lead type' ) }
						options={ [
							{ value: 'Media', label: translate( 'Media' ) },
							{ value: 'Public Sector', label: translate( 'Public Sector' ) },
							{ value: 'Other', label: translate( 'Other' ) },
						] }
					/>
				) }

				{ fields.rfp?.enabled && (
					<RadioButtonField
						label={ translate( 'Is this an RFP?' ) }
						name="isRfp"
						error={ validationError.isRfp }
						value={ formData.isRfp === true ? 'yes' : 'no' }
						onChange={ ( value: string ) => handleInputChange( 'isRfp', value === 'yes' ) }
						options={ [
							{ value: 'yes', label: translate( 'Yes' ) },
							{ value: 'no', label: translate( 'No' ) },
						] }
					/>
				) }
			</FormSection>

			<div className="refer-hosting-form__footer">
				<Button variant="primary" onClick={ handleSubmit } isBusy={ isPending }>
					{ ctaText }
				</Button>
			</div>
		</Form>
	);
}
