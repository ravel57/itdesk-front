<template>
  <q-card style="width: 640px;max-width: 640px;">
    <q-card-section style="display: flex; flex-direction: row;justify-content: space-between;padding-bottom: 5px">
      <div class="text-h6">
        Инструкция WhatsApp
      </div>
      <q-btn
        icon="close"
        dense
        flat
        v-close-popup
      />
    </q-card-section>
    <q-card-section>
      <div class="">
        <ol>
          <li>
            Перейдите по ссылке <a href="https://whatsgate.ru/app/login">https://whatsgate.ru/app/login</a>;
          </li>
          <li>
            Войдите в аккаунт или зарегистрируйте новый, нажав на кнопку, указанную на рисунке;
          </li>
        </ol>
        <img style="width: 100%;border-radius: 10px;" src="/whats-app-instruction/img-1.png" alt="instruction-pic-1"/>
        <ol>
          <li value="3">
            После регистрации или входа вы попадете на главную страницу. Нажмите кнопку ”Добавить”, указанную на
            картинке;
          </li>
        </ol>
        <img style="width: 100%;border-radius: 10px;" src="/whats-app-instruction/img-2.png" alt="instruction-pic-2"/>
        <ol>
          <li value="4">
            Откроется окно добавления сессии. Введите название сессии в текстовое поле, выбирите метод авторизации и
            нажмите далее;
          </li>
        </ol>
        <img style="width: 100%;border-radius: 10px;" src="/whats-app-instruction/img-3.png" alt="instruction-pic-3"/>
        <ol>
          <li value="5">
            Пройдите авторизацию выбранным способом. После успешной авторизации вы увидете следующее окно. Нажмите “ОК”;
          </li>
        </ol>
        <img style="width: 100%;border-radius: 14px;" src="/whats-app-instruction/img-4.png" alt="instruction-pic-4"/>
        <ol>
          <li value="6">
            После нажатия вас вернет на главную страницу, а в её нижней части отобразится новая сессия;
          </li>
        </ol>
        <img style="width: 100%;border-radius: 10px;" src="/whats-app-instruction/img-5.png" alt="instruction-pic-5"/>
        <ol>
          <li value="7">
            Впишите название сессии в настройках ULDESK;
          </li>
          <li value="8">
            Скопируйте текст из графы X-Api-Key и вставьте в графу API-ключ в настройках ULDESK;
          </li>
          <li value="9">
            Нажмите “Сохранить”.
          </li>
        </ol>
        <img style="width: 100%;border-radius: 10px;" src="/whats-app-instruction/img-6.png" alt="instruction-pic-6"/>
      </div>
    </q-card-section>
    <q-card-actions class="justify-end">
      <q-btn
        color="primary"
        v-close-popup
      >
        Понятно
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script>
export default {
  name: 'whats-app-instruction'
}
</script>

<style scoped>
ol {
  padding-left: 8px;
  margin: 8px;
}
</style>
