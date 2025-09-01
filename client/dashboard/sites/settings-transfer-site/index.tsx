import { siteBySlugQuery } from '@automattic/api-queries';
import { useSuspenseQuery } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';
import { Card, CardBody } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';
import React, { useState } from 'react';
import { useAuth } from '../../app/auth';
import InlineSupportLink from '../../components/inline-support-link';
import PageLayout from '../../components/page-layout';
import { canTransferSite } from '../features';
import SettingsPageHeader from '../settings-page-header';
import { ConfirmNewOwnerForm, ConfirmNewOwnerFormData } from './confirm-new-owner-form';
import { EmailConfirmation } from './email-confirmation';
import { InvitationEmailSent } from './invitation-email-sent';
import { StartSiteTransferForm } from './start-site-transfer-form';
import type { SiteOwnerTransferContext } from '@automattic/api-core';

const MIN_STEP = 0;

const MAX_STEP = 2;

const SettingsTransferSitePageLayout = ( { children }: { children: React.ReactNode } ) => {
	return (
		<PageLayout
			size="small"
			header={
				<SettingsPageHeader
					title={ __( 'Transfer site' ) }
					description={ createInterpolateElement(
						__(
							'Transfer this site to a new or existing site member with just a few clicks. <link>Learn more</link>'
						),
						{
							link: <InlineSupportLink supportContext="site-transfer" />,
						}
					) }
				/>
			}
		>
			{ children }
		</PageLayout>
	);
};

// TODO: Use Stepper component when the design is ready.
export default function SettingsTransferSite( {
	siteSlug,
	context,
}: {
	siteSlug: string;
	context?: SiteOwnerTransferContext;
} ) {
	const { user } = useAuth();
	const { data: site } = useSuspenseQuery( siteBySlugQuery( siteSlug ) );
	const [ newOwnerEmail, setNewOwnerEmail ] = useState( '' );
	const [ currentStep, setCurrentStep ] = useState( 0 );
	const confirmationHash = getQueryArg( window.location.search, 'site-transfer-confirm' );

	const handleBack = () => setCurrentStep( ( step ) => Math.max( step - 1, MIN_STEP ) );

	const handleForward = () => setCurrentStep( ( step ) => Math.min( step + 1, MAX_STEP ) );

	const handleConfirmNewOwner = ( data: ConfirmNewOwnerFormData ) => {
		setNewOwnerEmail( data.email );
		handleForward();
	};

	const handleStartSiteTransfer = () => {
		handleForward();
	};

	if ( ! canTransferSite( site, user ) ) {
		throw notFound();
	}

	if ( confirmationHash ) {
		return (
			<SettingsTransferSitePageLayout>
				<InvitationEmailSent site={ site } confirmationHash={ confirmationHash as string } />
			</SettingsTransferSitePageLayout>
		);
	}

	return (
		<SettingsTransferSitePageLayout>
			<Card>
				<CardBody>
					{ currentStep === 0 && (
						<ConfirmNewOwnerForm
							site={ site }
							newOwnerEmail={ newOwnerEmail }
							onSubmit={ handleConfirmNewOwner }
						/>
					) }
					{ currentStep === 1 && (
						<StartSiteTransferForm
							newOwnerEmail={ newOwnerEmail }
							site={ site }
							context={ context }
							onSubmit={ handleStartSiteTransfer }
							onBack={ handleBack }
						/>
					) }
					{ currentStep === 2 && <EmailConfirmation userEmail={ user.email } /> }
				</CardBody>
			</Card>
		</SettingsTransferSitePageLayout>
	);
}
