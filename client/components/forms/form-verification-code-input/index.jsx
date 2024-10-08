import clsx from 'clsx';
import PropTypes from 'prop-types';
import { Component } from 'react';
import FormTextInput from 'calypso/components/forms/form-text-input';
import constants from 'calypso/me/constants';

import './style.scss';

export default class FormVerificationCodeInput extends Component {
	static propTypes = {
		className: PropTypes.string,
		isError: PropTypes.bool,
		isValid: PropTypes.bool,
		method: PropTypes.string,
		placeholder: PropTypes.string,
	};

	static defaultProps = {
		isError: false,
		isValid: false,
	};

	focus = () => {
		this.input.focus();
	};

	saveRef = ( input ) => {
		this.input = input;
	};

	render() {
		const { className, isError, isValid, method, placeholder, ...otherProps } = this.props;

		const classes = clsx( 'form-verification-code-input', className, {
			'is-error': isError,
			'is-valid': isValid,
		} );

		let defaultPlaceholder = constants.sixDigit2faPlaceholder;

		if ( method === 'backup' ) {
			defaultPlaceholder = constants.eightDigitBackupCodePlaceholder;
		} else if ( method === 'sms' ) {
			defaultPlaceholder = constants.sevenDigit2faPlaceholder;
		}

		return (
			<FormTextInput
				autoComplete="one-time-code"
				className={ classes }
				pattern="[0-9 ]*"
				placeholder={ placeholder || defaultPlaceholder }
				ref={ this.saveRef }
				type="tel"
				{ ...otherProps }
			/>
		);
	}
}
