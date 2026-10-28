<template>
  <q-dialog
    v-model="dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          {{ isNewClient ? 'Новый клиент' : 'Изменить клиента' }}
        </div>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>

      <q-card-section class="q-pt-none">
        <q-input
          ref="lastname"
          v-model="dialogLastName"
          label="Фамилия *"
          :rules="[requiredRule]"
        />
        <q-input
          v-model="dialogFirstName"
          label="Имя *"
          :rules="[requiredRule]"
        />
        <q-input
          v-model="dialogUsername"
          label="e-mail (username) *"
          :disable="!isNewClient"
          :rules="[requiredRule]"
        />
        <q-input
          v-if="isNewClient"
          v-model="dialogPassword"
          label="Пароль *"
          type="password"
          :rules="[requiredRule]"
        />

        <q-toggle
          v-if="isNewClient"
          v-model="dialogLinkExistingClient"
          label="Привязать к существующей карточке клиента"
          class="q-mt-sm"
          @update:model-value="onLinkExistingClientChanged"
        />

        <q-select
          v-if="shouldSelectExistingClient"
          v-model="dialogClientId"
          :options="filteredClientOptions"
          option-label="label"
          option-value="id"
          emit-value
          map-options
          use-input
          :clearable="isNewClient"
          :disable="!isNewClient"
          input-debounce="0"
          label="Карточка клиента *"
          :hint="isNewClient
            ? 'Начните вводить имя, организацию, e-mail, телефон или ID клиента'
            : 'Карточку клиента нельзя изменить после создания учётной записи'"
          :rules="[value => Boolean(value) || 'Выберите клиента']"
          @filter="filterClientOptions"
          @popup-show="resetClientOptions"
          @update:model-value="onClientCardChanged"
        />

        <div
          v-if="isNewClient && !dialogLinkExistingClient"
          class="text-caption text-grey-7 q-mt-sm"
        >
          При сохранении будет создана новая карточка клиента с указанными ФИО, e-mail и организацией.
        </div>

        <q-select
          v-model="dialogOrganizationId"
          :options="organizationOptions"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          use-input
          input-debounce="0"
          label="Организация *"
          class="organization-select"
          popup-content-class="organization-select-popup"
          hint="Организация обязательна для клиентской учётной записи"
          :rules="[value => Boolean(value) || 'Выберите организацию']"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="!isNewClient"
          outline
          color="primary"
          icon="key"
          label="Сменить пароль"
          @click="openPasswordDialog"
        />
        <q-btn
          v-if="!isNewClient"
          unelevated
          color="negative"
          icon="delete"
          label="Удалить клиента"
          @click="dialogDeleteClient"
        />
        <q-space/>
        <q-btn
          color="white"
          label="Отмена"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewOrUpdateClient"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {useStore} from 'stores/store'
import axios from 'axios'
import {EMAIL_REGEX} from 'src/util/settingsClients/clientImportConstants'
import {buildClientOptions} from 'src/util/settingsClients/clientOptions'
import clientNotifyMixin from 'components/settings/clients/clientNotifyMixin'
import clientsDataMixin from 'components/settings/clients/clientsDataMixin'

