import { Page } from 'playwright';
import { envVariables } from '../..';

/**
 * Page repsresenting the Feedback page, Inbox view variant. Accessed under Sidebar > Feedback.
 */
export class FeedbackInboxPage {
	private page: Page;

	/**
	 * Constructs an instance of the component.
	 *
	 * @param {Page} page The underlying page.
	 */
	constructor( page: Page ) {
		this.page = page;
	}

	/**
	 * Visit the Jetpack Forms Inbox page.
	 *
	 * @param {string} siteUrlWithProtocol Site URL with the protocol.
	 */
	async visit( siteUrlWithProtocol: string ): Promise< void > {
		const url = new URL( '/wp-admin/admin.php?page=jetpack-forms-admin', siteUrlWithProtocol );
		await this.page.goto( url.href, { timeout: 20 * 1000 } );
	}

	/**
	 * Click on a response row that has the provided text.
	 *
	 * @param {string} text The text to match in the row. Using the name field is a good choice.
	 */
	async clickResponseRowByText( text: string ): Promise< void > {
		// @todo Remove `oldResponseRowLocator` option once the DataView-based inbox is deployed everywhere.
		const oldResponseRowLocator = this.page
			.locator( '.jp-forms__table-item' )
			.filter( { hasText: text } )
			.first();
		const newResponseRowLocator = this.page
			.locator( '.jp-forms__inbox__dataviews .dataviews-view-table__row' )
			.filter( { hasText: text } )
			.first();
		await newResponseRowLocator.or( oldResponseRowLocator ).waitFor();
		if ( await newResponseRowLocator.isVisible() ) {
			if ( envVariables.VIEWPORT_NAME === 'desktop' ) {
				// Check if the row is already selected to avoid de-selecting it
				const isAlreadySelected = await newResponseRowLocator.evaluate( ( el ) =>
					el.classList.contains( 'is-selected' )
				);
				if ( ! isAlreadySelected ) {
					await newResponseRowLocator.click();
				}
				await this.page
					.locator( '.jp-forms__inbox__dataviews .dataviews-view-table__row.is-selected' )
					.filter( { hasText: text } )
					.waitFor();
			} else {
				await newResponseRowLocator.getByRole( 'button', { name: 'View response' } ).click();
				await this.page
					.getByRole( 'dialog' )
					.filter( { has: this.page.getByRole( 'heading', { name: 'Response' } ) } )
					.waitFor();
			}
		} else {
			await oldResponseRowLocator.click();
			if ( envVariables.VIEWPORT_NAME === 'desktop' ) {
				await this.page
					.locator( '.jp-forms__table-item.is-active' )
					.filter( { hasText: text } )
					.waitFor();
			} else {
				// On mobile, the row opens a separate view with the response that has this return link text.
				await this.page.getByText( 'View all responses' ).waitFor();
			}
		}
	}

