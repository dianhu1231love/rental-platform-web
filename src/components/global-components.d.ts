import SmartTable from './SmartTable.vue'

declare module 'vue' {
  export interface GlobalComponents {
    SmartTable: typeof SmartTable
  }
}

export {}
