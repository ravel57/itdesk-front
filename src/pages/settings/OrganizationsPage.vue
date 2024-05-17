<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить организацию"
      @click="this.dialogNewOrganizationShow"
    />
    <div class="table-container">
      <q-list
        bordered
        class="rounded-borders"
        separator
        style="margin-top: 8px">
        <q-item header class="text-bold">
          <q-item-section>
            Название
          </q-item-section>
        </q-item>
        <draggable
          :list="this.store.organizations"
          item-key="id"
          class="list-users"
          ghost-class="ghost"
          @start="dragging = true"
          @end="dragging = false"
        >
          <template #item="{ element }">
            <q-item
              class="list-group-item"
              :class="{ 'not-draggable': true }"
              style="cursor: grab"
            >
              <q-item-section
                top
                style="justify-content: center"
              >
                {{ element.name }}
              </q-item-section>
              <q-item-section
                top
                side
              >
                <q-btn
                  color="primary"
                  dense
                  flat
                  icon="edit"
                  @click="editRow(element)"
                />
              </q-item-section>
            </q-item>
          </template>
        </draggable>
      </q-list>
    </div>
  </div>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogName"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="dialogName"
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
import draggable from 'vuedraggable'

export default {
  name: 'OrganizationsComponent',
  components: { draggable },

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'center', field: 'name' },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],
    dragging: false,
    dialogVisible: false,
    dialogName: '',
    isNewOrganization: true,
    organizationId: null // for updates
  }),

  methods: {
    dialogNewOrganizationShow () {
      this.dialogVisible = true
      this.isNewOrganization = true
      this.dialogName = ''
      setTimeout(() => this.$refs.dialogName.focus(), 250)
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
