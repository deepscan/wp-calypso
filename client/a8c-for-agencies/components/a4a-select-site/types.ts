import type { Site } from 'calypso/jetpack-cloud/sections/agency-dashboard/sites-overview/types';
import type { ReactNode } from 'react';

export type A4ASelectSiteItem = {
	id: number;
	site: string;
	date: string;
	rawSite: Site;
};

export interface A4ASelectSiteProps {
	trackingEvent?: string;
	buttonLabel?: string;
	className?: string;
	onSiteSelect: ( site: A4ASelectSiteItem ) => void;
	title?: string;
	subtitle?: ReactNode;
	selectedSiteId?: number;
}

export interface A4ASelectSiteButtonProps {
	buttonLabel?: string;
	className?: string;
	handleOpenModal: () => void;
}

export interface SelectSiteModalProps {
	onClose: () => void;
	onSiteSelect: ( site: A4ASelectSiteItem ) => void;
	title?: string;
	subtitle?: ReactNode;
	selectedSiteId?: number;
}

export interface SelectSiteTableProps {
	selectedSite: A4ASelectSiteItem | null;
	setSelectedSite: ( site: A4ASelectSiteItem | null ) => void;
	selectedSiteId?: number;
}
