<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Sign Message</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item style="margin-bottom: 6px">
        <div style="display: flex; flex-direction: column">
          <div v-if="website">
            <span style="font-size: 0.95rem; opacity: 0.9">
              Request from: <b>{{ website }}</b>
            </span>
          </div>
          <div v-if="intialSelectedAccount?.name">
            <span style="font-size: 0.95rem; opacity: 0.9"
              >Sign Message with:
              {{ "[ " + intialSelectedAccount?.name }}
              <span style="font-size: 0.8rem; opacity: 0.7">
                {{
                  " ( " +
                  intialSelectedAccount?.address.slice(0, 4) +
                  "..." +
                  intialSelectedAccount?.address.slice(-4) +
                  " ) "
                }}
              </span>
              {{ "]" }}
            </span>
          </div>
        </div>
      </ion-item>
      <ion-item>
        <div
          style="
            white-space: pre-wrap;
            width: 100%;
            height: 250px;
            overflow-y: scroll;
            margin: 0.4rem;
          "
          disabled
        >
          {{ signMsg }}
        </div>
      </ion-item>
      <ion-item>
        <ion-button @click="onCancel">取消</ion-button>
        <ion-button @click="onSign">签署</ion-button>
      </ion-item>
      <ion-item style="margin-top: 6px"
        >Auto-reject Timer:&nbsp;<b>{{ timerReject }}</b></ion-item
      >
      <ion-alert
        :is-open="alertOpen"
        header="Error"
        :message="alertMsg"
        :buttons="['OK']"
        @didDismiss="alertOpen = false"
      ></ion-alert>
      <ion-loading
        :is-open="loading"
        cssClass="my-custom-class"
        message="Please wait..."
        :key="`k${loading}`"
        @didDismiss="loading = false"
      />
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonButton,
  IonAlert,
  IonLoading,
  modalController,
  onIonViewWillEnter,
} from "@ionic/vue";
import { approve, walletIssetPassword, walletPing } from "@/extension/userRequest";
import { useRoute } from "vue-router";
import {
  getSelectedAccount,
  unBlockLockout,
  blockLockout,
  hexTostr,
} from "@/utils/platform";
import UnlockModal from "@/views/UnlockModal.vue";
import type { Account } from "@/extension/types";
import { setUnlockModalState } from "@/utils/unlockStore";

const route = useRoute();
const loading = ref(false);
const intialSelectedAccount = ref(null as Account | null);
const rid = (route?.params?.rid as string) ?? "";
const website = route?.params?.website ? hexTostr(route?.params?.website as string) : "";

let sigmMsg: string = "";

try {
  const typeSign = JSON.parse(hexTostr(hexTostr((route?.params?.param as string) ?? "")));
  sigmMsg = JSON.stringify(typeSign, null, 2);
} catch (e) {
  sigmMsg = hexTostr(hexTostr((route?.params?.param as string) ?? ""));
}

const signMsg = ref(sigmMsg);
const alertOpen = ref(false);
const alertMsg = ref("");
const timerReject = ref(140);
let interval: any;
const testin = ref(null) as any;

const onCancel = () => {
  window.close();
  if (interval) {
    try {
      unBlockLockout();
      clearInterval(interval);
    } catch {
      // ignore
    }
  }
};

onIonViewWillEnter(async () => {
  blockLockout();
  let r = await walletIssetPassword()
  if (!r) {
    await openModal()
  }
  getSelectedAccount().then((account) => {
    intialSelectedAccount.value = account;
  });
  interval = setInterval(async () => {
    if (timerReject.value <= 0) {
      onCancel();
      return;
    }
    timerReject.value -= 1;
    walletPing();
  }, 1000) as any;
});

const openModal = async () => {
  const modal = await modalController.create({
    component: UnlockModal,
    animated: true,
    focusTrap: false,
    backdropDismiss: false,
  });
  await modal.present();
  setUnlockModalState(true);
  const { role } = await modal.onWillDismiss();
  if (role === "confirm") return true;
  setUnlockModalState(false);
  return false;
};

const onSign = async () => {
  loading.value = true;
  if (interval) {
    clearInterval(interval);
  }
  const selectedAccount = await getSelectedAccount();
  loading.value = false;
  unBlockLockout();
  approve(rid);
  loading.value = false;
};
</script>

<style scoped>
ion-item {
  --min-height: 30px;
  --padding-start: 8px;
  --padding-end: 8px;
}
</style>
