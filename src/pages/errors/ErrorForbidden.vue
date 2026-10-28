<template>
  <div class="error-page flex flex-center app-shared-error-page">
    <div class="error-page__content text-center app-shared-error-page__content">
      <login-logo class="q-mb-xl"/>
      <q-icon name="lock" size="40px" color="orange-8" class="q-mb-sm"/>
      <div class="error-page__code text-orange-8 app-shared-error-page__code" v-text="'403'"/>
      <div class="text-h5 text-weight-bold q-mt-md" v-text="'Недостаточно прав'"/>
      <div class="text-body1 text-grey-7 q-mt-sm app-inline app-max-width-420">
        Ваша роль не даёт доступа к этому разделу. Если он нужен для работы — обратитесь к администратору системы.
      </div>
      <div class="row q-gutter-sm justify-center q-mt-lg">
        <q-btn
          color="primary"
          unelevated
          to="/"
          label="На главную"
        />
        <q-btn
          flat
          color="grey-8"
          label="Назад"
          @click="$router.back()"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import LoginLogo from 'components/LoginLogo.vue'

export default defineComponent({
  name: 'ErrorForbidden',

  components: { LoginLogo }
})
</script>
