import { Badge } from '@automattic/ui';
import {
	Icon,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { layout, swatch, atSymbol, published } from '@wordpress/icons';
import { siteDomainsRoute, siteOverviewRoute } from '../../app/router/sites';
import { Card, CardBody } from '../../components/card';
import InlineSupportLink from '../../components/inline-support-link';
import Notice from '../../components/notice';
import RouterLinkSummaryButton from '../../components/router-link-summary-button';
import VerificationInProgressNextSteps from './verification-in-progress-next-steps';

interface DomainConnectionVerificationProps {
	domainName: string;
	siteSlug: string;
	status: 'verifying' | 'connected';
}

export default function DomainConnectionVerification( {
	domainName,
	siteSlug,
	status,
}: DomainConnectionVerificationProps ) {
	return (
		<Card
			className={ `dashboard-domain-connection-verification dashboard-domain-connection-verification--${ status }` }
		>
			<CardBody>
				<VStack spacing={ 4 }>
					<HStack justify="flex-start">
						<Icon
							className="dashboard-domain-connection-verification__icon"
							icon={ status === 'verifying' ? swatch : published }
						/>
						<Text className="dashboard-domain-connection-verification__title" size={ 10 }>
							{ domainName }
						</Text>
						<Badge intent={ status === 'connected' ? 'success' : 'warning' }>
							{ status === 'connected' ? __( 'Active' ) : __( 'Verifying' ) }
						</Badge>
					</HStack>
					{ status === 'verifying' && (
						<>
							<Notice variant="info">
								{ __(
									'We’re checking your DNS records. Most updates happen quickly, but some providers cache old settings for up to 72 hours.'
								) }
							</Notice>
							<Text size="medium" weight={ 500 }>
								{ __( 'While you wait' ) }
							</Text>
						</>
					) }
					{ status === 'connected' && (
						<RouterLinkSummaryButton
							to={ siteDomainsRoute.fullPath }
							params={ { siteSlug } }
							/* Translators: %s is the domain name. */
							title={ sprintf( __( 'Set %s as your primary site address' ), domainName ) }
							description={ __( 'It’s the URL visitors see in their browser’s address bar.' ) }
							decoration={ <Icon icon={ atSymbol } /> }
						/>
					) }
					<RouterLinkSummaryButton
						to={ siteOverviewRoute.fullPath }
						params={ { siteSlug } }
						title={ __( 'Customize your site' ) }
						description={ __(
							'While your domain name is connecting, you can still work on your site.'
						) }
						decoration={ <Icon icon={ layout } /> }
					/>
					{ status === 'verifying' && <VerificationInProgressNextSteps /> }
					<Text size="medium" weight={ 500 }>
						{ __( 'Need help?' ) }
					</Text>
					<VStack spacing={ 2 }>
						<InlineSupportLink supportContext="map-domain-setup-instructions">
							{ __( 'Domain connection guide' ) }
						</InlineSupportLink>
						<InlineSupportLink supportContext="general-support-options">
							{ __( 'Contact support' ) }
						</InlineSupportLink>
						{ /* TODO: Add additional help resources or links here in the future */ }
						{ /* <ExternalLink href="#" children={ __( 'Registrar instructions' ) } /> */ }
					</VStack>
				</VStack>
			</CardBody>
		</Card>
	);
}
