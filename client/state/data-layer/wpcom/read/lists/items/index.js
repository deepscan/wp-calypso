import { registerHandlers } from 'calypso/state/data-layer/handler-registry';
import { http } from 'calypso/state/data-layer/wpcom-http/actions';
import { noRetry } from 'calypso/state/data-layer/wpcom-http/pipeline/retry-on-failure/policies';
import { dispatchRequest } from 'calypso/state/data-layer/wpcom-http/utils';
import {
	READER_LIST_ITEMS_REQUEST,
	READER_RECOMMENDED_BLOGS_ITEMS_REQUEST,
} from 'calypso/state/reader/action-types';
import {
	receiveReaderListItems,
	receiveReaderRecommendedBlogsItems,
	handleRecommendedBlogsRequestFailure,
} from 'calypso/state/reader/lists/actions';

const noop = () => {};

registerHandlers( 'state/data-layer/wpcom/read/lists/items/index.js', {
	[ READER_LIST_ITEMS_REQUEST ]: [
		dispatchRequest( {
			fetch: ( action ) =>
				http(
					{
						method: 'GET',
						path: `/read/lists/${ action.listOwner }/${ action.listSlug }/items`,
						query: { meta: 'site,feed,tag', number: 2000 },
						apiVersion: '1.2',
					},
					action
				),
			onSuccess: ( action, apiResponse ) =>
				receiveReaderListItems( apiResponse.list_ID, apiResponse.items ),
			onError: () => noop,
		} ),
	],
	[ READER_RECOMMENDED_BLOGS_ITEMS_REQUEST ]: [
		dispatchRequest( {
			fetch: ( action ) =>
				http(
					{
						method: 'GET',
						path: `/read/lists/${ action.listOwner }/recommended-blogs/items`,
						query: { meta: 'site,feed,tag', number: 2000 },
						apiVersion: '1.2',
						//TODO: Improve it to skip retries when the request returns 'list_not_found' error
						retryPolicy: noRetry(),
					},
					action
				),
			onSuccess: ( action, apiResponse ) =>
				receiveReaderRecommendedBlogsItems( action.listOwner, apiResponse.items ),
			onError: ( action, error ) => handleRecommendedBlogsRequestFailure( action.listOwner, error ),
		} ),
	],
} );
