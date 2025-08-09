<template>
  <ion-page>
    <ion-content>
      <ion-tabs @ionTabsWillChange="beforeTabChange" @ionTabsDidChange="afterTabChange">
        <ion-router-outlet :aria-hidden="false" />
        <ion-tab-bar
          slot="bottom"
          style="display: flex; flex-direction: column; height: 116px"
        >
          <div style="display: flex">
            <ion-tab-button tab="home" href="/tabs/home">
              <ion-icon :icon="walletOutline"></ion-icon>
              <ion-label>首页</ion-label>
            </ion-tab-button>

            <ion-tab-button tab="accounts" href="/tabs/accounts">
              <ion-icon :icon="personCircle"></ion-icon>
              <ion-label>钱包</ion-label>
            </ion-tab-button>

            <ion-tab-button tab="networks" href="/tabs/networks">
              <ion-icon :icon="gitNetworkOutline"></ion-icon>
              <ion-label>网络</ion-label>
            </ion-tab-button>

            <ion-tab-button tab="history" href="/tabs/history">
              <ion-icon :icon="receiptOutline"></ion-icon>
              <ion-label>交易记录</ion-label>
            </ion-tab-button>

            <ion-tab-button tab="assets" href="/tabs/assets">
              <ion-icon :icon="diamondOutline"></ion-icon>
              <ion-label>资产</ion-label>
            </ion-tab-button>
            <ion-tab-button tab="settings" href="/tabs/settings">
              <ion-icon :icon="cogOutline"></ion-icon>
              <ion-label>设置</ion-label>
            </ion-tab-button>
          </div>

          <div style="display: flex">


          </div>
        </ion-tab-bar>
      </ion-tabs>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import {
  IonPage,
  IonContent,
  IonRouterOutlet,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
} from "@ionic/vue";
import {
  personCircle,
  walletOutline,
  diamondOutline,
  cogOutline,
  receiptOutline,
  gitNetworkOutline,
  sendOutline,
  glassesOutline,
  pushOutline,
} from "ionicons/icons";

const beforeTabChange = () => {
  // do something before tab change
};
const afterTabChange = () => {
  // do something after tab change
};
</script>
