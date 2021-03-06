<template>
  <div>
    <b-card>
      <b-card-title>{{ $t('components.validator_extended_detail.register_as_validator') }}</b-card-title>
      <hr />
      <b-card-body v-if="!validator">
        <i18n tag="p" path="components.validator_extended_detail.not_validator_account">
          <code place="address">{{ plasmaAddress }}</code>
        </i18n>
        <p>
          <i18n tag="span" path="components.validator_extended_detail.follow_guide">
            <a place="link" :href="guideLink" target="_blank">{{ $t('components.validator_extended_detail.validator_guide') }}</a>
          </i18n>    
          <br>
          <span>{{ $t('components.validator_extended_detail.whitelist_amount_description') }}</span>          
        </p>
        <i18n tag="p" path="components.validator_extended_detail.follow_node_guide">
          <a place="link" :href="setupLink" target="_blank">{{ $t('components.validator_extended_detail.node_setup_guide') }}</a>
        </i18n>
        <i18n tag="p" path="components.validator_extended_detail.register_as_validator_description">
          <code place="address">{{ plasmaAddress }}</code>
        </i18n>
        
        <b-button variant="primary" @click="showInfo = true">{{ $t('components.validator_extended_detail.register_amount') }}</b-button>
      </b-card-body>
      <register-candidate-form class="mb-2" v-if="showInfo && !validator"/>
      <b-card-header class="validator-head" v-if="validator">
        <div>
          <h2>{{ validator.name }}</h2>
          <h5>{{ validator.active ? "Active" : "Inactive" }}</h5>
          <br />
          <p>{{ validator.addr | loomAddress }}</p>
          <a :href="validator.website | url" target="_blank">
            {{validator.website | domain}}
            <fa icon="external-link-alt" />
          </a>
        </div>
      </b-card-header>
      <b-card-body class="validator-body" v-if="validator">
        <b-card-text>
          <p>{{ validator.description }}</p>
          <div class="public-key">
            <p>{{ $t('components.validator_extended_detail.public_key') }}</p>
            <span>{{ decodeUint8Array(validator.pubKey) }}</span>
          </div>
        </b-card-text>
        <b-row>
          <b-col cols="4">
            <dl>
              <dt>{{ $t('components.validator_extended_detail.fee') }}</dt>
              <dd>{{ validator.fee }}</dd>
              <dt>{{ $t('components.validator_extended_detail.new_fee') }}</dt>
              <dd>{{ validator.newFee }}</dd>
              <dt>{{ $t('components.validator_extended_detail.candidate_state') }}</dt>
              <dd>{{ validator.candidateState }}</dd>
              <dt>{{ $t('components.validator_extended_detail.max_referral_percentage') }}</dt>
              <dd>{{ validator.maxReferralPercentage }} %</dd>
              <dt>{{ $t('components.validator_extended_detail.slash_percentage') }}</dt>
              <dd>{{ validator.slashPercentage }} %</dd>
            </dl>
          </b-col>
          <b-col cols="1"></b-col>
          <b-col cols="7">
            <dl>
              <dt>{{ $t('components.validator_extended_detail.delegation_total') }}</dt>
              <dd>{{ validator.delegationTotal | tokenAmount }}</dd>
              <dt>{{ $t('components.validator_extended_detail.staked_amount') }}</dt>
              <dd>{{ validator.stakedAmount | tokenAmount }}</dd>
              <dt>{{ $t('components.validator_extended_detail.whitelist_amount') }}t</dt>
              <dd>{{ validator.whitelistAmount | tokenAmount }}</dd>
              <dt>{{ $t('components.validator_extended_detail.whitelist_locktime_tier') }}</dt>
              <dd>{{ validator.whitelistLocktimeTier }}</dd>
            </dl>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
  </div>
</template>

<script lang="ts">
import Vue from "vue"
import { Component, Watch, Prop } from "vue-property-decorator"
import { HasDPOSState } from "@/dpos/store/types"
import { formatTokenAmount } from "@/filters"
import { TextDecoder } from "util"
import { formatToLoomAddress, parseToWei } from "@/utils"
import BN from "bn.js"
import { dposModule } from "../store"
import RegisterCandidateForm from "./RegisterCandidateForm.vue"
import BigNumber from 'bignumber.js';

@Component({
  components: {
    RegisterCandidateForm,
  },
})
export default class ValidatorExtendedDetail extends Vue {

  formLink = "https://docs.google.com/forms/d/e/1FAIpQLSeNOYyBKwvYVWc-jQ3-cb-8g22GffQ24vvxe0LwS5xUKp43Rg/viewform"
  guideLink = "https://loomx.io/developers/en/validator.html"
  setupLink = "https://loomx.io/developers/en/jump-start-plasma.html"

  showInfo = false

  @Prop(String) userAddress!: string

  get state(): HasDPOSState {
    return this.$store.state
  }

  get plasmaAddress() {
    return this.state.plasma.address
  }

  get validator() {
    const myValidator = this.state.dpos.validators.find((validator) => {
      return validator.addr === this.userAddress
      // return validator.addr === this.plasmaAddress
    })
    // console.log("validator ADDR", myValidator!.addr)
    return myValidator ? myValidator : false
  }

  decodeUint8Array(key: Uint8Array) {
    return Buffer.from(key).toString("hex")
  }


}
</script>

<style lang="scss">
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
    margin-bottom: 10px;
  }
  dt {
    font-weight: 300;
  }
  dd {
    font-weight: 400;
    text-align: right;
  }
}

.validator-head {
  background-color: white;
  div {
    h2 {
      display: inline;
      color: black;
    }
    h5 {
      font-weight: 300;
      float: right;
      margin-top: 0.5%;
    }
    p {
      display: inline-block;
      vertical-align: top;
    }
    a {
      float: right;
    }
  }
}

.validator-body {
  p {
    color: black;
  }
}

.public-key {
  height: 50px;
  background-color: #f2f2f2;
  display: block;
  p {
    vertical-align: middle;
    color: #6e6e6e;
    line-height: 50px;
    display: inline-block;
    margin-left: 2.5%;
    font-weight: 500;
  }
  span {
    float: right;
    line-height: 50px;
    vertical-align: middle;
    color: rgba(110, 110, 110, 0.68);
    margin-right: 2.5%;
  }
}

.validator-info {
  margin-top: 2%;
}
</style>
