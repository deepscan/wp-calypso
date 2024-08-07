import { Button } from '@automattic/components';
import { ClipboardButton } from '@wordpress/components';
import { Icon, seen, unseen } from '@wordpress/icons';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import { FC, useState, useMemo, useRef, useEffect } from 'react';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import './style.scss';

interface Props {
	value: string;
	className?: string;
}
export const MigrationKeyInput: FC< Props > = ( { value, className } ) => {
	const [ hide, setHide ] = useState( true );
	const [ copied, setCopied ] = useState( false );
	const inputRef = useRef< HTMLInputElement >( null );
	const translate = useTranslate();
	const hiddenValue = useMemo( () => String.fromCharCode( 183 ).repeat( value.length ), [ value ] );

	const onCopy = () => {
		recordTracksEvent( 'calypso_migration_instructions_key_copy' );
		setCopied( true );
	};

	const toggleShowHide = () => {
		setHide( ( state ) => ! state );
	};

	useEffect( () => {
		if ( ! hide ) {
			inputRef.current?.select();
		}
	}, [ hide ] );

	useEffect( () => {
		if ( ! copied ) {
			return;
		}

		const timerId = setTimeout( () => {
			setCopied( () => false );
		}, 2000 );

		return () => clearTimeout( timerId );
	}, [ copied ] );

	return (
		<div
			className={ clsx( 'migration-key-input', className, {
				'migration-key-input--hidden': hide,
			} ) }
		>
			<input
				type="text"
				className="migration-key-input__value"
				readOnly
				disabled={ hide }
				value={ hide ? hiddenValue : value }
				ref={ inputRef }
				aria-label={ translate( 'Migration key' ) }
			/>
			<div className="migration-key-input__actions">
				<Button
					transparent
					borderless
					compact
					onClick={ toggleShowHide }
					className="migration-key-input__visibility-button"
					title={ hide ? translate( 'Show key' ) : translate( 'Hide key' ) }
				>
					<Icon icon={ hide ? unseen : seen } size={ 20 } />
				</Button>
				<ClipboardButton
					text={ value }
					className="migration-key-input__copy-button is-secondary"
					onCopy={ onCopy }
				>
					{ copied ? translate( 'Copied!' ) : translate( 'Copy' ) }
				</ClipboardButton>
			</div>
		</div>
	);
};
