export interface SelectedDomain {
	uuid: string;
	domain: string;
	tld: string;
	salePrice?: string;
	price: string;
}

export interface DomainSearchCart {
	items: SelectedDomain[];
	total: string;
	onAddItem: ( item: SelectedDomain[ 'uuid' ] ) => Promise< void > | void;
	onRemoveItem: ( item: SelectedDomain[ 'uuid' ] ) => Promise< void > | void;
	hasItem: ( uuid: SelectedDomain[ 'uuid' ] ) => boolean;
	isBusy: boolean;
	errorMessage: string | null;
}

export interface DomainSearchContextType {
	onContinue: () => void;
	cart: DomainSearchCart;
	isFullCartOpen: boolean;
	closeFullCart: () => void;
	openFullCart: () => void;
}
