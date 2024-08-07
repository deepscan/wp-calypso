import { ExternalLink } from '@automattic/components';
import { useTranslate } from 'i18n-calypso';
import React, { FC } from 'react';
import { recordMigrationInstructionsLinkClick } from '../tracking';
import './style.scss';

export const Questions: FC = () => {
	const translate = useTranslate();

	return (
		<div className="site-migration-instructions-questions">
			<span className="site-migration-instructions-questions__label">
				{ translate( 'Questions?' ) }
			</span>
			<ExternalLink
				href="https://wordpress.com/help/contact/"
				icon
				iconSize={ 12 }
				target="_blank"
				onClick={ () => {
					recordMigrationInstructionsLinkClick( 'questions-happiness-engineer' );
				} }
			>
				{ translate( 'Ask a Happiness Engineer' ) }
			</ExternalLink>
		</div>
	);
};
