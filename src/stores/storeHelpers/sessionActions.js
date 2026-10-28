import axios from 'axios'

export const sessionActions = {
  loadPermissions() {
    return axios.get('/api/v1/user/permissions')
      .then(response => {
        this.permissions = Array.isArray(response.data?.permissions) ? response.data.permissions : []
        return this.permissions
      })
      .catch(() => {
        this.permissions = []
        return this.permissions
      })
  },

  loadCurrentSession() {
    return axios.get('/api/v1/session/current')
      .then(response => {
        this.currentSessionId = response.data.sessionId
        localStorage.setItem('currentSessionId', response.data.sessionId)
      })
  },

  logoutByForce() {
    this.currentUser = null
    this.currentSessionId = null
    this.clients = []
    this.currentClient = null
    this.resetTaskPage()
    localStorage.removeItem('currentSessionId')
    window.location.replace('/login')
  }
}
