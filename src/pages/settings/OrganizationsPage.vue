<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить организацию"
      @click="this.dialogNewOrganizationShow"
    />
    <div class="table-container">
      <q-table
        :rows="this.store.organizations"
        :columns="this.columns"
        row-key="id"
        full-width
        :rows-per-page-options="[10, 20, 50]"
        rows-per-page-label="Строк на странице"
      >
        <template v-slot:body-cell-edit="props">
          <q-td>
            <q-btn
              color="primary"
              dense
              flat
              icon="edit"
              @click="editRow(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </div>
  </div>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogName"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewOrganization"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="this.dialogDeleteOrganization"
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
          @click="this.dialogSaveNewOrUpdateOrganization"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'OrganizationsComponent',

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'center', field: 'name' },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],

    dialogVisible: false,
    dialogName: '',
    isNewOrganization: true,
    organizationId: null // for updates
  }),

  methods: {
    dialogNewOrganizationShow () {
      this.dialogVisible = true
      this.isNewOrganization = true
    },

    editRow (row) {
      this.isNewOrganization = false
      this.dialogVisible = true
      this.dialogName = row.name
      this.organizationId = row.id
    },

    dialogClose () {
      this.dialogVisible = false
      this.dialogName = ''
      this.organizationId = null
    },

    dialogSaveNewOrUpdateOrganization () {
      const organization = {
        id: this.isNewOrganization ? null : this.organizationId,
        name: this.dialogName
      }
      if (this.isNewOrganization) {
        axios.post('/api/v1/new-organization', organization)
          .then(response => {
            this.store.organizations.push(response.data)
            this.dialogClose()
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
      } else {
        axios.post('/api/v1/update-organization', organization)
          .then(response => {
            const orgs = this.store.organizations
            this.store.organizations[orgs.indexOf(orgs.find(organization => organization.id === this.organizationId))] = response.data
            this.dialogClose()
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
      }
    },

    dialogDeleteOrganization () {
      axios.delete(`/api/v1/organization/${this.organizationId}`)
        .then(() => {
          this.store.organizations = this.store.organizations.filter(organization => organization.id !== this.organizationId)
          this.dialogClose()
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
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style scoped>

</style>
