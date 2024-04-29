import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    data: []
  }),
  getters: {
    doubleCount: (state) => state.counter * 2
  },
  actions: {
  }
})
