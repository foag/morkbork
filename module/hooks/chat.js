import * as chat from '../system/chat.js'

export class ChatHelpers {
    static register () {
        // Highlight 1's and 20's for all regular rolls
        Hooks.on('renderChatMessage', (app, html, data) => {
            chat.highlightCriticalSuccessFailure(app, html, data)
        })
    }
}
