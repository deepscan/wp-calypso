import emailValidator from 'email-validator';
import { useTranslate } from 'i18n-calypso';
import { useCallback, useState } from 'react';
import { isValidUrl } from 'calypso/a8c-for-agencies/components/form/utils';
import { AgencyDetails } from '../../types';

type ValidationState = {
	name?: string;
	email?: string;
	website?: string;
	landingPage?: string;
	location?: string;
	bio?: string;
	country?: string;
	logo?: string;
	industries?: string;
	services?: string;
	products?: string;
	languages?: string;
	minimumBudget?: string;
};

const useDetailsFormValidation = () => {
	const translate = useTranslate();
	const [ validationError, setValidationError ] = useState< ValidationState >( {} );

	const updateValidationError = ( newState: ValidationState ) => {
		return setValidationError( ( prev ) => ( { ...prev, ...newState } ) );
	};

	const validate = useCallback(
		( payload: AgencyDetails ) => {
			const newValidationError: ValidationState = {};
			if ( payload.name === '' ) {
				newValidationError.name = translate( "Company name can't be empty" );
			}

			if ( payload.email === '' ) {
				newValidationError.email = translate( "Email can't be empty" );
			} else if ( ! emailValidator.validate( payload.email ) ) {
				newValidationError.email = translate( 'Please provide correct email address' );
			}

			if ( payload.website === '' ) {
				newValidationError.website = translate( "Website can't be empty" );
			} else if ( ! isValidUrl( payload.website ) ) {
				newValidationError.website = translate( 'Please enter a valid URL' );
			}

			if ( payload.landingPageUrl !== '' && ! isValidUrl( payload.landingPageUrl ) ) {
				newValidationError.landingPage = translate( 'Please enter a valid URL' );
			}

			if ( payload.bioDescription === '' ) {
				newValidationError.bio = translate( "Bio description can't be empty" );
			}

			if ( payload.country === '' || payload.country === null ) {
				newValidationError.country = translate( "Company location can't be empty" );
			}

			if ( payload.industries.length < 1 ) {
				newValidationError.industries = translate( 'Please provide industries' );
			}

			if ( payload.services.length < 1 ) {
				newValidationError.services = translate( 'Please provide services offered' );
			}

			if ( payload.products.length < 1 ) {
				newValidationError.products = translate( 'Please provide products you work with' );
			}

			if ( payload.languagesSpoken.length < 1 ) {
				newValidationError.languages = translate( 'Please provide languages you speak' );
			}

			if ( payload.budgetLowerRange === '' ) {
				newValidationError.minimumBudget = translate( 'Please provide your minimum budget' );
			}

			if ( Object.keys( newValidationError ).length > 0 ) {
				setValidationError( newValidationError );
				return newValidationError;
			}

			return null;
		},
		[ setValidationError, translate ]
	);

	return { validate, validationError, updateValidationError };
};

export default useDetailsFormValidation;
