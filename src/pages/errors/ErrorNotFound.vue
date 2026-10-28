<template>
  <div class="error-page flex flex-center app-shared-error-page">
    <div class="error-page__content text-center app-shared-error-page__content">
      <login-logo class="q-mb-xl"/>
      <div class="error-page__code text-primary app-shared-error-page__code" v-text="'404'"/>
      <div class="text-h5 text-weight-bold q-mt-md" v-text="'Ничего не нашлось'"/>
      <div class="text-body1 text-grey-7 q-mt-sm app-inline app-max-width-420">
        Такой страницы нет — возможно, её удалили, или ссылка устарела. Проверьте адрес или вернитесь к своим заявкам.
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
  name: 'ErrorNotFound',

  components: { LoginLogo }
})
</script>
