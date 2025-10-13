import { __ } from '@wordpress/i18n';

export const useQueryForRoute = ( currentRoute: string ) => {
	const urlMapping = {
		'/advertising/': __( 'advertising' ),
		'/comments/': __( 'comments' ),
		'/discover': __( 'discover blogs' ),
		'/hosting-config/': __( 'hosting configuration' ),
		'/marketing/sharing-buttons/': __( 'social share' ),
		'/me/get-apps': __( 'wordpress apps' ),
		'/me/notifications': __( 'notification settings' ),
		'/me/privacy': __( 'privacy' ),
		'/me/site-blocks': __( 'blocked sites' ),
		'/plugins/manage': __( 'manage plugins' ),
		'/reader': __( 'reader' ),
		'/reader/conversations': __( 'conversations' ),
		'/reader/list': __( 'reader list' ),
		'/reader/notifications': __( 'notifications' ),
		'/reader/search': __( 'search' ),
		'/reader/subscriptions': __( 'manage subscriptions' ),
		'/settings/performance/': __( 'performance settings' ),
		'/settings/podcasting/': __( 'podcasting' ),
		'/settings/reading/': __( 'reading settings' ),
		'/settings/taxonomies/category/': __( 'site categories' ),
		'/settings/taxonomies/post_tag/': __( 'post tag' ),
		'/settings/writing/': __( 'writing settings' ),
		'/tags': __( 'tags' ),
		'/woocommerce': __( 'woocommerce' ),
		'/wp-admin/admin.php?page=akismet-key-config': __( 'site spam' ),
		'/wp-admin/admin.php?page=jetpack-search': __( 'jetpack search' ),
		'/wp-admin/admin.php?page=wc': __( 'woocommerce' ),
		'/wp-admin/admin.php?page=jetpack-forms-admin': __( 'forms' ),
		'/wp-admin/edit.php?post_type=jetpack-testimonial': __( 'testimonials' ),
		'/wp-admin/index.php?page=my-blogs': __( 'my sites' ),
		'/wp-admin/options-general.php?page=debug-bar-extender': __( 'debug bar extender' ),
		'/wp-admin/options-media.php': __( 'media settings' ),
		'/wp-admin/post-new.php?post_type=jetpack-testimonial': __( 'new testimonial' ),
	};

	// Find exact URL matches
	const exactMatch = urlMapping[ currentRoute as keyof typeof urlMapping ];
	if ( exactMatch ) {
		return exactMatch;
	}

	// Fuzzier matches
	const urlMatchKey = Object.keys( urlMapping ).find( ( key ) => currentRoute?.startsWith( key ) );
	return urlMatchKey ? urlMapping[ urlMatchKey as keyof typeof urlMapping ] : '';
};
