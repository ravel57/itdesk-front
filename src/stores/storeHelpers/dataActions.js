import axios from 'axios'

export const dataActions = {
  fetchData() {
    const authorities = Array.isArray(this.currentUser?.authorities)
      ? this.currentUser.authorities
      : []
    const isObserver = authorities.includes('OBSERVER')

    axios.get('/api/v1/clients')
      .then(response => {
        const existingClientsById = new Map(
          this.clients
            .filter(client => client?.id !== undefined && client?.id !== null)
            .map(client => [Number(client.id), client])
        )

        this.clients = Array.isArray(response.data)
          ? response.data.map(client => {
            const normalizedClient = this.normalizeClientForList(client)
            const existingClient = existingClientsById.get(Number(client?.id))
            const existingMessages = Array.isArray(existingClient?.messages)
              ? existingClient.messages
              : null
            const cachedMessages = (
              Number(this.currentChatMessageData?.clientId) === Number(client?.id) &&
              Array.isArray(this.currentChatMessageData?.messages)
            )
              ? this.currentChatMessageData.messages
              : null

            return {
              ...existingClient,
              ...normalizedClient,
              // История может загрузиться раньше списка клиентов. В этом
              // случае existingClient ещё отсутствует, поэтому главным
              // источником для открытого чата является отдельный cache
              // currentChatMessageData, привязанный к clientId.
              messages: cachedMessages ?? existingMessages ?? (
                Array.isArray(normalizedClient?.messages)
                  ? normalizedClient.messages
                  : []
              )
            }
          })
          : []

        if (this.currentClient?.id !== undefined && this.currentClient?.id !== null) {
          const refreshedCurrentClient = this.clients.find(client =>
            Number(client.id) === Number(this.currentClient.id)
          )
          if (refreshedCurrentClient) {
            this.currentClient = refreshedCurrentClient
          }
        }
      })

    axios.get('/api/v1/tags')
      .then(response => {
        this.tags = response.data
      })

    axios.get('/api/v1/organizations')
      .then(response => {
        this.organizations = response.data
      })

    if (!isObserver) {
      axios.get('/api/v1/users')
        .then(response => {
          this.users = response.data
          this.users.forEach(user => {
            if (user.lastname === null) {
              user.lastname = ''
            }
          })
        })
    } else {
      this.users = []
    }

    if (!isObserver) {
      axios.get('/api/v1/roles')
        .then(response => {
          this.roles = response.data
        })
    } else {
      this.roles = []
    }

    axios.get('/api/v1/statuses')
      .then(response => {
        this.statuses = response.data
      })

    this.fetchSlaZones().catch(() => {})

    axios.get('/api/v1/priorities')
      .then(response => {
        this.priorities = response.data
      })

    axios.get('/api/v1/task-types')
      .then(response => {
        this.taskTypes = response.data
      })

    axios.get('/api/v1/services')
      .then(response => {
        this.services = Array.isArray(response.data) ? response.data : []
      })

    axios.get('/api/v1/support-lines')
      .then(response => {
        this.supportLines = Array.isArray(response.data) ? response.data : []
      })

    if (!isObserver) {
      axios.get('/api/v1/templates')
        .then(response => {
          this.templates = response.data
        })

      axios.get('/api/v1/knowledge-base')
        .then(response => {
          this.knowledgeBase = response.data
        })

      axios.get('/api/v1/triggers')
        .then(response => {
          this.triggers = response.data
        })

      axios.get('/api/v1/trigger-types/options')
        .then(response => {
          this.triggerTypeOptions = Array.isArray(response.data) ? response.data : []
        })
    } else {
      this.templates = []
      this.knowledgeBase = []
      this.triggers = []
      this.triggerTypeOptions = []
    }
  },

  fetchAnalyticsDictionaries() {
    const requests = []
    const authorities = Array.isArray(this.currentUser?.authorities)
      ? this.currentUser.authorities
      : []
    const isObserver = authorities.includes('OBSERVER')

    requests.push(
      axios.get('/api/v1/task-types')
        .then(response => {
          this.taskTypes = Array.isArray(response.data) ? response.data : []
        })
    )

    requests.push(
      axios.get('/api/v1/priorities')
        .then(response => {
          this.priorities = Array.isArray(response.data) ? response.data : []
        })
    )

    if (!isObserver) {
      requests.push(
        axios.get('/api/v1/users')
          .then(response => {
            this.users = Array.isArray(response.data) ? response.data : []

            this.users.forEach(user => {
              if (user.lastname === null) {
                user.lastname = ''
              }
            })
          })
      )
    } else {
      this.users = []
    }

    requests.push(
      axios.get('/api/v1/tags')
        .then(response => {
          this.tags = Array.isArray(response.data) ? response.data : []
        })
    )

    requests.push(
      axios.get('/api/v1/services')
        .then(response => {
          this.services = Array.isArray(response.data) ? response.data : []
        })
    )

    requests.push(
      axios.get('/api/v1/support-lines')
        .then(response => {
          this.supportLines = Array.isArray(response.data) ? response.data : []
        })
    )

    return Promise.all(requests)
  }
}
