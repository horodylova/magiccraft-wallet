<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-accordion-group :value="defaultAccordionOpen" v-if="!loading">
        <ion-accordion value="2">
          <ion-item slot="header" color="light">
            <ion-label>Theme & Misc</ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">
            <ion-list>
              <ion-radio-group :value="radioTheme">
                <ion-item>
                  <ion-radio slot="start" value="system" @click="changeTheme('system')" />
                  <ion-label>System Default</ion-label>
                </ion-item>
                <ion-item>
                  <ion-radio slot="start" value="dark" @click="changeTheme('dark')" />
                  <ion-label>Dark</ion-label>
                </ion-item>
                <ion-item>
                  <ion-radio slot="start" value="light" @click="changeTheme('light')" />
                  <ion-label>Light</ion-label>
                </ion-item>
              </ion-radio-group>
              <ion-item>
                <ion-label style="font-size: 0.7rem"
                  >Convert Address to lowercase on copy</ion-label
                >
                <ion-toggle
                  aria-label="Convert Address to Lowercase on Copy"
                  @ion-change="changeCopyLowerCaseAddress"
                  :key="updateKey"
                  slot="end"
                  :checked="settings.s.copyLowerCaseAddress"
                ></ion-toggle>
              </ion-item>
            </ion-list>
          </div>
        </ion-accordion>
        <ion-accordion value="3">
          <ion-item slot="header" color="light">
            <ion-label>Danger</ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">
            <ion-item>
              <ion-label>WIPE All DATA</ion-label>
              <ion-button color="danger" @click="wipeStorage">PERMA WIPE</ion-button>
            </ion-item>
          </div>
        </ion-accordion>
        <ion-accordion value="4">
          <ion-item slot="header" color="light">
            <ion-label>Patron</ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">
            <ion-item>
              <ion-input label="envId" :value="settings.s.UUID" @ion-change="changeEnvId"></ion-input>
            </ion-item>
          </div>
          <div class="ion-padding" slot="content">
            <ion-item>
              <ion-label>锁屏密码</ion-label>
              <ion-button color="danger" @click="resetWalletPassword">重置</ion-button>
            </ion-item>
          </div>
        </ion-accordion>
      </ion-accordion-group>
      <ion-toast
        position="top"
        :is-open="toastState"
        @didDismiss="toastState = false"
        :message="toastMsg"
        :duration="1500"
      ></ion-toast>
      <ion-loading
        :is-open="loading"
        cssClass="my-custom-class"
        message="Please wait..."
        :duration="4000"
        :key="`k${loading}`"
        @didDismiss="loading = false"
      >
      </ion-loading>
      <ion-alert
        :is-open="alertOpen"
        :header="alertHeader"
        :message="alertMsg"
        :buttons="['OK']"
        @didDismiss="alertOpen = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, reactive, Ref } from "vue";
import {
  storageWipe,
  getSettings,
  setSettings,
  getAccounts,
  saveWalletPassword,
  storageSave,
  storageRemove,
} from "@/utils/platform";
import type { Settings } from "@/extension/types";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonButton,
  IonLoading,
  onIonViewWillEnter,
  IonList,
  IonToggle,
  IonInput,
  IonAccordion,
  IonAccordionGroup,
  IonRadioGroup,
  IonRadio,
  IonAlert,
  IonToast,
} from "@ionic/vue";
console.log("shit")
const loading = ref(true);
const mpModal = ref(false);
const updateKey = ref(0);
const alertOpen = ref(false);
const alertMsg = ref("");
const toastState = ref(false);
const toastMsg = ref("");
const alertHeader = ref("Error");
const importFile = (ref(null) as unknown) as Ref<HTMLInputElement>;
type ModalPromisePassword = null | {
  resolve: (p?: unknown) => void;
  reject: (p?: unknown) => void;
};
const modalGetPassword = ref(null) as Ref<ModalPromisePassword>;
const noAccounts = ref(true);
const defaultAccordionOpen = ref("0");
const radioTheme = ref("system") as Ref<"system" | "light" | "dark">;

const wipeStorage = async () => {
  loading.value = true;
  await storageWipe();
  loading.value = false;
};
const settings = reactive({
  s: (null as unknown) as Settings,
}) as { s: Settings };

const saveSettings = async () => {
  loading.value = true;
  await setSettings(settings.s);
  loading.value = false;
};

const resetWalletPassword = async () => {
  await storageRemove('wallet_password')
}

const changeEnvId = async (event) => {
  settings.s.UUID = event.detail.value;
  await saveSettings();
  defaultAccordionOpen.value = "2";
};


const changeCopyLowerCaseAddress = async () => {
  settings.s.copyLowerCaseAddress = !settings.s?.copyLowerCaseAddress;
  await saveSettings();
  defaultAccordionOpen.value = "2";
};

const changeTheme = async (theme: "system" | "light" | "dark") => {
  document.body.classList.remove(radioTheme.value);
  document.body.classList.add(theme);
  radioTheme.value = theme;
  settings.s.theme = theme;
  await saveSettings();
  defaultAccordionOpen.value = "2";
};



onIonViewWillEnter(async () => {
  await Promise.all([
    getSettings().then((storeSettings) => {
      settings.s = storeSettings;
      radioTheme.value = settings.s.theme;
    }),
    getAccounts().then((accounts) => {
      if (accounts.length) {
        noAccounts.value = false;
      }
    }),
  ]);
  loading.value = false;
});


</script>
