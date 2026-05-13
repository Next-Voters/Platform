import { Generated, Selectable, Insertable, Updateable } from 'kysely'

export interface Database {
  chat_count: ChatCountTable
  admin_table: UserAdminTable
  user_admin_request: UserAdminRequestTable
  subscriptions: SubscriptionTable
}

export interface ChatCountTable {
  id: Generated<number>
  responses: number
  requests: number
}

export interface UserAdminTable {
  email: string
  name: string
}

export interface UserAdminRequestTable {
  email: string
  name: string
}

export interface SubscriptionTable {
  contact: string
  region: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_status: string | null
  stripe_period_end: string | null
  referral_code: string | null
  tier: string | null
}

export type ChatCount = Selectable<ChatCountTable>
export type NewChatCount = Insertable<ChatCountTable>
export type ChatCountUpdate = Updateable<ChatCountTable>

export type UserAdmin = Selectable<UserAdminTable>