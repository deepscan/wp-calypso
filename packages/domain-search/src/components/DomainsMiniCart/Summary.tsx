import { __experimentalVStack as VStack, __experimentalText as Text } from '@wordpress/components';
import { sprintf } from '@wordpress/i18n';
import { useI18n } from '@wordpress/react-i18n';
import { useDomainSearch } from '../DomainSearch/DomainSearch';

export const DomainsMiniCartSummary = () => {
	const { _n } = useI18n();
	const { cart } = useDomainSearch();

	const domainCount = sprintf(
		// translators: %(domains)s is the number of domains selected.
		_n( '%(domains)s domain', '%(domains)s domains', cart.items.length ),
		{
			domains: cart.items.length,
		}
	);

	return (
		<VStack spacing={ 2 }>
			<Text>{ domainCount }</Text>
			<Text>{ cart.total }</Text>
		</VStack>
	);
};
