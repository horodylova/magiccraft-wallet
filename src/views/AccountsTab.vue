<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="end">
          <router-link to="/tabs/add-account">
            <ion-button>
              <ion-icon slot="icon-only" :icon="addCircleOutline"></ion-icon>
            </ion-button>
          </router-link>
        </ion-buttons>
        <ion-title>Wallets</ion-title>
      </ion-toolbar>
    </ion-header>

    <div ref="contentRef" style="height: 100%;">
    <ion-content class="ion-padding">
      <ion-toast position="top" :is-open="toastState" @didDismiss="toastState = false" message="Copied to clipboard"
        :duration="1500"></ion-toast>
      <ion-list>
        <RecycleScroller class="scroller" :items="accounts" :item-size="160" key-field="address" v-slot="{ item }" ref="scroller" :style="{ height: accountsContainerHeight + 'px' }">
          <ion-item>
            <ion-label style="color: var(--primary-color)">
              {{ item.name }}
            </ion-label>
          </ion-item>
          <ion-item @click="copyText(item.address, getToastRef())">
            <p style="font-size: 0.7rem">{{ item.address }}</p>
            &nbsp;
            <ion-icon class="copy-icon" :icon="copyOutline"></ion-icon>
          </ion-item>
          <ion-item>
            <ion-chip @click="editAccount(item.address)">Edit Name</ion-chip>
          </ion-item>
        </RecycleScroller>

      </ion-list>

      <ion-modal :is-open="pkModal" @didDismiss="shownPk = ''">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button @click="pkModal = false">Close</ion-button>
            </ion-buttons>
            <ion-title>View PK</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-item @click="copyText(shownPk, getToastRef())" button>
            <ion-icon style="margin-right: 0.5rem" :icon="copyOutline" />
            <ion-label button>PK</ion-label>
            <ion-input aria-label="pk" id="pastePk" v-model="shownPk" readonly></ion-input>
          </ion-item>
        </ion-content>
      </ion-modal>
    </ion-content>
  </div>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, Ref, onMounted } from "vue";
import {
  getAccounts,
  copyText,
  replaceAccounts,
  getSettings,
  getSelectedAccount,
  saveSelectedAccount,
} from "@/utils/platform";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonButtons,
  IonButton,
  onIonViewWillEnter,
  onIonViewDidEnter,
  IonToast,
  modalController,
  IonInput,
  IonModal,
} from "@ionic/vue";

import { addCircleOutline, copyOutline } from "ionicons/icons";
import router from "@/router";
import UnlockModal from "@/views/UnlockModal.vue";
import { setUnlockModalState } from "@/utils/unlockStore";
import type { Account, Settings } from "@/extension/types";
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

const accounts = ref([]) as Ref<Account[]>;
const loading = ref(true);
const toastState = ref(false);
const shownPk = ref("");
const pkModal = ref(false);
const settings = ref({}) as Ref<Settings>;
const contentRef = ref(null) as Ref<any>
const accountsContainerHeight = ref(0) as Ref<number>
const getToastRef = () => toastState;

const loadData = () => {
  const pAccounts = getAccounts();
  const pGetSettings = getSettings();
  Promise.all([pAccounts, pGetSettings]).then((res) => {
    accounts.value = res[0];
    settings.value = res[1];
    loading.value = false;
  });
};

const editAccount = (address: string) => {
  router.push(`add-account/edit/${address}`);
};

onIonViewDidEnter(() => {
  if(contentRef.value.clientHeight == 0) {
    return
  }
  accountsContainerHeight.value = contentRef.value.clientHeight - 32 - 16
  // accountsContainerHeight.value = contentRef.value.clientHeight
})

onIonViewWillEnter(() => {
  
  loadData();
});

const openModal = async (type: string) => {
  const modal = await modalController.create({
    component: UnlockModal,
    animated: true,
    focusTrap: false,
    backdropDismiss: false,
    componentProps: {
      unlockType: type,
    },
  });
  await modal.present();
  setUnlockModalState(true);
  const { role } = await modal.onWillDismiss();
  if (role === "confirm") return true;
  setUnlockModalState(false);
  return false;
};

</script>

<style scoped>
.copy-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-left: 0.5rem;
}

.copy-icon:hover {
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out;
  transform: scale(1.05);
}
</style>
