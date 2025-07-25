# Zendesk Client

This package is used to interact with the Zendesk Messaging Widget.

## Hooks

### useZendeskMessagingAvailability

- `group` string - What Zendesk group should be checked. Example: `wpcom_messaging`
- `enabled` boolean - defaults to true

#### Returns

True if Zendesk Messaging is available to receive support requests.

### useCanConnectToZendeskMessaging

- `enabled` boolean - defaults to true

#### Returns

True if the user can reach the Zendesk config.

### useLoadZendeskMessaging

- `keyConfigName` ZendeskConfigName - The Zendesk config that should be used. Varies depending on what Zendesk account this should be going to
- `tryAuthenticating` boolean - Try and authenticate Zendesk user before loading.
- `enabled` defaults to true

#### Returns

- `isLoggedIn` boolean
- `isMessagingScriptLoaded` boolean

### useZendeskMessagingBindings

- `HelpCenterStore` string
- `hasActiveChats` boolean
- `isMessagingScriptLoaded` boolean

This is used to bind the Zendesk Messaging events to Help Center store for opening and closing the widget and Help Center-

### useAuthenticateZendeskMessaging

- `enabled` boolean - defaults to true

#### Returns

JWT signature for the authorized user
