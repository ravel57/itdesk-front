<template>
  <div class="error-page flex flex-center">
    <div class="error-page__content text-center">
      <login-logo class="q-mb-xl"/>
      <div class="error-page__code text-primary" v-text="'404'"/>
      <div class="text-h5 text-weight-bold q-mt-md" v-text="'Ничего не нашлось'"/>
      <div class="text-body1 text-grey-7 q-mt-sm" style="max-width: 420px">
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

<style scoped>
.error-page {
  min-height: 100vh;
  background: #fff;
  padding: 24px;
}

.error-page__content {
  max-width: 480px;
}

.error-page__code {
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
}
</style>
