import { Dispatch, SetStateAction } from 'react';
import type { SiteDetails } from '@automattic/data-stores';

export type EngineTypes = 'substack';

export type StatusType = 'initial' | 'done' | 'pending' | 'skipped' | 'importing';

export interface SubscribersStepProps {
	cardData: any;
	status: StatusType;
	engine: 'substack';
	fromSite: string;
	nextStepUrl: string;
	selectedSite: SiteDetails;
	setAutoFetchData: Dispatch< SetStateAction< boolean > >;
	siteSlug: string;
	skipNextStep: () => void;
}
