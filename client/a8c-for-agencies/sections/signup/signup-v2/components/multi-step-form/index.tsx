import { APIError } from '@automattic/data-stores';
import { useTranslate } from 'i18n-calypso';
import { useMemo, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AgencyDetailsSignupPayload } from 'calypso/a8c-for-agencies/sections/signup/types';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';
import useCreateSignupMutation from '../../../hooks/use-create-signup-mutation';
import StepProgress from '../step-progress';
import BlueprintForm from './blueprint-form';
import ChoiceBlueprint from './choice-blueprint';
import SignupContactForm from './contact-form';
import FinishSignupSurvey from './finish-signup-survey';
import PersonalizationForm from './personalization';

import './style.scss';

const MultiStepForm = () => {
	const translate = useTranslate();
	const [ currentStep, setCurrentStep ] = useState( 1 );
	const dispatch = useDispatch();
	const notificationId = 'a4a-agency-signup-form';

	const [ formData, setFormData ] = useState< Partial< AgencyDetailsSignupPayload > >( {} );

	const steps = [
		{ label: translate( 'Sign up' ), isActive: currentStep === 1, isComplete: currentStep > 1 },
		{
			label: translate( 'Personalize' ),
			isActive: currentStep === 2 || currentStep === 3 || currentStep === 4,
			isComplete: currentStep > 2,
		},
		{
			label: translate( 'Finish survey' ),
			isActive: currentStep === 5,
			isComplete: currentStep > 5,
		},
	];

	const createSignup = useCreateSignupMutation( {
		onSuccess: () => {
			dispatch( successNotice( 'Signup successful', { id: notificationId } ) );
		},
		onError: ( error: APIError ) => {
			dispatch( errorNotice( error?.message, { id: notificationId } ) );
		},
	} );

	const updateDataAndContinue = useCallback(
		( data: Partial< AgencyDetailsSignupPayload >, nextStep: number ) => {
			const newFormData = { ...formData, ...data };
			setFormData( newFormData );
			setCurrentStep( nextStep );
			if ( nextStep === 5 ) {
				createSignup.mutate( newFormData as AgencyDetailsSignupPayload );
			}
		},
		[ formData, createSignup ]
	);

	const clearDataAndRefresh = () => {
		setFormData( {} );
		setCurrentStep( 1 );
	};

	const currentForm = useMemo( () => {
		switch ( currentStep ) {
			case 1:
				return <SignupContactForm onContinue={ ( data ) => updateDataAndContinue( data, 2 ) } />;
			case 2:
				return <PersonalizationForm onContinue={ ( data ) => updateDataAndContinue( data, 3 ) } />;
			case 3:
				return (
					<ChoiceBlueprint
						onContinue={ () => updateDataAndContinue( {}, 4 ) }
						onSkip={ () => updateDataAndContinue( {}, 5 ) }
					/>
				);
			case 4:
				return <BlueprintForm onContinue={ ( data ) => updateDataAndContinue( data, 5 ) } />;
			case 5:
				return <FinishSignupSurvey onContinue={ clearDataAndRefresh } />;
			default:
				return null;
		}
	}, [ currentStep, updateDataAndContinue ] );

	return (
		<div className="signup-multi-step-form">
			<StepProgress steps={ steps } />

			{ currentForm }
		</div>
	);
};

export default MultiStepForm;
