"use client";
import { useState, useCallback, useMemo } from "react";
import { PageHeader, Chip, Tabs, Toast } from "@/components/ui";
import { T } from "@/lib/theme";

/* ──────────────────────── Data model ──────────────────────── */

type Channel = "whatsapp" | "email" | "sms";

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <circle cx="12" cy="12" r="11" fill="#25D366" />
    <path d="M17.036 14.15c-.27-.135-1.596-.787-1.843-.877-.247-.09-.427-.135-.607.135-.18.27-.697.877-.854 1.057-.157.18-.315.202-.585.067-.27-.135-1.14-.42-2.172-1.338-.803-.715-1.344-1.597-1.502-1.867-.157-.27-.017-.416.118-.55.122-.12.27-.315.405-.472.135-.158.18-.27.27-.45.09-.18.045-.338-.023-.473-.067-.135-.607-1.462-.832-2.003-.22-.526-.443-.455-.607-.463-.158-.007-.337-.01-.517-.01-.18 0-.472.067-.72.338-.247.27-.944.922-.944 2.25 0 1.327.967 2.61 1.102 2.79.135.18 1.903 2.903 4.61 4.07.644.278 1.146.444 1.538.568.646.206 1.234.177 1.7.107.518-.077 1.596-.652 1.82-1.282.226-.63.226-1.17.158-1.283-.067-.112-.247-.18-.517-.315m-4.924 6.72h-.003a8.963 8.963 0 01-4.567-1.251l-.327-.194-3.397.891.907-3.313-.214-.34a8.95 8.95 0 01-1.371-4.773c.001-4.947 4.028-8.973 8.976-8.973 2.397 0 4.65.935 6.343 2.632a8.92 8.92 0 012.627 6.35c-.003 4.948-4.029 8.974-8.974 8.974m7.637-16.61A10.73 10.73 0 0012.109 1C6.105 1 1.152 5.953 1.15 11.957c0 1.933.504 3.82 1.464 5.487L1.05 23l5.689-1.493a10.785 10.785 0 005.364 1.446h.005c6.004 0 10.957-4.953 10.96-10.958a10.896 10.896 0 00-3.22-7.736" fill="#fff"/>
  </svg>
);

const GmailIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <rect x="1" y="4" width="22" height="16" rx="3" fill="#fff" stroke="#E0E0E0" strokeWidth="0.5"/>
    <path d="M1.5 5L12 13.5L22.5 5" stroke="#EA4335" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M1.5 5L1.5 18" stroke="#4285F4" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M22.5 5L22.5 18" stroke="#34A853" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M1.5 18L8 12.5" stroke="#FBBC05" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M22.5 18L16 12.5" stroke="#34A853" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const SmsIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <rect x="1" y="2" width="22" height="17" rx="4" fill="#5B6AED" />
    <path d="M7 19l-2 3v-3" fill="#5B6AED"/>
    <circle cx="8" cy="10.5" r="1.2" fill="#fff" />
    <circle cx="12" cy="10.5" r="1.2" fill="#fff" />
    <circle cx="16" cy="10.5" r="1.2" fill="#fff" />
  </svg>
);

const CHANNELS: { key: Channel; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon size={18} />, color: "#25D366" },
  { key: "email", label: "Email", icon: <GmailIcon size={18} />, color: "#EA4335" },
  { key: "sms", label: "SMS", icon: <SmsIcon size={18} />, color: "#5B6AED" },
];

interface NotificationEvent {
  id: string;
  label: string;
  description: string;
}

interface NotificationCategory {
  id: string;
  label: string;
  events: NotificationEvent[];
}

interface RoleConfig {
  key: string;
  label: string;
  description: string;
  categories: NotificationCategory[];
}

/* ──────────────────────── Scenario definitions ──────────────────────── */

