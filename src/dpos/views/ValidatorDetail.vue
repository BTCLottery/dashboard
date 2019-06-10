<template>
  <main class="validator">
    <header>
      <h1>
        <router-link
          to="../validators"
          style="color: inherit;"
        >{{ $t('views.validator_list.validators') }}</router-link>
      </h1>
    </header>
    <section class="validator-details">
      <header>
        <h1>
          {{validator.name }}
          <span>{{validator.isBootstrap ? "(bootstrap)" : ''}}</span>
        </h1>
        <small>loom{{validator.address.local.toString().substring(2)}}</small>
        <p
          v-if="validator.description"
          style="color: rgba(0, 0, 0, 0.86);font-size: 16px;margin:0"
        >{{validator.description}}</p>
        <a :href="validator.website | url" target="_blank">
          {{validator.website | domain}}
          <fa icon="external-link-alt"/>
        </a>
      </header>
      <dl>
        <dt>{{ $t('views.validator_detail.state') }}</dt>
        <dd>{{validator.active ? "Active" : "Inactive"}}</dd>
        <dt>Delegators Stake</dt>
        <dd>{{validator.stakedAmount | tokenAmount}}</dd>
        <dt>Total Staked</dt>
        <dd>{{validator.delegationTotal | tokenAmount}}</dd>
        <dt>Fee</dt>
        <dd>{{validator.fee}}</dd>
      </dl>
    </section>
    <section v-if="!!state.plasma.address" class="user-stakes">
      <h6 v-if="!validator.isBootstrap">{{ $t('My stakes') }}</h6>
      <delegations-list :delegations="delegations"/>
      <p
        class="no-stakes"
        v-if="validator.isBootstrap === false && validator.delegations.length === 0"
      >
        {{ $t("views.validator_detail.no_stakes", {name:validator.name}) }}
        <br>
      </p>

      <div class="button-container" v-if="!validator.isBootstrap">
        <b-button class="stake mr-3" @click="requestDelegation()">{{ $t("Stake tokens") }}</b-button>
        <b-button
          class="consolidate"
          v-if="canConsolidate"
          @click="consolidate(validator)"
        >{{ $t("views.validator_detail.consolidate") }}</b-button>
      </div>

      <!-- dialogs -->
      <!-- <faucet-delegate-modal
        @onDelegate="delegateHandler"
        ref="delegateModalRef"
        :hasDelegation="hasDelegation"
      ></faucet-delegate-modal>-->
      <template v-if="!!state.dpos.delegation">
        <delegate-modal></delegate-modal>
        <redelegate-modal></redelegate-modal>
        <undelegate-modal></undelegate-modal>
      </template>
      <success-modal></success-modal>
    </section>
  </main>
</template>
<script lang="ts">
import Vue from "vue"
import { Component, Watch } from "vue-property-decorator"
import SuccessModal from "@/components/modals/SuccessModal.vue"
import RedelegateModal from "@/dpos/components/RedelegateModal.vue"
import DelegateModal from "@/dpos/components/DelegateModal.vue"
import UndelegateModal from "@/dpos/components/UndelegateModal.vue"

import { CommonTypedStore } from "@/store/common"
import { dposModule } from "@/dpos/store"
import { HasDPOSState } from "@/dpos/store/types"
import { Delegation } from "@/dpos/store/types"
import DelegationsList from "@/dpos/components/Delegations.vue"

@Component({
  components: {
    SuccessModal,
    DelegateModal,
    RedelegateModal,
    UndelegateModal,
    DelegationsList,
  },
})
export default class ValidatorDetail extends Vue {
  isSmallDevice = window.innerWidth < 600

  lockDays = [14, 90, 180, 365]

  states = ["Bonding", "Bonded", "Unbounding", "Redelegating"]

  consolidate = dposModule.consolidate

  get state(): HasDPOSState {
    return this.$store.state
  }
  get validatorName() {
    return this.$route.params.index
  }

  get userIsLoggedIn() { return this.state.plasma.address !== "" }

  get validator() {
    const validator = this.state.dpos.validators.find((v) => v.name === this.validatorName)
    // todo add state.loadingValidators:boolean
    if (validator === undefined) {
      this.$router.push("../validators")
    }
    return validator
  }

  get delegations() {
    const addr = this.validator!.addr
    return this.state.dpos.delegations.filter((d) => d.validator.addr === addr)
  }

  copyAddress() {
    // @ts-ignore
    this.$refs.address.select()
    const successful = document.execCommand("copy")
    if (successful) {
      CommonTypedStore.setSuccess("messagse.copy_addr_success_tx")
    } else {
      CommonTypedStore.setSuccess("message.copy_addr_err_tx")
    }
  }

  get canConsolidate() {
    return 1 < this.delegations.filter((d) => !d.locked).length
  }

  requestDelegation() {
    dposModule.requestDelegation(this.validator!)
  }

}
</script>

<style lang="scss">
main.validator {
  // for the "stake my tokens button"
  padding-bottom: 82px;
  // ther should be global class for page titles
  > header > .back {
    position: absolute;
    left: 0;
  }
  > header > h1 {
    color: #5246d5;
    font-size: 1.35em;
    text-align: center;
    margin: 16px -14px 0;
    font-weight: normal;
    border-bottom: 1px solid #ededed;
    padding-bottom: 16px;
  }

  dl {
    display: flex;
    flex-wrap: wrap;
    dt,
    dd {
      flex: 50%;
      border-bottom: 1px solid rgba(0, 0, 0, 0.09);
      line-height: 24px;
      padding: 8px 0 8px;
      margin: 0;
    }
    dt {
      font-weight: normal;
    }
    dd {
      font-weight: 500;
      text-align: right;
    }
  }

  .validator-details {
    margin: 0 -15px;
    padding: 15px;
    background: #fff;
    border-bottom: 1px solid #dfdfdf;
    > header {
      margin-bottom: 5px;
      padding-bottom: 5px;
      > h1 {
        color: black;
        font-size: 1.8em;
      }
    }
  }

  .user-stakes {
    margin-top: 15px;
    .no-stakes {
      text-align: center;
      button {
        background-color: #5448da;
        border-color: #5448da;
        margin-top: 15px;
      }
    }
    > footer {
      position: fixed;
      bottom: 0;
      padding: 8px;
      left: 0;
      right: 0;
      text-align: center;
      background: #00bcd47d;
      box-shadow: 0px -1px 5px grey;
      > button {
        background-color: #5448da;
        border-color: #5448da;
      }
    }
  }
}

.loading-backdrop {
  position: absolute;
  display: flex;
  align-content: center;
  justify-content: center;
  top: 0px;
  left: 0px;
  bottom: 0px;
  right: 0px;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}
</style>