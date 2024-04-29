<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <div
        class="sticky-tabs"
        v-if="this.$q.screen.width < 1023"
      >
        <q-tabs
          v-model="tab"
          dense
          align="justify"
          class="bg-primary text-white shadow-2"
          :breakpoint="0"
        >
          <q-tab name="tab1" icon="forum"/>
          <q-tab name="tab2" icon="database"/>
          <q-tab name="tab3" icon="info"/>
        </q-tabs>
      </div>
      <q-page padding>
        <div class="q-gutter-md row">

          <div class="col" v-if="this.$q.screen.width > 1023 || this.tab === 'tab1'">
            <q-layout view="lHh Lpr lFf" container style="height: 85vh" class="shadow-2 rounded-borders">
              <q-page-container>
                <q-page padding style="padding-bottom: 66px">
                  <div class="q-pa-md row justify-center">
                    <div style="width: 100%;">
                      <div v-for="message in this.messages" :key="message.id">
                        <q-chat-message
                          :avatar="message.avatar"
                          :name="message.name"
                          :sent="message.sent"
                          :text="message.text"
                        />
                      </div>
                    </div>
                  </div>
                  <q-page-sticky expand position="bottom">
                    <q-toolbar>
                      <textarea placeholder="Placeholder" style="width: 100%;" class="shadow-2 rounded-borders"/>
                      <q-btn icon="send"/>
                    </q-toolbar>
                  </q-page-sticky>
                </q-page>
              </q-page-container>
            </q-layout>
          </div>

          <div class="col" v-if="this.$q.screen.width > 1023 || this.tab === 'tab2'">
            <q-card class="my-card q-layout-padding">
              <q-card-section>
                <div class="text-h6">Макросы</div>
                <div class="text-h6">Автоввод</div>
                <div class="text-h6">Шаблоны</div>
              </q-card-section>
            </q-card>
          </div>

          <div
            class="col"
            v-if="this.$q.screen.width > 1023 || this.tab === 'tab3'"
            style="height: 100%;"
          >
            <q-card class="my-card q-layout-padding">
              <q-card-section>
                <div class="text-h6">Фамилия Имя</div>
                <div class="text-subtitle2">организация</div>
                <div class="text-subtitle2">доп инфа</div>
                <div class="text-subtitle2">rPCSMT</div>
                <div class="text-subtitle2">check-admin-pc</div>
              </q-card-section>
            </q-card>
            <q-card class="my-card" style="min-height: 500px">
              <div class="text-h6">Список задач</div>
              <div class="text-grey-7">Создать новую задачу</div>
              <q-layout view="lHh Lpr lFf" container style="height: 85vh" class="shadow-2 rounded-borders">
                <q-page-container>
                  <q-page padding>
                    <div class="q-pa-md row justify-center">
                      <div style="width: 100%;">
                        <q-card-section>
                          <q-card class="my-card">
                            <q-card-section v-for="n in 10" :key="n">
                              <div class="text-subtitle2">задача {{ n }}</div>
                              <div class="text-subtitle2">тег 1, тег 2, тег 3, тег 4</div>
                              <div class="text-subtitle2">Приоритет</div>
                              <div class="text-subtitle2">Создана</div>
                              <div class="text-subtitle2">Статус</div>
                              <div class="text-subtitle2">Дедлайн</div>
                              <div class="text-subtitle2">Исполнитель</div>
                            </q-card-section>
                          </q-card>
                        </q-card-section>
                      </div>
                    </div>
                  </q-page>
                </q-page-container>
              </q-layout>
            </q-card>
          </div>

        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
const messages = [
  {
    id: 1,
    name: 'test test',
    text: ['test test', 'test2', 'test3'],
    sent: true
  },
  {
    id: 1,
    name: 'sex sex',
    text: ['test test', 'test2', 'test3'],
    sent: true
  },
  {
    id: 2,
    name: 'test test',
    text: ['test test'],
    sent: false
  },
  {
    id: 1,
    name: 'test test',
    text: ['test test', 'test2', 'test3'],
    sent: true
  },
  {
    id: 1,
    name: 'test test',
    text: ['test test', 'test2', 'test3'],
    sent: true
  },
  {
    id: 2,
    name: 'test test',
    text: ['test test'],
    sent: false
  },
  {
    id: 1,
    name: 'test test',
    text: ['test test', 'test2', 'test3'],
    sent: true
  },
  {
    id: 1,
    name: 'test test',
    text: ['test test', 'test2', 'test3'],
    sent: true
  },
  {
    id: 2,
    name: 'test test',
    text: ['test test'],
    sent: false
  },
  {
    id: 1,
    name: 'test test',
    text: ['test test', 'test2', 'test3'],
    sent: true
  },
  {
    id: 1,
    name: 'test test',
    text: ['test test', 'test2', 'test3'],
    sent: true
  },
  {
    id: 2,
    name: 'test test',
    text: ['test test'],
    sent: false
  },
  {
    id: 1,
    name: 'test test',
    text: ['test test', 'test2', 'test3'],
    sent: true
  }
]

export default {
  data: () => {
    return {
      tab: 'tab1',
      messages
    }
  }
}
</script>

<style>
.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
