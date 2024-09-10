<template>
  <div class="clientInfo">
    <div
      style="display: flex"
    >
      <div
        class="text-h6"
        v-text="this.getClientName"
      />
      <q-btn
        class="editClientBtn"
        icon="edit"
        @click="dialogShow"
        dense
        flat
        size="xs"
      />
      <!--        <q-toggle-->
      <!--          v-model="this.isNotificationEnabled"-->
      <!--          icon="notifications_active"-->
      <!--          color="primary"-->
      <!--          class="element q-position-absolute q-right-0"-->
      <!--          @mouseover="this.showTooltipNotifications = true"-->
      <!--          @mouseup="this.showTooltipNotifications = false"-->
      <!--        >-->
      <!--          <q-tooltip v-if="this.showTooltipNotifications">Получать уведомления от этого клиента</q-tooltip>-->
      <!--        </q-toggle>-->
      <!--    <q-btn-->
      <!--      icon="expand_circle_down"-->
      <!--      flat-->
      <!--      dense-->
      <!--      class="q-ml-auto"-->
      <!--      color="grey"-->
      <!--    >-->
      <!--      <q-menu v-model="this.menuOpened" content-class="menu-content">-->
      <!--        <q-list>-->
      <!--          <q-item clickable v-close-popup>-->
      <!--            <q-item-section>rPCSMT</q-item-section>-->
      <!--          </q-item>-->
      <!--          <q-item clickable v-close-popup>-->
      <!--            <q-item-section>new user generator</q-item-section>-->
      <!--          </q-item>-->
      <!--          <q-item clickable v-close-popup>-->
      <!--            <q-item-section>check-adminpc</q-item-section>-->
      <!--          </q-item>-->
      <!--        </q-list>-->
      <!--      </q-menu>-->
      <!--    </q-btn>-->
    </div>
    <div
      v-if="this.getOrganization"
      style="display: flex;flex-direction: row;flex-wrap: nowrap;align-items: center"
    >
      <q-icon
        name="store"
        style="margin-right: 8px;color: black !important"
      />
      <div
        class="text-subtitle2"
        style="overflow: hidden;display: -webkit-box;-webkit-line-clamp: 1;-webkit-box-orient: vertical;"
        v-text="this.getOrganization"
      />
    </div>
    <div
      class="truncate text-subtitle2"
      style="margin-top: 4px"
      v-text="this.client.moreInfo"
    />
    <div
      class="text-subtitle2"
      style="align-items: center; display: flex;margin-top: 4px"
    >
      <img
        v-if="client.messageFrom === 'TELEGRAM'"
        src="/telegram.png"
        alt="tg"
        style="width: 16px;margin-right: 8px"
      >
      <img
        v-else-if="client.messageFrom === 'WHATSAPP'"
        src="/whatsapp.png"
        alt="wa"
        style="width: 16px;margin-right: 8px"
      >
      <img
        v-else-if="client.messageFrom === 'EMAIL'"
        src="/email.png"
        alt="email"
        style="width: 16px;margin-right: 8px"
      >
      {{ this.client.sourceChannel }}
    </div>
  </div>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="'Изменить клиента'"/>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogLastName"
          label="Фамилия"
        />
        <q-input
          v-model="this.dialogFirstName"
          label="Имя"
        />
        <q-select
          v-model="this.dialogOrganization"
          :options="getOrganizations"
          label="Организация"
          use-input
        />
        <q-input
          v-model="dialogAnotherInfo"
          label="Другая информация"
          type="textarea"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          label="Удалить клиента"
          text-color="primary"
          @click="this.openSubmitDeleteClientWindow"
        />
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="this.dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="this.dialogSave"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog
    v-model="this.openSubmitDeleteModal"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6">Удалить клиента {{ this.getClientName }}?</div>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding: 16px">
        Вы уверены что хотите удалить клиента {{ this.getClientName }}?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          label="Отмена"
          text-color="primary"
          v-close-popup
        />
        <q-btn
          color="primary"
          label="Удалить"
          @click="dialogDeleteClient"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ChatClientInfo',

  props: ['client', 'organizations', 'isMobile'],

  data: () => ({
    isNotificationEnabled: true,
    showTooltipNotifications: false,

    dialogVisible: false,

    dialogLastName: '',
    dialogFirstName: '',
    dialogOrganization: '',
    dialogAnotherInfo: '',

    menuOpened: false,

    openSubmitDeleteModal: false
  }),

  methods: {

    dialogShow () {
      this.dialogVisible = true
      this.dialogLastName = this.client.lastname
      this.dialogFirstName = this.client.firstname
      this.dialogOrganization = this.getOrganization
      this.dialogAnotherInfo = this.client.moreInfo
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogSave () {
      const client = {
        lastname: this.dialogLastName,
        firstname: this.dialogFirstName,
        organization: this.dialogOrganization,
        moreInfo: this.dialogAnotherInfo
      }

      axios.patch(`/api/v1/client/${this.client.id}/client`, client)
        .then(newClient => {
          this.$emit('updateClient', newClient)
        })
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
      this.dialogVisible = false
    },

    dialogDeleteClient () {
      axios.delete(`/api/v1/client/${this.client.id}`)
        .then(() => {
          this.$emit('deleteClient', this.client)
          this.$router.push('/chats')
        })
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    openSubmitDeleteClientWindow () {
      this.openSubmitDeleteModal = true
    }
  },

  computed: {
    getOrganizations () {
      if (this.organizations) {
        return this.organizations.map(o => o.name)
      } else {
        return []
      }
    },

    getOrganization () {
      if (this.client && this.client.organization) {
        return this.client.organization.name
      } else {
        return ''
      }
    },

    getClientName () {
      return `${this.client.lastname ? this.client.lastname : ''} ${this.client.firstname ? this.client.firstname : ''}`
    }
  },

  watch: {
    client: {
      immediate: true,
      handler (newVal) {
        if (newVal !== undefined) {
          if ((newVal.firstname || newVal.lastname) !== undefined) {
            document.title = `Чат: ${this.client.firstname} ${this.client.lastname !== null ? this.client.lastname : ''}`
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.menu-container {
  display: flex;
  align-items: center;
}

.menu-content {
  min-width: 200px;
}

.scrollable-div {
  overflow: auto;
}

.truncate {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-wrap: anywhere;
}

.editClientBtn {
  margin-left: 8px;
  display: none;
}

.clientInfo:hover {
  .editClientBtn {
    display: unset;
  }
}
</style>
