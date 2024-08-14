<template>
  <q-layout>
    <q-page-container style="background-color: var(--q-primary); position: relative; overflow: hidden">
      <q-page>
        <login-component
          @resetPassword="this.resetPassword"
        />
        <div style="animation-delay: 0.45s;" class="backgroundImage">
          <svg width="1980" height="841" viewBox="0 0 1980 841" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8832)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8832" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div style="animation-delay: 0.35s;" class="backgroundImage">
          <svg width="1980" height="841" viewBox="0 0 1980 841" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8833)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8833" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div style="animation-delay: 0.25s;" class="backgroundImage">
          <svg width="1980" height="657" viewBox="0 0 1980 657" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8834)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8834" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div style="animation-delay: 0.15s;" class="backgroundImage">
          <svg width="1980" height="447" viewBox="0 0 1980 447" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8835)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8835" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div style="animation-delay: 0s;" class="backgroundImage">
          <svg width="1980" height="237" viewBox="0 0 1980 237" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M177.073 177.027C177.073 37.3561 59.0244 0.812796 0 0L0 841L1980 841L1980 288.217C1940.24 369.172 1836 531.081 1737.07 531.081C1613.41 531.081 1527.32 415.257 1411.46 531.081C1318.78 623.74 1197.07 569.689 1147.8 531.081C1089.02 472.641 936.39 390.825 796.098 531.081C655.805 671.337 561.057 589.521 531.22 531.081C518.13 480.362 469.366 378.925 379.024 378.925C266.098 378.925 177.073 351.616 177.073 177.027Z" fill="url(#paint0_linear_260_8836)"/>
            <defs>
              <linearGradient id="paint0_linear_260_8836" x1="990" y1="0" x2="990" y2="841" gradientUnits="userSpaceOnUse">
                <stop stop-color="#5C35F9"/>
                <stop offset="1" stop-color="#361F93"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import axios from 'axios'
import LoginComponent from 'components/login/LoginComponent.vue'

export default {
  name: 'LoginPage',
  components: { LoginComponent },
  data: () => ({
    username: '',
    password: '',
    email: '',
    isPwd: true,
    login: true,
    passwordRestore: false,
    emailRestore: false,
    requestSend: false
  }),

  methods: {

    resetPassword (email) {
      axios.post('/api/v1/support/reset-password', { username: email })
        .then(() => {
          this.requestSend = true
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
    }
    // login () {
    //   axios.post(`/login?username=${this.username}&password=${this.password}`)
    //     .catch(e => {
    //       this.$q.notify({
    //         message: e.message,
    //         type: 'negative',
    //         position: 'top-right',
    //         actions: [{
    //           icon: 'close', color: 'white', dense: true, handler: () => undefined
    //         }]
    //       })
    //     })
    // }
  },

  mounted () {
    document.title = 'ULDESK : Вход'
  }
}
</script>

<style scoped>

.backgroundImage {
  position: absolute;
  bottom: -800px;
  animation-name: BackgroundAnimation;
  animation-duration: 1s;
  animation-fill-mode: forwards;
}

@keyframes BackgroundAnimation {
  from {
    bottom: -800px;
  }

  to {
    bottom: -20px;
  }
}

</style>