// Диалог создания / редактирования клиентской учётной записи.
// Публичный API: методы dialogNewClient() и editClient(row); событие change-password({userId, username}).
export default {
  name: 'ClientEditDialog',

  mixins: [clientNotifyMixin, clientsDataMixin],

  props: {
    organizationOptions: {type: Array, default: () => []}
  },

  emits: ['change-password'],

  data: () => ({
    dialogVisible: false,
    dialogUsername: '',
    dialogPassword: '',
    dialogFirstName: '',
    dialogLastName: '',
    dialogClientId: null,
    dialogOrganizationId: null,
    dialogLinkExistingClient: true,
    filteredClientOptions: [],

    isNewClient: true,
    userId: null
  }),

  computed: {
    shouldSelectExistingClient() {
      return !this.isNewClient || this.dialogLinkExistingClient
    },

    clientOptions() {
      return buildClientOptions(this.store.clients, client => this.getClientDisplayName(client))
    }
  },

  mounted() {
    this.resetClientOptions()
  },

  watch: {
    'store.clients': {
      deep: true,
      handler() {
        this.resetClientOptions()
      }
    }
  },

  methods: {
    requiredRule(value) {
      return Boolean(value && String(value).length > 0) || 'Обязательное поле'
    },

    dialogNewClient() {
      this.dialogVisible = true
      this.isNewClient = true
      this.userId = null
      this.dialogUsername = ''
      this.dialogLastName = ''
      this.dialogFirstName = ''
      this.dialogPassword = ''
      this.dialogClientId = null
      this.dialogOrganizationId = null
      this.dialogLinkExistingClient = true
      this.resetClientOptions()
      setTimeout(() => this.$refs.lastname?.focus(), 250)
    },

    editClient(row) {
      const client = this.getClientById(row.clientId)
      this.dialogVisible = true
      this.isNewClient = false
      this.userId = row.id
      this.dialogUsername = row.username
      this.dialogLastName = row.lastname || ''
      this.dialogFirstName = row.firstname || ''
      this.dialogPassword = ''
      this.dialogClientId = row.clientId || null
      this.dialogOrganizationId = client?.organization?.id || null
      this.dialogLinkExistingClient = true
      this.resetClientOptions()
    },

    dialogClose() {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateClient() {
      const clientUser = {
        id: this.isNewClient ? null : this.userId,
        username: this.isNewClient ? this.dialogUsername : null,
        password: this.isNewClient ? this.dialogPassword : null,
        lastname: this.dialogLastName,
        firstname: this.dialogFirstName,
        authorities: 'Клиент',
        availableOrganizationIds: [],
        clientId: this.shouldSelectExistingClient ? this.dialogClientId : null,
        createNewClientCard: this.isNewClient && !this.dialogLinkExistingClient,
        clientOrganizationId: this.dialogOrganizationId
      }

      const missingRequiredField =
        (this.isNewClient && !clientUser.username) ||
        (this.isNewClient && !clientUser.password) ||
        !clientUser.lastname ||
        !clientUser.firstname ||
        !clientUser.clientOrganizationId ||
        (this.shouldSelectExistingClient && !clientUser.clientId)

      if (missingRequiredField) {
        this.notifyError('Не заполнены обязательные поля')
        return
      }

      if (this.isNewClient && !EMAIL_REGEX.test(this.dialogUsername)) {
        this.notifyError('Почта указана некорректно')
        return
      }

      const request = this.isNewClient
        ? axios.post('/api/v1/user', clientUser)
        : axios.patch('/api/v1/user', clientUser)

      request
        .then(response => {
          const savedUser = response.data
          const index = this.store.users.findIndex(item => item.id === savedUser.id)
          if (index === -1) {
            this.store.users.push(savedUser)
          } else {
            this.store.users.splice(index, 1, savedUser)
          }

          this.applyOrganizationToLocalClient(savedUser.clientId)
          this.refreshClients()
          this.dialogClose()
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    dialogDeleteClient() {
      const clientName = `${this.dialogLastName || ''} ${this.dialogFirstName || ''}`.trim() || this.dialogUsername || 'клиента'
      this.$q.dialog({
        title: 'Удалить клиентскую учётную запись?',
        message: `Учётная запись «${clientName}» будет отключена. Карточка клиента и переписка останутся в системе.`,
        cancel: {label: 'Отмена', flat: true, color: 'primary'},
        ok: {label: 'Удалить', color: 'negative', icon: 'delete', unelevated: true, noCaps: true},
        persistent: true
      }).onOk(() => {
        axios.delete(`/api/v1/delete-user/${this.userId}`)
          .then(() => {
            this.store.users = this.store.users.filter(user => user.id !== this.userId)
            this.dialogClose()
            this.$q.notify({
              message: 'Клиентская учётная запись удалена',
              type: 'positive'
            })
          })
          .catch(error => this.notifyError(this.getErrorMessage(error)))
      })
    },

    openPasswordDialog() {
      this.$emit('change-password', {userId: this.userId, username: this.dialogUsername})
    },

    onLinkExistingClientChanged(linkExisting) {
      this.dialogClientId = null
      if (linkExisting) {
        this.dialogOrganizationId = null
      }
    },

    onClientCardChanged(clientId) {
      const client = this.getClientById(clientId)
      this.dialogOrganizationId = client?.organization?.id || null
    },

    resetClientOptions() {
      this.filteredClientOptions = [...this.clientOptions]
    },

    filterClientOptions(value, update) {
      update(() => {
        const needle = String(value || '').trim().toLocaleLowerCase('ru-RU')
        this.filteredClientOptions = needle
          ? this.clientOptions.filter(client => client.searchText.includes(needle))
          : [...this.clientOptions]
      })
    },

    applyOrganizationToLocalClient(clientId) {
      const client = this.getClientById(clientId)
      const organization = (this.store.organizations || [])
        .find(item => Number(item?.id) === Number(this.dialogOrganizationId))
      if (client && organization) {
        client.organization = organization
      }
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>
