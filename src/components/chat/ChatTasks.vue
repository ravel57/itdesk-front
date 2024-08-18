<template>
  <q-card
    id="taskColumn"
    bordered
    class="no-shadow"
    style="overflow: hidden;border-radius: 0;display: flex;flex-direction: column;padding: 16px 16px 0;"
    :style="this.isMobile ? 'height: calc(100vh - 89px)' : 'height: 100vh;'"
  >
    <div style="margin-bottom: 3px">
      <chat-info
        style="z-index: 1"
        :isMobile="this.isMobile"
        :client="this.client"
        :organizations="this.organizations"
        @updateClient="this.updateClient"
      />
    </div>
    <q-separator/>
    <div class="flex" style="margin-bottom: 8px;">
      <div>
        <div class="flex">
          <span
            class="text-h6"
            style="margin-top: 3px"
            v-text="this.getDeclension(this.getActualTasks.length)"
          />
          <div class="container q-pa-none q-gutter-md q-position-relative">
            <q-toggle
              v-model="isShowCompletedTasks"
              icon="add_task"
              color="primary"
              class="element q-position-absolute q-right-0"
              @mouseover="showTooltipClosedTasks = true"
              @mouseup="showTooltipClosedTasks = false"
            >
              <q-tooltip v-if="showTooltipClosedTasks">Показывать закрытые и замороженные заявки</q-tooltip>
            </q-toggle>
          </div>
        </div>
        <q-btn
          v-if="['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
          id="create-task"
          class="text-primary cursor-pointer"
          icon="add_circle"
          color="primary"
          @click="this.dialogNewTask"
          label="Создать заявку"
          style="margin-right: 8px;"
        />
        <q-btn
          icon="search"
          flat
          :class="this.showSearch ? 'text-primary' : 'text-grey-7'"
          style="margin-right: 8px;"
          @click="this.showSearch = !this.showSearch"
        >
          <q-tooltip>
            Поиск
          </q-tooltip>
        </q-btn>
        <q-btn
          icon="sort"
          flat
          class="text-grey-7"
          style="margin-right: 8px;"
        >
          <q-tooltip>
            <div v-if="this.selectedSorting.label">
              Сортировка: {{ this.selectedSorting.label }}
            </div>
            <div v-else>
              Сортировка
            </div>
          </q-tooltip>
          <q-menu
            v-model="this.sortMenuOpened"
            content-class="menu-content"
          >
            <q-list>
              <q-item
                v-for="sorting in this.sortingTypes"
                :key="sorting.slug"
                clickable
                v-close-popup
                @click="this.setSortVariable(sorting)"
              >
                <q-item-section>
                  {{ sorting.label }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn
          v-if="this.selectedSorting.label"
          @click="this.changeSortingAsc"
          flat
          class="text-grey-7"
          style="width: 20px"
          :icon="this.ascendingSort ? 'arrow_upward' : 'arrow_downward'"
        />
        <div id="task-search">
          <q-input
            v-if="this.showSearch"
            v-model="search"
            label="Поиск по заявкам"
            style="margin-top: 8px"
            dense
            clearable
          >
            <template v-slot:append>
              <q-icon name="search"/>
            </template>
          </q-input>
        </div>
      </div>
    </div>
    <div
      id="task-vertical-carousel"
      style="overflow: auto;position: relative;width: 100%;height: 100%"
    >
<!--      :style="this.isMobile ? 'height: calc(100vh - 333px)' : 'height: calc(100vh - 280px)'"-->
      <div class="row justify-center">
        <div v-if="this.getActualTasks.length > 0" style="width: 100%;">
          <q-card-section style="padding: 0">
            <q-card class="my-card no-shadow">
              <q-card-section
                v-for="task in this.getActualTasks"
                :key="task.id"
                :id="`task_${task.id}`"
                style="padding: 0;border-style: solid;border-width: 0.01em;border-radius: 4px; border-color: var(--q-primary); margin-top: 8px; max-width: 420px;"
                class="shadow-2"
              >
                <q-item
                  clickable
                  style="padding: 8px"
                  @click="this.onTaskClick(task)"
                >
                  <task-card
                    :task="task"
                    :selectedSorting="this.selectedSorting"
                    :descriptionRequire="true"
                    :slaRequire="true"
                    :taskNameShort="22"
                  >
                    <template v-slot:taskControl>
                      <div
                        class="flex"
                        style="justify-content: space-between;flex-wrap: nowrap; overflow: hidden;"
                        :style="task.linkedMessageId ? '' : 'justify-content: end;'"
                      >
                        <q-btn
                          v-if="task.linkedMessageId"
                          icon="link"
                          class="text-gray"
                          dense
                          flat
                          @click.stop="getLinkedMessage(task)"
                        >
                          <div class="text-grey">
                            Привязано
                          </div>
                        </q-btn>
                        <q-btn
                          id="close-task-btn"
                          v-if="!task.completed"
                          icon="check"
                          label="Закрыть заявку"
                          color="primary"
                          dense
                          @click.stop="this.setTaskCompleted(task)"
                        />
                      </div>
                    </template>
                  </task-card>
                </q-item>
              </q-card-section>
            </q-card>
          </q-card-section>
        </div>
        <div
          v-else
          style="text-align: center;position: absolute;width: 100%"
        >
          <div style="display: flex;width: 100%">
            <svg width="162" height="171" viewBox="0 0 162 171" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M65.4336 0.834937C66.6293 0.14458 68.1583 0.554268 68.8487 1.75L80.0987 21.2356C80.789 22.4313 80.3793 23.9603 79.1836 24.6506C77.9879 25.341 76.4589 24.9313 75.7685 23.7356L65.7685 6.41506L48.448 16.4151C47.2523 17.1054 45.7233 16.6957 45.033 15.5C44.3426 14.3043 44.7523 12.7753 45.948 12.0849L65.4336 0.834937ZM45.7566 71.4413L64.2688 2.35295L69.0984 3.64705L50.5863 72.7354L45.7566 71.4413ZM111.75 170.591L96.2961 138.733L100.795 136.551L116.249 168.409L111.75 170.591ZM96.2961 138.733C91.8791 129.627 83.7238 122.89 73.9482 120.271L75.2423 115.441C86.4197 118.436 95.7443 126.139 100.795 136.551L96.2961 138.733ZM50.5863 72.7354C45.602 91.3368 56.6409 110.457 75.2423 115.441L73.9482 120.271C52.6795 114.572 40.0577 92.71 45.7566 71.4413L50.5863 72.7354Z" fill="url(#paint0_linear_706_24566)"/>
              <path d="M64.9588 58.2727H66.5568L69.3352 65.0568H69.4375L72.2159 58.2727H73.8139V67H72.5611V60.6847H72.4801L69.9062 66.9872H68.8665L66.2926 60.6804H66.2116V67H64.9588V58.2727ZM78.3832 67.1321C77.7695 67.1321 77.234 66.9915 76.7766 66.7102C76.3192 66.429 75.9641 66.0355 75.7113 65.5298C75.4585 65.0241 75.332 64.4332 75.332 63.7571C75.332 63.0781 75.4585 62.4844 75.7113 61.9759C75.9641 61.4673 76.3192 61.0724 76.7766 60.7912C77.234 60.5099 77.7695 60.3693 78.3832 60.3693C78.9968 60.3693 79.5323 60.5099 79.9897 60.7912C80.4471 61.0724 80.8022 61.4673 81.055 61.9759C81.3079 62.4844 81.4343 63.0781 81.4343 63.7571C81.4343 64.4332 81.3079 65.0241 81.055 65.5298C80.8022 66.0355 80.4471 66.429 79.9897 66.7102C79.5323 66.9915 78.9968 67.1321 78.3832 67.1321ZM78.3874 66.0625C78.7852 66.0625 79.1147 65.9574 79.3761 65.7472C79.6374 65.5369 79.8306 65.2571 79.9556 64.9077C80.0835 64.5582 80.1474 64.1733 80.1474 63.7528C80.1474 63.3352 80.0835 62.9517 79.9556 62.6023C79.8306 62.25 79.6374 61.9673 79.3761 61.7543C79.1147 61.5412 78.7852 61.4347 78.3874 61.4347C77.9869 61.4347 77.6545 61.5412 77.3903 61.7543C77.1289 61.9673 76.9343 62.25 76.8065 62.6023C76.6815 62.9517 76.619 63.3352 76.619 63.7528C76.619 64.1733 76.6815 64.5582 76.8065 64.9077C76.9343 65.2571 77.1289 65.5369 77.3903 65.7472C77.6545 65.9574 77.9869 66.0625 78.3874 66.0625ZM82.1811 67L84.7166 63.6506L82.2109 60.4545H83.6939L85.718 63.1733H86.174V60.4545H87.4482V63.1733H87.8913L89.9155 60.4545H91.3984L88.9055 63.6506L91.4283 67H89.9155L87.8743 64.2727H87.4482V67H86.174V64.2727H85.7479L83.6939 67H82.1811ZM97.1598 63.1776V64.2812H93.6143V63.1776H97.1598ZM93.9723 60.4545V67H92.7237V60.4545H93.9723ZM98.0504 60.4545V67H96.8061V60.4545H98.0504ZM102.512 67.1321C101.898 67.1321 101.363 66.9915 100.906 66.7102C100.448 66.429 100.093 66.0355 99.8402 65.5298C99.5874 65.0241 99.4609 64.4332 99.4609 63.7571C99.4609 63.0781 99.5874 62.4844 99.8402 61.9759C100.093 61.4673 100.448 61.0724 100.906 60.7912C101.363 60.5099 101.898 60.3693 102.512 60.3693C103.126 60.3693 103.661 60.5099 104.119 60.7912C104.576 61.0724 104.931 61.4673 105.184 61.9759C105.437 62.4844 105.563 63.0781 105.563 63.7571C105.563 64.4332 105.437 65.0241 105.184 65.5298C104.931 66.0355 104.576 66.429 104.119 66.7102C103.661 66.9915 103.126 67.1321 102.512 67.1321ZM102.516 66.0625C102.914 66.0625 103.244 65.9574 103.505 65.7472C103.766 65.5369 103.96 65.2571 104.085 64.9077C104.212 64.5582 104.276 64.1733 104.276 63.7528C104.276 63.3352 104.212 62.9517 104.085 62.6023C103.96 62.25 103.766 61.9673 103.505 61.7543C103.244 61.5412 102.914 61.4347 102.516 61.4347C102.116 61.4347 101.783 61.5412 101.519 61.7543C101.258 61.9673 101.063 62.25 100.935 62.6023C100.81 62.9517 100.748 63.3352 100.748 63.7528C100.748 64.1733 100.81 64.5582 100.935 64.9077C101.063 65.2571 101.258 65.5369 101.519 65.7472C101.783 65.9574 102.116 66.0625 102.516 66.0625ZM67.6136 83.1321C66.9801 83.1321 66.4347 82.9886 65.9773 82.7017C65.5227 82.4119 65.1733 82.0128 64.929 81.5043C64.6847 80.9957 64.5625 80.4134 64.5625 79.7571C64.5625 79.0923 64.6875 78.5057 64.9375 77.9972C65.1875 77.4858 65.5398 77.0866 65.9943 76.7997C66.4489 76.5128 66.9844 76.3693 67.6009 76.3693C68.098 76.3693 68.5412 76.4616 68.9304 76.6463C69.3196 76.8281 69.6335 77.0838 69.8722 77.4134C70.1136 77.7429 70.2571 78.1278 70.3026 78.5682H69.0625C68.9943 78.2614 68.8381 77.9972 68.5938 77.7756C68.3523 77.554 68.0284 77.4432 67.6222 77.4432C67.267 77.4432 66.956 77.5369 66.6889 77.7244C66.4247 77.9091 66.2188 78.1733 66.071 78.517C65.9233 78.858 65.8494 79.2614 65.8494 79.7273C65.8494 80.2045 65.9219 80.6165 66.0668 80.9631C66.2116 81.3097 66.4162 81.5781 66.6804 81.7685C66.9474 81.9588 67.2614 82.054 67.6222 82.054C67.8636 82.054 68.0824 82.0099 68.2784 81.9219C68.4773 81.831 68.6435 81.7017 68.777 81.5341C68.9134 81.3665 69.0085 81.1648 69.0625 80.929H70.3026C70.2571 81.3523 70.1193 81.7301 69.8892 82.0625C69.6591 82.3949 69.3509 82.6562 68.9645 82.8466C68.581 83.0369 68.1307 83.1321 67.6136 83.1321ZM74.4222 83.1321C73.8086 83.1321 73.2731 82.9915 72.8157 82.7102C72.3583 82.429 72.0032 82.0355 71.7504 81.5298C71.4975 81.0241 71.3711 80.4332 71.3711 79.7571C71.3711 79.0781 71.4975 78.4844 71.7504 77.9759C72.0032 77.4673 72.3583 77.0724 72.8157 76.7912C73.2731 76.5099 73.8086 76.3693 74.4222 76.3693C75.0359 76.3693 75.5714 76.5099 76.0288 76.7912C76.4862 77.0724 76.8413 77.4673 77.0941 77.9759C77.3469 78.4844 77.4734 79.0781 77.4734 79.7571C77.4734 80.4332 77.3469 81.0241 77.0941 81.5298C76.8413 82.0355 76.4862 82.429 76.0288 82.7102C75.5714 82.9915 75.0359 83.1321 74.4222 83.1321ZM74.4265 82.0625C74.8242 82.0625 75.1538 81.9574 75.4151 81.7472C75.6765 81.5369 75.8697 81.2571 75.9947 80.9077C76.1225 80.5582 76.1864 80.1733 76.1864 79.7528C76.1864 79.3352 76.1225 78.9517 75.9947 78.6023C75.8697 78.25 75.6765 77.9673 75.4151 77.7543C75.1538 77.5412 74.8242 77.4347 74.4265 77.4347C74.0259 77.4347 73.6935 77.5412 73.4293 77.7543C73.168 77.9673 72.9734 78.25 72.8455 78.6023C72.7205 78.9517 72.658 79.3352 72.658 79.7528C72.658 80.1733 72.7205 80.5582 72.8455 80.9077C72.9734 81.2571 73.168 81.5369 73.4293 81.7472C73.6935 81.9574 74.0259 82.0625 74.4265 82.0625ZM78.5078 81.2699H79.8118C79.8288 81.5369 79.9496 81.7429 80.174 81.8878C80.4013 82.0327 80.6953 82.1051 81.0561 82.1051C81.4226 82.1051 81.7351 82.027 81.9936 81.8707C82.2521 81.7116 82.3814 81.4659 82.3814 81.1335C82.3814 80.9347 82.3317 80.7614 82.2322 80.6136C82.1357 80.4631 81.9979 80.3466 81.8189 80.2642C81.6428 80.1818 81.4339 80.1406 81.1925 80.1406H80.1271V79.1392H81.1925C81.5533 79.1392 81.8232 79.0568 82.0021 78.892C82.1811 78.7273 82.2706 78.5213 82.2706 78.2741C82.2706 78.0071 82.174 77.7926 81.9808 77.6307C81.7905 77.4659 81.5249 77.3835 81.1839 77.3835C80.8374 77.3835 80.549 77.4616 80.3189 77.6179C80.0888 77.7713 79.968 77.9702 79.9567 78.2145H78.6697C78.6783 77.848 78.7891 77.527 79.0021 77.2514C79.218 76.973 79.5078 76.7571 79.8714 76.6037C80.2379 76.4474 80.6541 76.3693 81.12 76.3693C81.6058 76.3693 82.0263 76.4474 82.3814 76.6037C82.7365 76.7599 83.0107 76.9759 83.2038 77.2514C83.3999 77.527 83.4979 77.8437 83.4979 78.2017C83.4979 78.5625 83.3899 78.858 83.174 79.0881C82.9609 79.3153 82.6825 79.4787 82.3388 79.5781V79.6463C82.5916 79.6634 82.8161 79.7401 83.0121 79.8764C83.2081 80.0128 83.3615 80.1932 83.4723 80.4176C83.5831 80.642 83.6385 80.8963 83.6385 81.1804C83.6385 81.581 83.5277 81.9276 83.3061 82.2202C83.0874 82.5128 82.7834 82.7386 82.3942 82.8977C82.0078 83.054 81.5661 83.1321 81.0689 83.1321C80.5859 83.1321 80.1527 83.0568 79.7692 82.9062C79.3885 82.7528 79.0859 82.5369 78.8615 82.2585C78.6399 81.9801 78.522 81.6506 78.5078 81.2699ZM84.315 84.8878V81.8963H84.8477C84.984 81.7713 85.0991 81.6222 85.1928 81.4489C85.2894 81.2756 85.3704 81.0696 85.4357 80.831C85.5039 80.5923 85.5607 80.3139 85.6062 79.9957C85.6516 79.6747 85.6914 79.3082 85.7255 78.8963L85.93 76.4545H90.3789V81.8963H91.3846V84.8878H90.1403V83H85.5763V84.8878H84.315ZM86.2113 81.8963H89.1346V77.5455H87.0721L86.9357 78.8963C86.8704 79.5838 86.788 80.1804 86.6886 80.6861C86.5891 81.1889 86.43 81.5923 86.2113 81.8963ZM94.5348 83.1449C94.12 83.1449 93.745 83.0682 93.4098 82.9148C93.0746 82.7585 92.8089 82.5327 92.6129 82.2372C92.4197 81.9418 92.3232 81.5795 92.3232 81.1506C92.3232 80.7812 92.3942 80.4773 92.5362 80.2386C92.6783 80 92.87 79.8111 93.1115 79.6719C93.353 79.5327 93.6229 79.4276 93.9212 79.3565C94.2195 79.2855 94.5234 79.2315 94.8331 79.1946C95.2251 79.1491 95.5433 79.1122 95.7876 79.0838C96.032 79.0526 96.2095 79.0028 96.3203 78.9347C96.4311 78.8665 96.4865 78.7557 96.4865 78.6023V78.5724C96.4865 78.2003 96.3814 77.9119 96.1712 77.7074C95.9638 77.5028 95.6541 77.4006 95.2422 77.4006C94.8132 77.4006 94.4751 77.4957 94.228 77.6861C93.9837 77.8736 93.8146 78.0824 93.7209 78.3125L92.5234 78.0398C92.6655 77.642 92.8729 77.321 93.1456 77.0767C93.4212 76.8295 93.7379 76.6506 94.0959 76.5398C94.4538 76.4261 94.8303 76.3693 95.2251 76.3693C95.4865 76.3693 95.7635 76.4006 96.0561 76.4631C96.3516 76.5227 96.6271 76.6335 96.8828 76.7955C97.1413 76.9574 97.353 77.1889 97.5178 77.4901C97.6825 77.7884 97.7649 78.1761 97.7649 78.6534V83H96.5206V82.1051H96.4695C96.3871 82.2699 96.2635 82.4318 96.0987 82.5909C95.9339 82.75 95.7223 82.8821 95.4638 82.9872C95.2053 83.0923 94.8956 83.1449 94.5348 83.1449ZM94.8118 82.1222C95.1641 82.1222 95.4652 82.0526 95.7152 81.9134C95.968 81.7741 96.1598 81.5923 96.2905 81.3679C96.424 81.1406 96.4908 80.8977 96.4908 80.6392V79.7955C96.4453 79.8409 96.3572 79.8835 96.2266 79.9233C96.0987 79.9602 95.9524 79.9929 95.7876 80.0213C95.6229 80.0469 95.4624 80.071 95.3061 80.0938C95.1499 80.1136 95.0192 80.1307 94.9141 80.1449C94.6669 80.1761 94.4411 80.2287 94.2365 80.3026C94.0348 80.3764 93.8729 80.483 93.7507 80.6222C93.6314 80.7585 93.5717 80.9403 93.5717 81.1676C93.5717 81.483 93.6882 81.7216 93.9212 81.8835C94.1541 82.0426 94.451 82.1222 94.8118 82.1222ZM98.6502 77.554V76.4545H104.173V77.554H102.038V83H100.794V77.554H98.6502ZM106.479 78.7045H108.38C109.181 78.7045 109.798 78.9034 110.229 79.3011C110.661 79.6989 110.877 80.2116 110.877 80.8395C110.877 81.2486 110.781 81.6165 110.587 81.9432C110.394 82.2699 110.112 82.5284 109.739 82.7188C109.367 82.9062 108.914 83 108.38 83H105.521V76.4545H106.769V81.9006H108.38C108.746 81.9006 109.048 81.8054 109.283 81.6151C109.519 81.4219 109.637 81.1761 109.637 80.8778C109.637 80.5625 109.519 80.3054 109.283 80.1065C109.048 79.9048 108.746 79.804 108.38 79.804H106.479V78.7045ZM64.4901 93.554V92.4545H70.0128V93.554H67.8778V99H66.6335V93.554H64.4901ZM72.1658 101.455C71.9755 101.455 71.8022 101.439 71.646 101.408C71.4897 101.379 71.3732 101.348 71.2965 101.314L71.6033 100.27C71.8363 100.332 72.0437 100.359 72.2255 100.351C72.4073 100.342 72.5678 100.274 72.707 100.146C72.8491 100.018 72.9741 99.8097 73.082 99.5199L73.2397 99.0852L70.8448 92.4545H72.2085L73.8661 97.5341H73.9343L75.592 92.4545H76.9599L74.2624 99.8736C74.1374 100.214 73.9783 100.503 73.7852 100.739C73.592 100.977 73.3619 101.156 73.0948 101.276C72.8278 101.395 72.5181 101.455 72.1658 101.455ZM77.7908 93.554V92.4545H83.3136V93.554H81.1786V99H79.9343V93.554H77.7908Z" fill="#9479FF"/>
              <defs>
                <linearGradient id="paint0_linear_706_24566" x1="25.0211" y1="27.0539" x2="24.6295" y2="162.518" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#9479FF"/>
                  <stop offset="1" stop-color="white"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div style="font-size: 20px">Заявок нет</div>
          <no-tasks-placeholder/>
        </div>
      </div>
    </div>
  </q-card>
  <task-dialog
    v-if="getPossibilityToOpenDialogTask"
    :client="this.client"
    :isMobile="this.isMobile"
    :task="this.selectedTask"
    :isNewTaskDialogShow="this.isNewTaskDialogShow"
    :isTaskDialogShow="this.isTaskDialogShow"
    :isNewTask="this.isNewTask"
    @closeDialog="this.closeDialog"
    @addMessageToTask="this.addMessageToTask"
    @updateTask="updateTask($event)"
  />
</template>

<script>
import axios from 'axios'
import ChatInfo from 'components/chat/ChatClientInfo.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'
import TaskCard from 'components/TaskCard.vue'
import { useStore } from 'stores/store'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'

export default {

  name: 'ChatTasks',

  components: { NoTasksPlaceholder, TaskCard, TaskDialog, ChatInfo },

  props: ['tasks', 'tags', 'users', 'client', 'statuses', 'priorities', 'organizations', 'isMobile'],

  data: () => ({
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,
    showTooltipClosedTasks: false,

    dialogTaskId: '',
    dialogTaskName: '',
    dialogTaskDescription: '',
    dialogTaskPriority: '',
    dialogTaskExecutor: '',
    dialogTaskTags: [],
    dialogTaskStatus: '',
    dialogTaskDeadline: '',
    dialogTaskComplete: false,
    linkedMessageId: '',

    taskCreatedAt: '',
    selectedTask: {},

    isShowCompletedTasks: false,
    isNewTask: true,
    isNewLinkedTask: false,
    taskId: null, // for update

    search: '',
    searchResults: [],
    sortMenuOpened: false,
    dialogTab: 'tab1',
    selectedSorting: [],
    ascendingSort: true,

    sortingTypes: [
      { label: 'По дедлайну', slug: 'deadline' },
      { label: 'По дате создания', slug: 'creating' },
      { label: 'Приоритету', slug: 'priority' },
      // { label: 'SLA', slug: 'sla' },
      { label: 'По статусу', slug: 'status' }
    ],
    slaIsPause: false,

    showSearch: false
  }),

  methods: {
    updateClient (newClient) {
      this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
    },

    dialogNewTask () {
      this.isNewTask = true
      this.isTaskDialogShow = true
      // setTimeout(() => this.$refs.taskName.focus(), 500)
    },

    onTaskClick (task) {
      if (!this.isNewTaskDialogShow) {
        this.selectedTask = task
        this.isNewTask = false
        this.isNewTaskDialogShow = true
        this.updateUrlWithTask(task.id)
      }
    },

    updateTask (task, newTask) {
      this.$emit('updateTask', task, newTask)
    },

    setTaskCompleted (task) {
      const completedTask = {
        id: task.id,
        name: task.name,
        description: task.description,
        status: task.status,
        priority: task.priority,
        executor: task.executor,
        tags: task.tags,
        completed: true,
        createdAt: task.createdAt,
        deadline: task.deadline,
        linkedMessageId: task.linkedMessageId,
        sla: task.sla
      }
      axios.patch(`/api/v1/client/${this.client.id}/task`, completedTask)
        .then(newTask => {
          this.closeDialog()
          this.updateTask(task, newTask)
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
      this.$q.notify({
        message: 'Заявка закрыта',
        type: 'positive',
        position: 'top-right',
        actions: [{
          icon: 'close', color: 'white', dense: true, handler: () => undefined
        }]
      })
    },

    getStamp (date) {
      if (date) {
        return date.toLocaleTimeString('ru-RU', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        return ''
      }
    },

    getLinkedMessage (task) {
      this.$emit('scrollToElementById', task)
    },

    goToTask (taskId) {
      this.scrollToElementById(`task_${taskId}`)
    },

    updateUrlWithTask (openedTaskId) {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.set('task', openedTaskId)
      this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
    },

    initializeTaskFromUrl () {
      const queryParams = new URLSearchParams(window.location.search)
      const taskIdFromUrl = queryParams.get('task')
      const messageId = queryParams.get('newTaskFromMessage')
      if (messageId && !taskIdFromUrl && !this.isTaskDialogShow) {
        this.isNewLinkedTask = true
        this.dialogNewTask()
      } else if (!messageId && this.isNewTask && this.isNewLinkedTask) {
        this.isNewLinkedTask = false
        this.isTaskDialogShow = false
      }
      if (taskIdFromUrl) {
        const taskFromUrl = this.getActualTasks.find(task => task.id === Number(taskIdFromUrl))
        if (taskFromUrl.completed) {
          this.isShowCompletedTasks = true
        }
        this.onTaskClick(taskFromUrl)
      } else {
        this.isNewTaskDialogShow = false
      }
    },

    closeDialog () {
      const queryParams = new URLSearchParams(window.location.search)
      if (queryParams.get('newTaskFromMessage')) {
        queryParams.delete('newTaskFromMessage')
        this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      }
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
    },

    setSortVariable (sort) {
      this.selectedSorting = sort
    },

    changeSortingAsc () {
      this.ascendingSort = !this.ascendingSort
    },

    addMessageToTask (event) {
      this.selectedTask.messages.push(event.message)
    },

    getDeclension (count) {
      const declensions = ['заявка', 'заявки', 'заявок']
      let form

      if (count % 10 === 1 && count % 100 !== 11) {
        form = declensions[0]
      } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        form = declensions[1]
      } else {
        form = declensions[2]
      }

      return `${count} ${form}`
    }
  },

  computed: {
    getActualTasks () {
      const filteredTasks = this.tasks.filter(task => {
        const showCompleted = (!task.frozen && !task.completed) || this.isShowCompletedTasks
        let matchSearch = true
        if (this.search) {
          matchSearch = task.name.toLowerCase().includes(this.search.toLowerCase()) ||
            task.id.toString().toLowerCase().includes(this.search.toLowerCase()) ||
            task.priority.name.toLowerCase().includes(this.search.toLowerCase()) ||
            // task.createdAt.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
            task.status.name.toLowerCase().includes(this.search.toLowerCase()) // ||
          // task.executor ? (task.executor.firstname + ' ' + task.executor.lastname).toLowerCase().includes(this.searchRequest.toLowerCase()) : true
        }
        return showCompleted && matchSearch
      })
      if (this.selectedSorting.slug) {
        if (this.ascendingSort) {
          filteredTasks.sort((a, b) => {
            switch (this.selectedSorting.slug) {
              case 'deadline':
                return new Date(a.deadline) - new Date(b.deadline)
              case 'creating':
                return new Date(a.createdAt) - new Date(b.createdAt)
              case 'priority':
                return b.priority.orderNumber - a.priority.orderNumber
              case 'sla':
                if (a.sla && b.sla) {
                  return b.sla.startDate.clone().add(b.sla.duration) - a.sla.startDate.clone().add(a.sla.duration)
                } else {
                  return b
                }
              case 'status':
                return b.status.orderNumber - a.status.orderNumber
              default:
                return 0
            }
          })
        } else {
          filteredTasks.sort((a, b) => {
            switch (this.selectedSorting.slug) {
              case 'deadline':
                return new Date(b.deadline) - new Date(a.deadline)
              case 'creating':
                return new Date(b.createdAt) - new Date(a.createdAt)
              case 'priority':
                return a.priority.orderNumber - b.priority.orderNumber
              case 'sla':
                if (a.sla && b.sla) {
                  return a.sla.startDate.clone().add(a.sla.duration) - b.sla.startDate.clone().add(b.sla.duration)
                } else {
                  return b
                }
              case 'status':
                return a.status.orderNumber - b.status.orderNumber
              default:
                return 0
            }
          })
        }
      }
      return filteredTasks
    },

    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    isSearchNotEmpty () {
      return this.searchResults.length > 0
    }
  },

  watch: {
    isNewTaskDialogShow (newVal) {
      if (this.isNewTaskDialogShow === false) {
        const queryParams = new URLSearchParams(window.location.search)
        queryParams.delete('task')
        this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      }
    },

    isShowCompletedTasks () {
      localStorage.setItem('isShowCompletedTasks', this.isShowCompletedTasks)
    }
  },

  mounted () {
    setInterval(() => this.initializeTaskFromUrl(), 500)
  },

  created () {
    this.isShowCompletedTasks = localStorage.getItem('isShowCompletedTasks') !== 'false'
  },

  setup () {
    const store = useStore()
    return { store }
  }

}
</script>

<style scoped>
.small-text {
  font-size: 0.9em;
}

th {
  text-align: left;
}

.flex-container {
  display: flex;
  justify-content: space-between;
}

.flex-item {
  flex: 0 0 48%;
}

.no-border-card {
  border: none;
  box-shadow: none;
}
</style>
