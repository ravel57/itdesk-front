<template>
  <q-card style="width: 640px;max-width: 640px;">
    <q-card-section style="display: flex; flex-direction: row;justify-content: space-between;padding-bottom: 5px">
      <div style="font-size: 24px">Как добавить бота в Телеграм?</div>
      <q-btn
        flat
        round
        dense
        icon="close"
        v-close-popup
      />
    </q-card-section>
    <q-card-section class="q-pt-none" style="font-size: 16px;padding-bottom: 0">
      <ol style="padding-left: 20px;margin-top: 5px;margin-bottom: 10px">
        <li>Чтобы активировать сервис настройки чат-ботов, перейдите по ссылке <a href="https://t.me/BotFather">https://t.me/BotFather</a>
          и нажмите «Запустить».
        </li>
        <li>Выбирите команду /newbot для создания нового бота.</li>
        <li>Введите имя.</li>
        <li>Введите username. Он должен быть на латинице и заканчиваться на ”bot”. Например, TetrisBot или tetris_bot.
        </li>
      </ol>
      <div
        style="border-left: solid;padding-left: 8px;border-left-color: rgba(232, 232, 232, 1);color: rgba(108, 108, 108, 1);margin-bottom: 10px">
        Обратите внимание: имя Телеграм-бота должно быть уникальным. Если вы введёте наименование, которое уже есть в
        системе мессенджера, BotFather попросит вас выбрать другое имя.
      </div>
      <div
        style="border-left: solid;padding-left: 8px;border-left-color: rgba(232, 232, 232, 1);color: rgba(108, 108, 108, 1)">
        В username можно добавить эмодзи, чтобы выделить бота в поиске Телеграм.
      </div>
      <ol style="padding-left: 20px;margin-top: 10px;margin-bottom: 10px">
        <li value="5">
          Телеграм сгенерирует уникальный токен — это ключ к вашему чат-боту. Скопируйте токен и используйте его для
          добавления в ULDESK.
        </li>
      </ol>
    </q-card-section>

    <q-card-section class="q-pt-none" style="font-size: 16px; padding-bottom: 0">
      Пример токена:
    </q-card-section>

    <q-card-section>
      <img src="/telegram-instruction/img.png" alt="telegram-instruction-pic-1" style="width: 600px;height: 344px;"/>
    </q-card-section>

    <q-card-section class="q-pt-none" style="padding-bottom: 20px">
      <div style="font-size: 16px;border-left: solid;padding-left: 8px;border-left-color: rgb(236, 8, 8);">
        Не публикуйте идентификатор в открытом доступе. Также не рекомендуется сообщать его другим лицам, даже коллегам
        в пределах вашей компании. Иначе есть риск, что токен попадёт в руки злоумышленников, которые украдут
        Телеграм-бот.
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none" style="padding-bottom: 0;font-size: 20px">
      Также
    </q-card-section>
    <q-card-section class="q-pt-none" style="padding-bottom: 0;font-size: 16px">
      Разберём основные опции, которые могут понадобятся на старте:
    </q-card-section>
    <q-card-section class="q-pt-none">
      <ul style="margin-top: 3px;margin-bottom: 3px;padding-left: 25px;font-size: 16px">
        <li>/setname — имя для чат-бота в Телеграм, которое будет появляться в диалогах с пользователями.</li>
        <li>/setdescription — описание для Телеграм-бота.</li>
        <li>/setabouttext — приветствие от бота.</li>
        <li>/setuserpic — аватарка умного помощника.</li>
        <li>/setcommands — стандартные команды для чат-бота.</li>
        <li>/deletebot — удаление Телеграм-бота.</li>
        <li>/token — генерация нового токена.</li>
        <li>/setinlinegeo — запрос геоданных у пользователей.</li>
        <li>/setjoingroups — добавление Телеграм-бота в каналы и чаты.</li>
        <li>/setprivacy — ограничение доступа бота к конфиденциальным данным.</li>
      </ul>
    </q-card-section>

    <q-card-section class="q-pt-none" style="display: flex;justify-content: end">
      <q-btn color="primary" v-close-popup>Понятно</q-btn>
    </q-card-section>
  </q-card>
</template>

<script>
export default {
  name: 'telegram-instruction'
}
</script>

<style scoped>

</style>
