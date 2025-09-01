import { fetchUser } from '@automattic/api-core';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import type { User } from '@automattic/api-core';

export const AUTH_QUERY_KEY = [ 'auth', 'user' ];

interface AuthContextType {
	user: User;
}
export const AuthContext = createContext< AuthContextType | undefined >( undefined );

/**
 * This component:
 * 1. Fetches and provides auth data via context
 * 2. Handles authentication checking
 * 3. Shows nothing during loading (falls back to the HTML loading screen)
 * 4. Redirects to login if unauthorized
 */
export function AuthProvider( { children }: { children: React.ReactNode } ) {
	const {
		data: user,
		isLoading: userIsLoading,
		isError: userIsError,
	} = useQuery( {
		queryKey: AUTH_QUERY_KEY,
		queryFn: fetchUser,
		staleTime: 30 * 60 * 1000, // Consider auth valid for 30 minutes
		retry: false, // Don't retry on 401 errors
		meta: {
			persist: false,
		},
	} );

	if ( userIsError ) {
		if ( typeof window !== 'undefined' ) {
			const currentPath = window.location.pathname;
			const loginUrl = `/log-in?redirect_to=${ encodeURIComponent( currentPath ) }`;
			window.location.href = loginUrl;
		}
		return null;
	}

	if ( userIsLoading || ! user ) {
		return null;
	}

	return <AuthContext.Provider value={ { user } }>{ children }</AuthContext.Provider>;
}

/**
 * Custom hook to access auth context
 * The user is guaranteed to be available
 */
export function useAuth(): AuthContextType {
	const context = useContext( AuthContext );
	if ( context === undefined ) {
		throw new Error( 'useAuth must be used within an AuthProvider' );
	}
	return context;
}
