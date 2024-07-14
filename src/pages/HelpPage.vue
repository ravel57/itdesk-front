<template>
  <chat-dialog
    :isMobile="this.isMobile"
    :messages="this.user.support.messages"
    :inputField="this.inputField"
    :isSending="this.isSending"
    :currentUser="this.store.currentUser"
    :taskWatchingNow="[]"
    :typing="[]"
    @sendMessage="this.sendMessage"
    @keyPressed="this.keyPressed"
    @isSending="this.isSending = true"
    style="height: 100%; width: 50%"
  />
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
      axios.post('/api/v1/support/', event.message)
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
    document.title = 'ITdesk помощь'
  },

  setup () {
    const store = useStore()
    return { store }
  }

}
</script>

<style scoped>

</style>
