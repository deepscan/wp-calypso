import { Domain } from '@automattic/api-core';
import { PRIVACY_PROTECTION } from '@automattic/urls';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import OverviewCard from '../../components/overview-card';

interface Props {
	domain: Domain;
}

export default function FeaturedCardPrivacy( { domain }: Props ) {
	const privacyWarning = __(
		'Privacy protection is not available due to the registry’s policies.'
	);
	const privacyProtectionNote = domain.private_domain ? __( 'Enabled' ) : __( 'Disabled' );

	return (
		<OverviewCard
			title={ __( 'Privacy' ) }
			heading={ __( 'WHOIS Privacy' ) }
			icon={ <Icon icon={ unseen } /> }
			externalLink={ ! domain.privacy_available ? PRIVACY_PROTECTION : undefined }
			description={ ! domain.private_domain ? privacyWarning : privacyProtectionNote }
		/>
	);
}
