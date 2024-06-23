export const TOKEN_REMOVED_EVENT = 'tokenRemoved'

export const dispatchTokenRemovedEvent = () => {
  const event = new CustomEvent(TOKEN_REMOVED_EVENT)
  window.dispatchEvent(event)
}