const ROLES: RoleConfig[] = [
  {
    key: "customer",
    label: "Customer",
    description: "Notifications sent to customers throughout their journey",
    categories: [
      {
        id: "cust_onboarding",
        label: "Onboarding",
        events: [
          { id: "cust_welcome", label: "Welcome message", description: "Sent when a customer account is created" },
          { id: "cust_profile_complete", label: "Profile completion reminder", description: "Nudge to fill birth details and chart info" },
          { id: "cust_kyc_verified", label: "KYC verified", description: "Confirmation after identity verification completes" },
        ],
      },
      {
        id: "cust_order",
        label: "Orders",
        events: [
          { id: "cust_order_placed", label: "Order placed", description: "Confirmation when a new order is created" },
          { id: "cust_payment_received", label: "Payment received", description: "Receipt after successful payment" },
          { id: "cust_payment_reminder", label: "Payment reminder", description: "Follow-up for pending checkout payments" },
          { id: "cust_sourcing_update", label: "Sourcing update", description: "Stone received from vendor or quality check passed" },
          { id: "cust_dispatched", label: "Order dispatched", description: "Shipment dispatched with tracking details" },
          { id: "cust_in_transit", label: "In transit update", description: "Shipment status milestone updates" },
          { id: "cust_delivered", label: "Order delivered", description: "Final delivery confirmation" },
          { id: "cust_invoice", label: "Invoice & receipt", description: "Digital invoice after payment or delivery" },
        ],
      },
      {
        id: "cust_consultation",
        label: "Consultations",
        events: [
          { id: "cust_consult_booked", label: "Consultation booked", description: "Booking confirmation with date and time" },
          { id: "cust_consult_reminder", label: "Session reminder", description: "Reminder 1 hour and 15 minutes before the session" },
          { id: "cust_consult_rescheduled", label: "Rescheduled", description: "Updated schedule notification" },
          { id: "cust_meeting_link", label: "Meeting link shared", description: "Google Meet / Zoom link before the session" },
          { id: "cust_summary_ready", label: "Summary & recommendation ready", description: "Post-session summary and stone recommendation" },
          { id: "cust_consult_payment_link", label: "Consultation payment link", description: "Checkout link for unpaid consultations" },
        ],
      },
      {
        id: "cust_energisation",
        label: "Energisation",
        events: [
          { id: "cust_energ_scheduled", label: "Energisation scheduled", description: "Ritual date, time and pandit details" },
          { id: "cust_energ_live_link", label: "Live stream link", description: "Link to watch the ritual live" },
          { id: "cust_energ_completed", label: "Energisation completed", description: "Ritual completion with certificate" },
          { id: "cust_energ_recording", label: "Recording available", description: "Ritual recording shared for reference" },
        ],
      },
    ],
  },
  {
    key: "affiliate",
    label: "Affiliate",
    description: "Notifications sent to affiliate partners",
    categories: [
      {
        id: "aff_onboarding",
        label: "Onboarding",
        events: [
          { id: "aff_welcome", label: "Welcome & invite", description: "Account created with affiliate code and dashboard access" },
          { id: "aff_approved", label: "Application approved", description: "Approval confirmation after review" },
          { id: "aff_rejected", label: "Application rejected", description: "Rejection notification with feedback" },
          { id: "aff_revision_requested", label: "Revision requested", description: "Feedback requesting updated application details" },
        ],
      },
      {
        id: "aff_order",
        label: "Orders",
        events: [
          { id: "aff_referral_converted", label: "Referral converted", description: "A referred customer placed an order" },
          { id: "aff_order_placed", label: "Order placed via link", description: "New order through the affiliate's referral link" },
          { id: "aff_order_delivered", label: "Referral order delivered", description: "Referred order delivered successfully" },
        ],
      },
      {
        id: "aff_consultation",
        label: "Consultations",
        events: [
          { id: "aff_consult_booked", label: "Referral booked consultation", description: "A referred customer booked a consultation" },
          { id: "aff_consult_completed", label: "Referral consultation completed", description: "Referred consultation session completed" },
        ],
      },
      {
        id: "aff_payment",
        label: "Payments",
        events: [
          { id: "aff_commission_accrued", label: "Commission accrued", description: "New commission earned from a conversion" },
          { id: "aff_payout_processed", label: "Payout processed", description: "Payout transferred to bank account" },
          { id: "aff_payout_summary", label: "Monthly payout summary", description: "Monthly earnings and payout statement" },
        ],
      },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    description: "Notifications sent to the sales team",
    categories: [
      {
        id: "sales_onboarding",
        label: "Onboarding",
        events: [
          { id: "sales_welcome", label: "Account created", description: "Welcome notification with portal access details" },
          { id: "sales_activated", label: "Account activated", description: "Confirmation when the account is enabled" },
        ],
      },
      {
        id: "sales_leads",
        label: "Leads",
        events: [
          { id: "sales_lead_assigned", label: "New lead assigned", description: "A new incomplete order or consultation lead is assigned" },
          { id: "sales_lead_status_change", label: "Lead status changed", description: "Lead moved to contacted, follow-up, converted, or lost" },
          { id: "sales_followup_reminder", label: "Follow-up reminder", description: "Automated reminder to follow up with a lead" },
          { id: "sales_lead_converted", label: "Lead converted", description: "A lead has been successfully converted to a paid order" },
          { id: "sales_lead_lost", label: "Lead lost", description: "Lead marked as lost with reason" },
        ],
      },
      {
        id: "sales_orders",
        label: "Order updates",
        events: [
          { id: "sales_order_placed", label: "Order placed", description: "A new order created through a sales lead" },
          { id: "sales_payment_received", label: "Payment received", description: "Payment confirmed on a sales-generated order" },
          { id: "sales_order_shipped", label: "Order shipped", description: "Order dispatched for a sales-owned customer" },
          { id: "sales_order_delivered", label: "Order delivered", description: "Final delivery confirmation for a sales-generated order" },
        ],
      },
    ],
  },
  {
    key: "astro_gem",
    label: "Astro-Gemologist",
    description: "Notifications sent to astro-gemologists",
    categories: [
      {
        id: "gem_onboarding",
        label: "Onboarding",
        events: [
          { id: "gem_welcome", label: "Welcome & credentials", description: "Account created with portal access and Calendly invite" },
          { id: "gem_calendly_invite", label: "Calendly invite sent", description: "Calendar integration invite for scheduling" },
          { id: "gem_profile_approved", label: "Profile approved", description: "Profile reviewed and published on the platform" },
        ],
      },
      {
        id: "gem_consultation",
        label: "Consultations",
        events: [
          { id: "gem_new_booking", label: "New booking", description: "A customer booked a consultation session" },
          { id: "gem_session_reminder", label: "Session reminder", description: "Reminder before the consultation session" },
          { id: "gem_rescheduled", label: "Consultation rescheduled", description: "Session rescheduled by admin or customer" },
          { id: "gem_customer_noshow", label: "Customer no-show", description: "Customer did not attend the session" },
          { id: "gem_summary_overdue", label: "Summary overdue", description: "Reminder to submit consultation summary and recommendation" },
        ],
      },
      {
        id: "gem_recommendation",
        label: "Recommendation updates",
        events: [
          { id: "gem_rec_to_order", label: "Recommendation converted to order", description: "A stone recommendation was converted into an order" },
          { id: "gem_order_status", label: "Order status update", description: "Status change on an order linked to a recommendation" },
          { id: "gem_energ_complete", label: "Energisation completed", description: "Ritual completed for a recommended stone" },
          { id: "gem_payout_processed", label: "Commission payout", description: "Commission payout processed for completed sessions" },
        ],
      },
    ],
  },
];

/* ──────────────────────── Template mock data ──────────────────────── */

interface TemplateContent {
  whatsapp: { body: string };
  email: { subject: string; body: string };
  sms: { body: string };
}

const TEMPLATES: Record<string, TemplateContent> = {
  cust_welcome: {
    whatsapp: { body: "Namaste {{customer_name}} 🙏\n\nWelcome to *AstroLaabh*! Your account has been created successfully.\n\nYou can now explore gemstone consultations, browse our curated collection, and start your astrological journey.\n\n✨ Complete your birth details to get personalised recommendations.\n\nTeam AstroLaabh" },
    email: { subject: "Welcome to AstroLaabh, {{customer_name}}!", body: "Dear {{customer_name}},\n\nThank you for joining AstroLaabh. Your account has been successfully created.\n\nTo get started, please complete your profile with your birth details so we can provide personalised gemstone recommendations based on your astrological chart.\n\nExplore consultations with our expert astro-gemologists and discover stones that resonate with your cosmic energy.\n\nWarm regards,\nTeam AstroLaabh" },
    sms: { body: "Welcome to AstroLaabh, {{customer_name}}! Your account is ready. Complete your profile to get personalised gemstone recommendations. Visit: {{portal_link}}" },
  },
  cust_profile_complete: {
    whatsapp: { body: "Hi {{customer_name}} 👋\n\nYour AstroLaabh profile is almost ready! Please add your birth details (date, time & location) so our astro-gemologists can provide accurate recommendations.\n\n📝 Complete now: {{profile_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Complete your profile – unlock personalised recommendations", body: "Hi {{customer_name}},\n\nWe noticed your birth details are still missing from your profile. Adding your date, time, and place of birth helps our astro-gemologists provide highly personalised stone recommendations.\n\nComplete your profile: {{profile_link}}\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "Hi {{customer_name}}, your AstroLaabh profile needs birth details for personalised recommendations. Complete it now: {{profile_link}}" },
  },
  cust_kyc_verified: {
    whatsapp: { body: "Hi {{customer_name}} ✅\n\nYour identity verification is complete! You now have full access to all AstroLaabh services.\n\nTeam AstroLaabh" },
    email: { subject: "KYC Verified – You're all set!", body: "Dear {{customer_name}},\n\nYour identity verification has been successfully completed. You now have unrestricted access to all AstroLaabh services including ordering and consultations.\n\nThank you,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: {{customer_name}}, your KYC verification is complete. Full access enabled." },
  },
  cust_order_placed: {
    whatsapp: { body: "Hi {{customer_name}} 🛍️\n\nYour order *{{order_id}}* has been placed successfully!\n\n💎 {{stone_name}} — {{stone_type}}\n💰 Amount: ₹{{amount}}\n\nWe'll keep you updated on the sourcing and preparation.\n\nTeam AstroLaabh" },
    email: { subject: "Order Confirmed – {{order_id}}", body: "Dear {{customer_name}},\n\nThank you for your order! Here are the details:\n\nOrder ID: {{order_id}}\nStone: {{stone_name}} ({{stone_type}})\nAmount: ₹{{amount}}\n\nOur team will begin sourcing your gemstone and you'll receive updates at every step.\n\nWarm regards,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Order {{order_id}} confirmed! {{stone_name}} – ₹{{amount}}. Track your order at {{tracking_link}}" },
  },
  cust_payment_received: {
    whatsapp: { body: "Hi {{customer_name}} 💳\n\nPayment of *₹{{amount}}* received for order *{{order_id}}*.\n\n✅ Transaction ID: {{transaction_id}}\n📅 Date: {{payment_date}}\n\nYour order is now being processed.\n\nTeam AstroLaabh" },
    email: { subject: "Payment Received – ₹{{amount}} for {{order_id}}", body: "Dear {{customer_name}},\n\nWe've received your payment. Details below:\n\nOrder: {{order_id}}\nAmount: ₹{{amount}}\nTransaction ID: {{transaction_id}}\nDate: {{payment_date}}\n\nYour gemstone order is now in progress.\n\nThank you,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: ₹{{amount}} payment received for order {{order_id}}. Txn: {{transaction_id}}" },
  },
  cust_payment_reminder: {
    whatsapp: { body: "Hi {{customer_name}} ⏰\n\nReminder: Your order *{{order_id}}* is awaiting payment of *₹{{amount}}*.\n\n💳 Pay now: {{payment_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Payment pending for order {{order_id}}", body: "Hi {{customer_name}},\n\nThis is a friendly reminder that payment of ₹{{amount}} is pending for your order {{order_id}}.\n\nComplete your payment here: {{payment_link}}\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Payment of ₹{{amount}} pending for order {{order_id}}. Pay now: {{payment_link}}" },
  },
  cust_sourcing_update: {
    whatsapp: { body: "Hi {{customer_name}} 💎\n\nUpdate on order *{{order_id}}*:\n\n{{sourcing_status}}\n\nWe'll notify you once the next step is complete.\n\nTeam AstroLaabh" },
    email: { subject: "Sourcing Update – {{order_id}}", body: "Dear {{customer_name}},\n\nHere's the latest on your order:\n\nOrder: {{order_id}}\nStatus: {{sourcing_status}}\n\nWe're working to ensure your gemstone meets our quality standards.\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Order {{order_id}} update – {{sourcing_status}}" },
  },
  cust_dispatched: {
    whatsapp: { body: "Hi {{customer_name}} 📦\n\nYour order *{{order_id}}* has been dispatched!\n\n🚚 Courier: {{courier_name}}\n📋 Tracking: {{tracking_number}}\n🔗 Track: {{tracking_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Order Dispatched – {{order_id}}", body: "Dear {{customer_name}},\n\nYour order has been shipped!\n\nOrder: {{order_id}}\nCourier: {{courier_name}}\nTracking Number: {{tracking_number}}\n\nTrack your shipment: {{tracking_link}}\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Order {{order_id}} shipped via {{courier_name}}. Track: {{tracking_link}}" },
  },
  cust_in_transit: {
    whatsapp: { body: "Hi {{customer_name}} 🚚\n\nYour order *{{order_id}}* is in transit.\n\n📍 Current location: {{current_location}}\n📅 Expected delivery: {{delivery_date}}\n\nTeam AstroLaabh" },
    email: { subject: "Shipment Update – {{order_id}}", body: "Dear {{customer_name}},\n\nYour order {{order_id}} is on its way.\n\nCurrent Location: {{current_location}}\nExpected Delivery: {{delivery_date}}\n\nTrack here: {{tracking_link}}\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Order {{order_id}} in transit. Expected: {{delivery_date}}. Track: {{tracking_link}}" },
  },
  cust_delivered: {
    whatsapp: { body: "Hi {{customer_name}} 🎉\n\nYour order *{{order_id}}* has been delivered!\n\nWe hope your gemstone brings positive energy into your life. ✨\n\nIf you have any questions about wearing or caring for your stone, reach out anytime.\n\nTeam AstroLaabh" },
    email: { subject: "Order Delivered – {{order_id}}", body: "Dear {{customer_name}},\n\nYour order {{order_id}} has been successfully delivered.\n\nWe hope your gemstone brings you prosperity and positive energy. For guidance on wearing and caring for your stone, please refer to the care guide included or contact us.\n\nWarm regards,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Order {{order_id}} delivered! Enjoy your gemstone ✨ Questions? Reply to this message." },
  },
  cust_invoice: {
    whatsapp: { body: "Hi {{customer_name}} 🧾\n\nYour invoice for order *{{order_id}}* is ready.\n\n📄 Download: {{invoice_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Invoice for Order {{order_id}}", body: "Dear {{customer_name}},\n\nPlease find attached the invoice for your order {{order_id}}.\n\nAmount: ₹{{amount}}\nDate: {{invoice_date}}\n\nDownload: {{invoice_link}}\n\nThank you,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Invoice for order {{order_id}} is ready. Download: {{invoice_link}}" },
  },
  cust_consult_booked: {
    whatsapp: { body: "Hi {{customer_name}} 📅\n\nYour consultation is confirmed!\n\n👤 Expert: {{expert_name}}\n📅 Date: {{date}}\n⏰ Time: {{time}}\n⏱️ Duration: {{duration}} mins\n\nYou'll receive the meeting link before your session.\n\nTeam AstroLaabh" },
    email: { subject: "Consultation Confirmed – {{date}} at {{time}}", body: "Dear {{customer_name}},\n\nYour consultation has been booked.\n\nExpert: {{expert_name}}\nDate: {{date}}\nTime: {{time}}\nDuration: {{duration}} minutes\n\nThe meeting link will be shared before your session.\n\nWarm regards,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Consultation booked with {{expert_name}} on {{date}} at {{time}}. Link coming soon!" },
  },
  cust_consult_reminder: {
    whatsapp: { body: "Hi {{customer_name}} ⏰\n\nReminder: Your consultation with *{{expert_name}}* is in *{{time_until}}*.\n\n🔗 Join: {{meeting_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Reminder: Consultation in {{time_until}}", body: "Hi {{customer_name}},\n\nJust a reminder that your consultation with {{expert_name}} starts in {{time_until}}.\n\nJoin here: {{meeting_link}}\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Consultation with {{expert_name}} in {{time_until}}. Join: {{meeting_link}}" },
  },
  cust_consult_rescheduled: {
    whatsapp: { body: "Hi {{customer_name}} 🔄\n\nYour consultation has been rescheduled.\n\n📅 New date: {{new_date}}\n⏰ New time: {{new_time}}\n👤 Expert: {{expert_name}}\n\nTeam AstroLaabh" },
    email: { subject: "Consultation Rescheduled – {{new_date}}", body: "Dear {{customer_name}},\n\nYour consultation has been rescheduled.\n\nNew Date: {{new_date}}\nNew Time: {{new_time}}\nExpert: {{expert_name}}\n\nAn updated meeting link will be shared.\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Consultation rescheduled to {{new_date}} at {{new_time}} with {{expert_name}}." },
  },
  cust_meeting_link: {
    whatsapp: { body: "Hi {{customer_name}} 🔗\n\nYour consultation starts soon!\n\n👤 Expert: {{expert_name}}\n⏰ Time: {{time}}\n\n🔗 Join now: {{meeting_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Your Meeting Link – Consultation with {{expert_name}}", body: "Dear {{customer_name}},\n\nHere's your meeting link for the consultation:\n\nExpert: {{expert_name}}\nTime: {{time}}\n\nJoin: {{meeting_link}}\n\nPlease join a few minutes early.\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Join your consultation now – {{meeting_link}}" },
  },
  cust_summary_ready: {
    whatsapp: { body: "Hi {{customer_name}} 📋\n\nYour consultation summary and gemstone recommendation from *{{expert_name}}* is ready!\n\n💎 Recommended: {{stone_name}}\n📄 View details: {{summary_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Your Consultation Summary & Recommendation", body: "Dear {{customer_name}},\n\nYour consultation summary and stone recommendation are ready.\n\nExpert: {{expert_name}}\nRecommended Stone: {{stone_name}}\n\nView your full summary and recommendation: {{summary_link}}\n\nWarm regards,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Consultation summary ready! {{expert_name}} recommends {{stone_name}}. View: {{summary_link}}" },
  },
  cust_consult_payment_link: {
    whatsapp: { body: "Hi {{customer_name}} 💳\n\nPlease complete the payment for your consultation.\n\n💰 Amount: ₹{{amount}}\n🔗 Pay now: {{payment_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Payment Pending – Consultation Fee ₹{{amount}}", body: "Dear {{customer_name}},\n\nThe consultation fee of ₹{{amount}} is pending.\n\nPay now: {{payment_link}}\n\nThank you,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Consultation fee ₹{{amount}} pending. Pay: {{payment_link}}" },
  },
  cust_energ_scheduled: {
    whatsapp: { body: "Hi {{customer_name}} 🙏\n\nYour gemstone energisation has been scheduled!\n\n💎 Stone: {{stone_name}}\n📅 Date: {{date}}\n⏰ Time: {{time}}\n👤 Pandit: {{pandit_name}}\n\nA live stream link will be shared before the ritual.\n\nTeam AstroLaabh" },
    email: { subject: "Energisation Scheduled – {{date}}", body: "Dear {{customer_name}},\n\nYour gemstone energisation ceremony has been scheduled.\n\nStone: {{stone_name}}\nDate: {{date}}\nTime: {{time}}\nPandit: {{pandit_name}}\n\nYou'll receive a live stream link before the ritual.\n\nWarm regards,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Energisation for {{stone_name}} on {{date}} at {{time}}. Live link coming soon!" },
  },
  cust_energ_live_link: {
    whatsapp: { body: "Hi {{customer_name}} 📺\n\nYour energisation ritual starts soon!\n\n🔗 Watch live: {{live_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Watch Live – Your Energisation Ceremony", body: "Dear {{customer_name}},\n\nYour energisation ritual is about to begin.\n\nWatch Live: {{live_link}}\n\nEnjoy the ceremony!\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Energisation starting! Watch live: {{live_link}}" },
  },
  cust_energ_completed: {
    whatsapp: { body: "Hi {{customer_name}} ✨\n\nYour *{{stone_name}}* has been energised successfully!\n\n📜 Certificate: {{certificate_link}}\n\nMay it bring positive energy and prosperity.\n\nTeam AstroLaabh" },
    email: { subject: "Energisation Complete – {{stone_name}}", body: "Dear {{customer_name}},\n\nThe energisation ceremony for your {{stone_name}} has been completed successfully.\n\nDownload Certificate: {{certificate_link}}\n\nMay your gemstone bring you blessings and prosperity.\n\nWarm regards,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: {{stone_name}} energised! Certificate: {{certificate_link}}" },
  },
  cust_energ_recording: {
    whatsapp: { body: "Hi {{customer_name}} 🎥\n\nThe recording of your energisation ceremony is now available.\n\n▶️ Watch: {{recording_link}}\n\nTeam AstroLaabh" },
    email: { subject: "Energisation Recording Available", body: "Dear {{customer_name}},\n\nThe recording of your energisation ceremony is ready for viewing.\n\nWatch Recording: {{recording_link}}\n\nBest,\nTeam AstroLaabh" },
    sms: { body: "AstroLaabh: Energisation recording ready. Watch: {{recording_link}}" },
  },
};

function getTemplate(eventId: string): TemplateContent {
  if (TEMPLATES[eventId]) return TEMPLATES[eventId];
  const label = (() => {
    for (const r of ROLES) for (const c of r.categories) for (const e of c.events) if (e.id === eventId) return e.label;
    return "Notification";
  })();
  return {
    whatsapp: { body: `Hi {{name}} 👋\n\n${label}.\n\nDetails: {{details}}\n\nTeam AstroLaabh` },
    email: { subject: label, body: `Dear {{name}},\n\n${label}.\n\n{{details}}\n\nBest regards,\nTeam AstroLaabh` },
    sms: { body: `AstroLaabh: ${label}. {{details}}` },
  };
}

/* ──────────────────────── Defaults ──────────────────────── */

type ToggleMap = Record<string, Record<Channel, boolean>>;

function buildDefaults(): ToggleMap {
  const map: ToggleMap = {};
  for (const role of ROLES) {
    for (const cat of role.categories) {
      for (const ev of cat.events) {
        map[ev.id] = { whatsapp: true, email: true, sms: false };
      }
    }
  }
  for (const id of ["cust_order_placed", "cust_payment_received", "cust_dispatched", "cust_delivered", "cust_consult_booked"]) {
    if (map[id]) map[id].sms = true;
  }
  return map;
}

/* ──────────────────────── Toggle ──────────────────────── */

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 cursor-pointer"
      style={{ background: on ? T.accent : "rgba(89,82,54,0.16)" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm"
        style={{ transform: on ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

/* ──────────────────────── Template preview (WhatsApp phone, Email card, SMS bubble) ──────────────────────── */

function TemplatePreview({ template, channel }: { template: TemplateContent; channel: Channel }) {
  if (channel === "whatsapp") {
    return (
      <div className="flex justify-center py-4">
        <div className="w-[320px] rounded-[18px] overflow-hidden" style={{ background: "#E5DDD5", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ background: "#075E54" }}>
            <WhatsAppIcon size={16} />
            <span className="text-[12px] font-semibold text-white">AstroLaabh</span>
          </div>
          <div className="px-3 py-3 min-h-[100px]">
            <div className="inline-block max-w-[85%] rounded-[10px] px-3 py-2 shadow-sm" style={{ background: "#fff" }}>
              <p className="text-[12.5px] leading-relaxed whitespace-pre-line" style={{ color: "#303030" }}>
                {template.whatsapp.body}
              </p>
              <div className="text-right mt-1">
                <span className="text-[9.5px]" style={{ color: "#999" }}>11:30 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (channel === "email") {
    return (
      <div className="flex justify-center py-4">
        <div className="w-[420px] rounded-[12px] overflow-hidden" style={{ border: `1px solid ${T.border}`, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <GmailIcon size={18} />
            <span className="text-[12px] font-semibold" style={{ color: T.text }}>AstroLaabh</span>
            <span className="text-[11px] ml-auto" style={{ color: T.faint }}>noreply@astrolaabh.com</span>
          </div>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <div className="text-[13px] font-semibold" style={{ color: T.text }}>{template.email.subject}</div>
            <div className="text-[11px] mt-0.5" style={{ color: T.faint }}>To: customer@example.com</div>
          </div>
          <div className="px-4 py-4">
            <p className="text-[12.5px] leading-relaxed whitespace-pre-line" style={{ color: T.muted }}>
              {template.email.body}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-4">
      <div className="w-[300px] rounded-[18px] overflow-hidden" style={{ background: "#F2F2F7", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#5B6AED" }}>
          <SmsIcon size={14} />
          <span className="text-[12px] font-semibold text-white">AstroLaabh</span>
        </div>
        <div className="px-3 py-3 min-h-[80px]">
          <div className="inline-block max-w-[85%] rounded-[14px] px-3 py-2.5" style={{ background: "#5B6AED" }}>
            <p className="text-[12.5px] leading-relaxed text-white whitespace-pre-line">
              {template.sms.body}
            </p>
          </div>
          <div className="mt-1 pl-1">
            <span className="text-[9.5px]" style={{ color: "#8E8E93" }}>Now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Category section ──────────────────────── */

const COL_W = "w-[52px]";
const COL_GAP = "gap-8";

function CategorySection({
  category,
  toggles,
  onToggle,
  onToggleAll,
  expandedId,
  onExpand,
}: {
  category: NotificationCategory;
  toggles: ToggleMap;
  onToggle: (eventId: string, channel: Channel) => void;
  onToggleAll: (categoryId: string, channel: Channel, value: boolean) => void;
  expandedId: string | null;
  onExpand: (eventId: string | null) => void;
}) {
  const allOn = (ch: Channel) => category.events.every((e) => toggles[e.id]?.[ch]);
  const someOn = (ch: Channel) => category.events.some((e) => toggles[e.id]?.[ch]);

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ border: `1px solid ${T.borderSoft}` }}>
      {/* Category header */}
      <div
        className="flex items-center gap-4 px-5 py-3.5"
        style={{ background: "rgba(89,82,54,0.04)", borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold" style={{ color: T.text }}>{category.label}</h3>
          <p className="text-[11.5px] mt-0.5" style={{ color: T.faint }}>
            {category.events.length} notification{category.events.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className={`flex items-center ${COL_GAP} shrink-0`}>
          {CHANNELS.map((ch) => {
            const all = allOn(ch.key);
            const some = someOn(ch.key);
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => onToggleAll(category.id, ch.key, !all)}
                className={`${COL_W} flex flex-col items-center gap-1.5 cursor-pointer group`}
                title={`${all ? "Disable" : "Enable"} all ${ch.label} for ${category.label}`}
              >
                <span
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-all group-hover:scale-105"
                  style={{ background: T.card, border: `1px solid ${T.borderSoft}` }}
                >
                  {ch.icon}
                </span>
                <span className="text-[9.5px] font-semibold tracking-[0.04em] uppercase" style={{ color: T.faint }}>
                  {ch.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Individual events */}
      <div>
        {category.events.map((ev, idx) => {
          const isExpanded = expandedId === ev.id;
          return (
            <div key={ev.id} style={idx < category.events.length - 1 ? { borderBottom: `1px solid ${T.borderSoft}` } : undefined}>
              <div
                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-[rgba(119,123,98,0.04)] cursor-pointer select-none"
                onClick={() => onExpand(isExpanded ? null : ev.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <svg
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                    style={{ color: T.faint, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium" style={{ color: T.text }}>{ev.label}</div>
                    <div className="text-[11.5px] mt-0.5 leading-relaxed" style={{ color: T.faint }}>{ev.description}</div>
                  </div>
                </div>
                <div className={`flex items-center ${COL_GAP} shrink-0`}>
                  {CHANNELS.map((ch) => (
                    <div key={ch.key} className={`${COL_W} flex justify-center`}>
                      <Toggle
                        on={toggles[ev.id]?.[ch.key] ?? false}
                        onChange={() => onToggle(ev.id, ch.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Expanded template preview */}
              {isExpanded && <ExpandedTemplate eventId={ev.id} label={ev.label} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExpandedTemplate({ eventId, label }: { eventId: string; label: string }) {
  const [previewCh, setPreviewCh] = useState<Channel>("whatsapp");
  const template = useMemo(() => getTemplate(eventId), [eventId]);

  return (
    <div
      className="px-5 pb-4"
      style={{ background: "rgba(89,82,54,0.025)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 mb-1 pt-1">
        {CHANNELS.map((ch) => (
          <button
            key={ch.key}
            onClick={() => setPreviewCh(ch.key)}
            className="px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-all cursor-pointer"
            style={
              previewCh === ch.key
                ? { background: "rgba(89,82,54,0.09)", color: T.text, border: `1.5px solid ${T.borderSoft}` }
                : { background: "transparent", color: T.faint, border: "1.5px solid transparent" }
            }
          >
            {ch.label}
          </button>
        ))}
      </div>
      <TemplatePreview template={template} channel={previewCh} />
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-[5px]" style={{ background: "rgba(160,125,56,0.10)", color: T.gold }}>
          Variables auto-filled at send time
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────── Page ──────────────────────── */

export default function NotificationSettingsPage() {
  const [activeRole, setActiveRole] = useState("customer");
  const [toggles, setToggles] = useState<ToggleMap>(buildDefaults);
  const [toast, setToast] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  const handleToggle = useCallback((eventId: string, channel: Channel) => {
    setToggles((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], [channel]: !prev[eventId]?.[channel] },
    }));
    flash("Setting updated");
  }, [flash]);

  const handleToggleAll = useCallback((categoryId: string, channel: Channel, value: boolean) => {
    setToggles((prev) => {
      const next = { ...prev };
      const role = ROLES.find((r) => r.categories.some((c) => c.id === categoryId));
      const cat = role?.categories.find((c) => c.id === categoryId);
      if (!cat) return prev;
      for (const ev of cat.events) {
        next[ev.id] = { ...next[ev.id], [channel]: value };
      }
      return next;
    });
    flash("Settings updated");
  }, [flash]);

  const role = useMemo(() => ROLES.find((r) => r.key === activeRole)!, [activeRole]);

  const stats = useMemo(() => {
    let total = 0;
    let enabled = 0;
    for (const cat of role.categories) {
      for (const ev of cat.events) {
        for (const ch of CHANNELS) {
          total++;
          if (toggles[ev.id]?.[ch.key]) enabled++;
        }
      }
    }
    return { total, enabled };
  }, [role, toggles]);

  return (
    <>
      <PageHeader title="Notification settings" />

      <p className="text-[13.5px] mb-5 -mt-1" style={{ color: T.muted }}>
        Control which notifications are sent via WhatsApp, Email and SMS for each role and scenario.
      </p>

      <Tabs
        tabs={ROLES.map((r) => ({
          key: r.key,
          label: r.label,
          count: r.categories.reduce((s, c) => s + c.events.length, 0),
        }))}
        active={activeRole}
        onChange={(k) => { setActiveRole(k); setExpandedId(null); }}
      />

      <div className="flex items-center gap-4 mt-5 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>{role.label} notifications</h2>
          <p className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>{role.description}</p>
        </div>
        <Chip tone="muted">
          {stats.enabled}/{stats.total} active
        </Chip>
      </div>

      <div className="space-y-5 pb-6">
        {role.categories.map((cat) => (
          <CategorySection
            key={cat.id}
            category={cat}
            toggles={toggles}
            onToggle={handleToggle}
            onToggleAll={handleToggleAll}
            expandedId={expandedId}
            onExpand={setExpandedId}
          />
        ))}
      </div>

      {toast && <Toast message={toast} />}
    </>
  );
}
