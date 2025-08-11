import wpcom from 'calypso/lib/wp';
import type { DomainSuggestion, DomainSuggestionQuery } from '@automattic/data-stores'; // eslint-disable-line

// Export types again to avoid other places to access `@automattic/data-stores`.
export type { DomainSuggestion, DomainSuggestionQuery };

export const DomainTypes = {
	MAPPED: 'mapping',
	REGISTERED: 'registered',
	SITE_REDIRECT: 'redirect',
	WPCOM: 'wpcom',
	TRANSFER: 'transfer',
} as const;

export const DomainTransferStatus = {
	PENDING_OWNER: 'pending_owner',
	PENDING_REGISTRY: 'pending_registry',
	CANCELLED: 'cancelled',
	COMPLETED: 'completed',
	PENDING_START: 'pending_start',
	PENDING_ASYNC: 'pending_async',
} as const;

export interface DomainSummary {
	aftermarket_auction: boolean;
	auto_renewing: boolean;
	blog_id: number;
	blog_name: string;
	can_manage_dns_records: boolean;
	can_set_as_primary: boolean;
	current_user_can_create_site_from_domain_only: boolean;
	current_user_can_manage: boolean;
	domain: string;
	domain_status?: {
		status: string;
	};
	expiry: string | false;
	is_dnssec_enabled: boolean;
	is_dnssec_supported: boolean;
	is_eligible_for_inbound_transfer: boolean;
	is_hundred_year_domain: boolean;
	is_redeemable: boolean;
	is_renewable: boolean;
	is_wpcom_staging_domain: boolean;
	pending_registration: boolean;
	pending_registration_at_registry: boolean;
	pending_renewal: boolean;
	primary_domain: boolean;
	registrationDate: string;
	site_slug: string;
	subscription_id: string;
	transfer_status: ( typeof DomainTransferStatus )[ keyof typeof DomainTransferStatus ] | null;
	type: ( typeof DomainTypes )[ keyof typeof DomainTypes ];
	wpcom_domain: boolean;
}

export async function fetchDomains(): Promise< DomainSummary[] > {
	const { domains } = await wpcom.req.get( '/all-domains', {
		no_wpcom: true,
		resolve_status: true,
	} );
	return domains;
}

export async function fetchDomainSuggestions(
	search: string,
	domainSuggestionQuery: Partial< DomainSuggestionQuery > = {}
): Promise< DomainSuggestion[] > {
	const defaultDomainSuggestionQuery = {
		include_wordpressdotcom: false,
		include_dotblogsubdomain: false,
		only_wordpressdotcom: false,
		quantity: 5,
		vendor: 'variation2_front',
	};

	const suggestions: DomainSuggestion[] = await wpcom.req.get(
		{
			apiVersion: '1.1',
			path: '/domains/suggestions',
		},
		{
			...defaultDomainSuggestionQuery,
			...domainSuggestionQuery,
			query: search.trim().toLocaleLowerCase(),
		}
	);

	return suggestions;
}
