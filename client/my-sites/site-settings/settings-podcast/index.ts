import page from '@automattic/calypso-router';
import { makeLayout, render as clientRender } from 'calypso/controller';
import { navigation, siteSelection, sites } from 'calypso/my-sites/controller';
import { siteSettings } from 'calypso/my-sites/site-settings/settings-controller';
import { createPodcastSettings, jetpackPodcasting } from './controller';

export default function () {
	page( '/settings/podcasting', siteSelection, sites, makeLayout, clientRender );

	page(
		'/settings/jetpack-podcasting/:site_id',
		siteSelection,
		navigation,
		siteSettings,
		jetpackPodcasting,
		makeLayout,
		clientRender
	);

	page(
		'/settings/podcasting/:site_id',
		siteSelection,
		navigation,
		siteSettings,
		createPodcastSettings,
		makeLayout,
		clientRender
	);
}
