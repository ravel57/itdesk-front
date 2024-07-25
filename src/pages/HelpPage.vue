<template>
  <div
    class="q-gutter-sm row"
    :style="this.isMobile ? 'height: calc(100vh - 90px)' : ''"
  >
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
        :comments="false"
        @sendMessage="this.sendMessage"
        @isSending="this.isSending = true"
        @keyPressed="this.keyPressed"
      />
    </div>
    <div
      class="col no-shadow rounded-borders"
      style="
      height: calc(100vh - 90px);
      width: 50%;
      padding: 8px;
      justify-content: center;
      align-content: center;">
      <q-page style="min-height: 0">
        <div
          style="width: 100%;text-align: center;"
          class="text-h3 absolute-center text-primary"
          v-text="'Чат с поддержкой ULDESK'"
        />
      </q-page>
    </div>
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
