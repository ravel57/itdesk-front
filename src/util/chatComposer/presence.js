// Кто сейчас печатает и кто смотрит заявку (без текущего пользователя)
export function getTypingWatchingUsers ({ typing, taskWatchingNow, currentUser }) {
  const watchingNow = taskWatchingNow.filter(user =>
    user.id !== currentUser.id &&
    !typing.some(t => t.username === user.username)
  )
  const typingNow = typing.filter(t => t.username !== currentUser.username)
  return {
    typing: typingNow.map(t => `${t.lastname} ${t.firstname}`),
    watching: watchingNow.map(user => `${user.lastname} ${user.firstname}`)
  }
}
