<template>
  <q-card class="my-card" style="border-bottom: 16px">
    <q-card-section>
      <div
        style="display: flex"
      >
        <div
          class="text-h6"
          @mouseover="showButton(this.editShow, this.editShowTimer)"
          @mouseleave="hideButton(this.editShow, this.editShowTimer)"
          v-text="`${this.client.firstName} ${this.client.lastName}`"
        />
        <q-btn
          v-if="this.editShow.value"
          @mouseenter="cancelHide(this.editShowTimer)"
          icon="edit"
          @click="showDialog"
          dense
          flat
          round
          size="xs"
        />
      </div>
      <div
        class="text-subtitle2"
        @mouseover="showButton(this.editShow, this.editShowTimer)"
        @mouseleave="hideButton(this.editShow, this.editShowTimer)"
        v-text="this.client.organization"
      />
      <div
        class="text-subtitle2"
        @mouseover="showButton(this.editShow, this.editShowTimer)"
        @mouseleave="hideButton(this.editShow, this.editShowTimer)"
        v-text="this.client.moreInfo"
      ></div>
      <div class="text-subtitle2">rPCSMT</div>
      <div class="text-subtitle2">check-admin-pc</div>
    </q-card-section>
  </q-card>
  <q-dialog
    v-model="dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card>
      <q-card-section>
        <q-input
          v-model="dialogLastName"
          label="Фамилия"
        />
        <q-input
          v-model="dialogFirstName"
          label="Имя"
        />
        <q-select
          v-model="dialogOrganization"
          :options="options"
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

  props: ['client'],

  data: () => ({
    editShow: { value: false },

    editShowTimer: { value: null },

    dialogVisible: false,

    dialogLastName: '',

    dialogFirstName: '',

    dialogOrganization: '',

    dialogAnotherInfo: '',

    options: [
      'Google', 'Facebook', 'Twitter', 'Apple', 'Oracle'
    ]
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
      this.dialogLastName = this.client.lastName
      this.dialogFirstName = this.client.firstName
      this.dialogOrganization = this.client.organization
      this.dialogAnotherInfo = this.client.moreInfo
    },

    closeDialog () {
      this.dialogVisible = false
    },

    dialogSave () {
      this.dialogVisible = false
      this.$emit('changeClient', this.client)
    }
  }
}
</script>
