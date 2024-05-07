<template>
  <q-card class="my-card" style="border-bottom: 16px">
    <q-card-section>
      <div
        style="display: flex"
      >
        <div
          class="text-h6"
          @mouseover="showButton(this.editClientInfoButtonShow, this.editShowTimer)"
          @mouseleave="hideButton(this.editClientInfoButtonShow, this.editShowTimer)"
          v-text="`${this.client.firstname} ${this.client.lastname}`"
        />
        <q-btn
          v-if="this.editClientInfoButtonShow.value"
          @mouseenter="cancelHide(this.editShowTimer)"
          icon="edit"
          @click="showDialog"
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
        @mouseover="showButton(this.editClientInfoButtonShow, this.editShowTimer)"
        @mouseleave="hideButton(this.editClientInfoButtonShow, this.editShowTimer)"
        v-text="this.client.organization"
      />
      <div
        class="text-subtitle2"
        @mouseover="showButton(this.editClientInfoButtonShow, this.editShowTimer)"
        @mouseleave="hideButton(this.editClientInfoButtonShow, this.editShowTimer)"
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
      <q-card-section>
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
          :options="this.organizations.map(o => o.name)"
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
          @click="closeDialog"
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
    showButton (show, timer) {
      show.value = true
      timer.value = setTimeout(() => {
        show.value = false
      }, 750)
    },

    hideButton (show, timer) {
      if (!timer.value) {
        show.value = false
      }
    },

    cancelHide (timer) {
      clearTimeout(timer.value)
      timer.value = null
    },

    showDialog () {
      this.dialogVisible = true
      this.dialogLastName = this.client.lastname
      this.dialogFirstName = this.client.firstname
      this.dialogOrganization = this.client.organization
      this.dialogAnotherInfo = this.client.moreInfo
    },

    closeDialog () {
      this.dialogVisible = false
    },

    dialogSave () {
      this.$emit('changeClient', {
        lastname: this.dialogLastName,
        firstname: this.dialogFirstName,
        organization: this.dialogOrganization,
        moreInfo: this.dialogAnotherInfo
      })
      this.dialogVisible = false
    },

    toggleMenu () {
      this.menuOpened = !this.menuOpened
    },
    menuAction (item) {
      console.log('Выбран элемент:', item)
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
  min-width: 200px; /* Ширина меню */
}
</style>