	/**
	 * Validates a piece of text in the submitted form response.
	 *
	 * @param {string} text The text to validate.
	 * @throws If the text is not found in the response.
	 */
	async validateTextInSubmission( text: string ): Promise< void > {
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// On mobile, the response is in a full-screen modal
			await this.page
				.locator( '.jp-forms__inbox__response-mobile' )
				.getByText( text )
				.first()
				.waitFor();
		} else {
			await this.page.locator( '.jp-forms__inbox-response' ).getByText( text ).first().waitFor();
		}
	}

	/**
	 * Use the search input to search for a form response. Useful for filtering and triggering a data reload.
	 *
	 * @param {string} search The text to search for.
	 * @param {boolean} skipWaiting Whether to skip waiting for the response request to complete.
	 */
	async searchResponses( search: string, skipWaiting: boolean = false ): Promise< void > {
		if ( skipWaiting ) {
			await this.page
				.getByRole( 'searchbox', { name: 'Search' } )
				.or( this.page.getByRole( 'textbox', { name: 'Search responses' } ) )
				.fill( search );
			await this.page
				.getByRole( 'tab', { name: 'Inbox', exact: false, disabled: false } )
				.or( this.page.getByRole( 'radio', { name: /^Inbox\s*\([\d,]+\)$/ } ) )
				.waitFor();
			return;
		}
		const responseRequestPromise = this.page.waitForResponse(
			( response ) =>
				// Atomic
				( response.url().includes( '/wp-json/wp/v2/feedback' ) ||
					// Simple
					response.url().match( /\/wp\/v2\/sites\/[0-9]+\/feedback/ ) ||
					// @todo Remove once once the DataView-based inbox is deployed everywhere.
					response.url().includes( '/forms/responses' ) ) &&
				response.url().includes( encodeURIComponent( search ) )
		);
		// @todo Remove the `.or( ... )` once the DataView-based inbox is deployed everywhere.
		await this.page
			.getByRole( 'searchbox', { name: 'Search' } )
			.or( this.page.getByRole( 'textbox', { name: 'Search responses' } ) )
			.fill( search );
		await responseRequestPromise;
		await this.page
			.getByRole( 'tab', { name: 'Inbox', exact: false, disabled: false } )
			.or( this.page.getByRole( 'radio', { name: /^Inbox\s*\([\d,]+\)$/ } ) )
			.waitFor();
	}

	/**
	 * Clears the search input.
	 *
	 * @param {boolean} skipWaiting Whether to skip waiting for the response request to complete.
	 */
	async clearSearch( skipWaiting: boolean = false ): Promise< void > {
		if ( skipWaiting ) {
			// @todo Remove the `.or( ... )` once the DataView-based inbox is deployed everywhere.
			await this.page
				.getByRole( 'searchbox', { name: 'Search' } )
				.or( this.page.getByRole( 'textbox', { name: 'Search responses' } ) )
				.clear();
			await this.page.waitForTimeout( 500 ); // Wait for the UI to update
			return;
		}
		const responseRequestPromise = this.page.waitForResponse(
			( response ) =>
				// Atomic
				( response.url().includes( '/wp-json/wp/v2/feedback' ) ||
					// Simple
					response.url().match( /\/wp\/v2\/sites\/[0-9]+\/feedback/ ) ||
					// @todo Remove once once the DataView-based inbox is deployed everywhere.
					response.url().includes( '/forms/responses' ) ) &&
				! response.url().includes( 'search=' )
		);
		// @todo Remove the `.or( ... )` once the DataView-based inbox is deployed everywhere.
		await this.page
			.getByRole( 'searchbox', { name: 'Search' } )
			.or( this.page.getByRole( 'textbox', { name: 'Search responses' } ) )
			.clear();
		await responseRequestPromise;
		await this.page.waitForTimeout( 500 ); // Wait for the UI to update
	}

	/**
	 * Clicks on a folder tab (Inbox, Spam, or Trash).
	 *
	 * @param {string} folderName The name of the folder to click (e.g., 'Inbox', 'Spam', 'Trash').
	 */
	async clickFolderTab( folderName: string ): Promise< void > {
		// @todo Remove the `.or( ... )` once the DataView-based inbox is deployed everywhere.
		await this.page
			.getByRole( 'tab', { name: new RegExp( folderName, 'i' ) } )
			.or(
				this.page.getByRole( 'radio', {
					name: new RegExp( `^${ folderName }\\s*\\(\\d+\\)$`, 'i' ),
				} )
			)
			.click();
		await this.page.waitForTimeout( 500 ); // Wait for the data to load
	}

	/**
	 * Clicks the "Not spam" action button for the current response.
	 */
	async clickNotSpamAction(): Promise< void > {
		// Use .last() to get the button in the side panel, not in the table row
		await this.page.getByRole( 'button', { name: 'Not spam' } ).last().click();
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// On mobile, the modal closes after the action
			await this.page.waitForTimeout( 1000 );
		} else {
			// Wait for the success notification (use .first() to avoid a11y-speak duplicate)
			await this.page
				.getByText( 'Response marked as not spam.' )
				.first()
				.waitFor( { timeout: 5000 } );
		}
	}

	/**
	 * Clicks the "Mark as spam" action button for the current response.
	 */
	async clickMarkAsSpamAction(): Promise< void > {
		// Use .last() to get the button in the side panel, not in the table row
		await this.page.getByRole( 'button', { name: 'Mark as spam' } ).last().click();
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// On mobile, the modal closes after the action
			await this.page.waitForTimeout( 1000 );
		} else {
			// Wait for the success notification (use .first() to avoid a11y-speak duplicate)
			await this.page.getByText( 'Response marked as spam.' ).first().waitFor( { timeout: 5000 } );
		}
	}

	/**
	 * Clicks the "Mark as read" action button for the current response.
	 */
	async clickMarkAsReadAction(): Promise< void > {
		// Use .last() to get the button in the side panel, not in the table row
		await this.page.getByRole( 'button', { name: 'Mark as read' } ).last().click();
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// On mobile, read/unread actions keep the modal open, so wait for button state change
			await this.page
				.getByRole( 'button', { name: 'Mark as unread' } )
				.last()
				.waitFor( { timeout: 5000 } );
		} else {
			// Wait for the success notification (use .first() to avoid a11y-speak duplicate)
			await this.page.getByText( 'Response marked as read.' ).first().waitFor( { timeout: 5000 } );
		}
	}

	/**
	 * Clicks the "Mark as unread" action button for the current response.
	 */
	async clickMarkAsUnreadAction(): Promise< void > {
		// Use .last() to get the button in the side panel, not in the table row
		await this.page.getByRole( 'button', { name: 'Mark as unread' } ).last().click();
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// On mobile, read/unread actions keep the modal open, so wait for button state change
			await this.page
				.getByRole( 'button', { name: 'Mark as read' } )
				.last()
				.waitFor( { timeout: 5000 } );
		} else {
			// Wait for the success notification (use .first() to avoid a11y-speak duplicate)
			await this.page
				.getByText( 'Response marked as unread.' )
				.first()
				.waitFor( { timeout: 5000 } );
		}
	}

	/**
	 * Clicks the "Move to trash" action button for the current response.
	 */
	async clickMoveToTrashAction(): Promise< void > {
		// Use .last() to get the button in the side panel, not in the table row
		await this.page.getByRole( 'button', { name: 'Move to trash' } ).last().click();
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// On mobile, the modal closes after the action
			await this.page.waitForTimeout( 1000 );
		} else {
			// Wait for the success notification (use .first() to avoid a11y-speak duplicate)
			await this.page.getByText( 'Response moved to trash.' ).first().waitFor( { timeout: 5000 } );
		}
	}

	/**
	 * Clicks the "Restore" action button for the current response.
	 */
	async clickRestoreAction(): Promise< void > {
		// Use .last() to get the button in the side panel, not in the table row
		await this.page.getByRole( 'button', { name: 'Restore' } ).last().click();
		if ( envVariables.VIEWPORT_NAME === 'mobile' ) {
			// On mobile, the modal closes after the action
			await this.page.waitForTimeout( 1000 );
		} else {
			// Wait for the success notification (use .first() to avoid a11y-speak duplicate)
			await this.page.getByText( 'Response restored.' ).first().waitFor( { timeout: 5000 } );
		}
	}

	/**
	 * Clicks the "Next" navigation button in the response view.
	 */
	async clickNextResponse(): Promise< void > {
		// Use .last() to get the button in the side panel, not pagination buttons
		await this.page.getByRole( 'button', { name: 'Next', exact: true } ).last().click();
		await this.page.waitForTimeout( 1000 ); // Wait for the navigation to complete
	}

	/**
	 * Clicks the "Previous" navigation button in the response view.
	 */
	async clickPreviousResponse(): Promise< void > {
		// Use .last() to get the button in the side panel, not pagination buttons
		await this.page.getByRole( 'button', { name: 'Previous', exact: true } ).last().click();
		await this.page.waitForTimeout( 1000 ); // Wait for the navigation to complete
	}

	/**
	 * Clicks the "Close" button in the response view.
	 */
	async clickCloseResponse(): Promise< void > {
		await this.page.getByRole( 'button', { name: 'Close' } ).last().click();
		await this.page.waitForTimeout( 300 ); // Wait for the panel to close
	}

	/**
	 * Verifies that the Next navigation button is disabled.
	 */
	async verifyNextButtonDisabled(): Promise< void > {
		// Use .last() to get the button in the side panel, not pagination buttons
		await this.page
			.getByRole( 'button', { name: 'Next', exact: true, disabled: true } )
			.last()
			.waitFor();
	}

	/**
	 * Verifies that the Previous navigation button is disabled.
	 */
	async verifyPreviousButtonDisabled(): Promise< void > {
		// Use .last() to get the button in the side panel, not pagination buttons
		await this.page
			.getByRole( 'button', { name: 'Previous', exact: true, disabled: true } )
			.last()
			.waitFor();
	}
}
