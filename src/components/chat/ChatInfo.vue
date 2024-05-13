<template>
  <q-card class="my-card" style="border-bottom: 16px; height: 100px">
    <q-card-section>
      <div
        style="display: flex"
      >
        <div
          class="text-h6"
          @mouseover="editButtonShow(this.editClientInfoButtonShow, this.editShowTimer)"
          @mouseleave="editButtonHide(this.editClientInfoButtonShow, this.editShowTimer)"
          v-text="`${this.client.firstname} ${this.client.lastname}`"
        />
        <q-btn
          v-if="this.editClientInfoButtonShow.value"
          @mouseenter="editButtonCancelHide(this.editShowTimer)"
          icon="edit"
          @click="dialogShow"
          dense
          flat
          round
          size="xs"
        />
        <q-btn
          icon="more_vert"
          flat
          dense
          class="q-ml-auto"
          color="grey"
        >
          <q-menu v-model="menuOpened" content-class="menu-content">
            <q-list>
              <q-item clickable @click="menuAction('item1')">
                <q-item-section>rPCSMT</q-item-section>
              </q-item>
              <q-item clickable @click="menuAction('item2')">
                <q-item-section>new user generator</q-item-section>
              </q-item>
              <q-item clickable @click="menuAction('item2')">
                <q-item-section>check-adminpc</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
      <div
        class="text-subtitle2"
        @mouseover="editButtonShow(this.editClientInfoButtonShow, this.editShowTimer)"
        @mouseleave="editButtonHide(this.editClientInfoButtonShow, this.editShowTimer)"
        v-text="this.getOrganization"
      />
      <div
        class="text-subtitle2"
        @mouseover="editButtonShow(this.editClientInfoButtonShow, this.editShowTimer)"
        @mouseleave="editButtonHide(this.editClientInfoButtonShow, this.editShowTimer)"
        v-text="this.client.moreInfo"
      ></div>
    </q-card-section>
  </q-card>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card>
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup />
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
          label="Закрыть"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSave"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ChatInfo',

  props: ['client', 'organizations'],

  data: () => ({
    editClientInfoButtonShow: { value: false },
    editShowTimer: { value: null },

    dialogVisible: false,

    dialogLastName: '',
    dialogFirstName: '',
    dialogOrganization: '',
    dialogAnotherInfo: '',

    menuOpened: false
  }),

  methods: {
    editButtonShow (show, timer) {
      show.value = true
      timer.value = setTimeout(() => {
        show.value = false
      }, 750)
    },

    editButtonHide (show, timer) {
      if (!timer.value) {
        show.value = false
      }
    },

    editButtonCancelHide (timer) {
      clearTimeout(timer.value)
      timer.value = null
    },

    dialogShow () {
      this.dialogVisible = true
      this.dialogLastName = this.client.lastname
      this.dialogFirstName = this.client.firstname
      this.dialogOrganization = this.client.organization.name
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

      axios.post(`/api/v1/client/${this.client.id}/update-client`, client)
        .then(newClient => {
          this.$emit('changeClient', newClient)
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

    toggleMenu () {
      this.menuOpened = !this.menuOpened
    },
    menuAction (item) {
      console.log('Выбран элемент:', item)
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
</style>
