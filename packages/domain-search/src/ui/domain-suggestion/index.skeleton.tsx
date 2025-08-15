import {
	Card,
	CardBody,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDomainSuggestionContainerContext } from '../../hooks/use-domain-suggestion-container';

export const SuggestionSkeleton = ( {
	domainName,
	price,
	cta,
}: {
	domainName: React.ReactNode;
	price: React.ReactNode;
	cta: React.ReactNode;
} ) => {
	const listContext = useDomainSuggestionContainerContext();

	if ( ! listContext ) {
		throw new Error( 'SuggestionSkeleton must be used within a DomainSuggestionsList' );
	}

	const { activeQuery } = listContext;

	const getContent = () => {
		if ( activeQuery === 'large' ) {
			return (
				<HStack spacing={ 6 }>
					<div style={ { flex: 1 } }>{ domainName }</div>

					<HStack alignment="right" spacing={ 6 } style={ { width: 'auto' } }>
						{ price }
						{ cta }
					</HStack>
				</HStack>
			);
		}

		return (
			<HStack spacing={ 6 }>
				<VStack spacing={ 2 }>
					{ domainName }
					{ price }
				</VStack>
				{ cta }
			</HStack>
		);
	};

	return (
		<Card isBorderless size={ activeQuery === 'large' ? 'medium' : 'small' }>
			<CardBody style={ { borderRadius: 0 } }>{ getContent() }</CardBody>
		</Card>
	);
};
