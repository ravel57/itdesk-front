<template>
  <div class="col no-shadow rounded-borders" style="height: calc(100vh - 90px); width: 50%; padding: 8px;">
    <chat-dialog
      :is-mobile="this.isMobile"
      :messages="[]"
      :input-field="this.inputField"
      :templates="this.store.templates"
      :isSending="this.isSending"
      :current-user="this.store.currentUser"
      :client-id="1"
      :is-show-helper="true"
      :taskWatchingNow="[]"
      :typing="[]"
      :isDialog="false"
      @sendMessage="this.sendMessage"
      @isSending="this.isSending = true"
      @keyPressed="this.keyPressed"
    />
  </div>
</template>

<script>
import ChatDialog from 'components/chat/ChatDialog.vue'
import { useStore } from 'stores/store'
import axios from 'axios'

export default {

  name: 'HelpPage',

  components: { ChatDialog },

  data: () => ({
    inputField: '',
    isSending: false
  }),

  methods: {
    sendMessage (event) {
      axios.post(`/api/v1/user/${this.store.currentUser.id}/support/new-message`, event.message)
        .then(() => {
          this.inputField = ''
          this.isSending = false
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
    },

    keyPressed (text) {
      this.inputField = text
    }
  },

  computed: {
    isMobile () {
      return this.$q.screen.width < 1023
    }
  },

  mounted () {
    document.title = 'ULDESK : Помощь'
  },

  setup () {
    const store = useStore()
    return { store }
  }

}
</script>

<style scoped>

</style>
