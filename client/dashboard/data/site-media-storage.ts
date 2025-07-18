import wpcom from 'calypso/lib/wp';

export interface SiteMediaStorage {
	maxStorageBytesFromAddOns: number;
	maxStorageBytes: number;
	storageUsedBytes: number;
}

export async function fetchSiteMediaStorage( siteId: number ): Promise< SiteMediaStorage > {
	const mediaStorage = await wpcom.req.get( `/sites/${ siteId }/media-storage` );
	return {
		maxStorageBytesFromAddOns: Number( mediaStorage.max_storage_bytes_from_add_ons ),
		maxStorageBytes: Number( mediaStorage.max_storage_bytes ),
		storageUsedBytes: Number( mediaStorage.storage_used_bytes ),
	};
}
