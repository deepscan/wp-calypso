declare const __i18n_text_domain__: string;
interface Window {
	zE?: (
		action: string,
		value: string,
		handler?:
			| ( ( callback: ( data: string | number ) => void ) => void )
			| { id: number; value: string }[]
	) => void;
}
