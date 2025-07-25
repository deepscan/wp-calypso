/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { AuthFormHeader } from '../auth-form-header';

jest.mock( 'calypso/blocks/site', () => () => 'Site' );

const CLIENT_ID = 98765;
const SITE_SLUG = 'an.example.site';
const DEFAULT_PROPS = {
	authQuery: {
		authApproved: false,
		blogname: 'Example Blog',
		clientId: CLIENT_ID,
		from: 'banner-44-slide-1-dashboard',
		homeUrl: `http://${ SITE_SLUG }`,
		jpVersion: '5.4',
		nonce: 'fooBarNonce',
		redirectAfterAuth: `http://${ SITE_SLUG }/wp-admin/admin.php?page=jetpack`,
		redirectUri: `http://${ SITE_SLUG }/wp-admin/admin.php?page=jetpack&action=authorize&_wpnonce=fooBarNonce&redirect=http%3A%2F%2F${ SITE_SLUG }%2Fwp-admin%2Fadmin.php%3Fpage%3Djetpack`,
		scope: 'administrator:fooBarBaz',
		secret: 'fooBarSecret',
		site: `http://${ SITE_SLUG }`,
		siteIcon: '',
		siteUrl: `http://${ SITE_SLUG }`,
		state: '1',
		userEmail: `email@${ SITE_SLUG }`,
	},
	translate: ( string ) => string,
};

describe( 'AuthFormHeader', () => {
	test( 'renders as expected', () => {
		const { container } = render( <AuthFormHeader { ...DEFAULT_PROPS } /> );

		expect( container ).toMatchSnapshot();
	} );
} );
