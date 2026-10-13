const ADDONS = Object.freeze({
  addon_cms_basic: { id: 'addon_cms_basic', name: 'Standard CMS', price: 499, fulfillmentMode: 'automatic' },
  addon_ecommerce_lite: { id: 'addon_ecommerce_lite', name: 'E-commerce Core', price: 2999, fulfillmentMode: 'automatic' },
  addon_ai_search: { id: 'addon_ai_search', name: 'Smart Search', price: 799, fulfillmentMode: 'admin' },
  addon_analytics_pro: { id: 'addon_analytics_pro', name: 'Advanced Analytics', price: 599, fulfillmentMode: 'admin' },
  addon_global_cdn: { id: 'addon_global_cdn', name: 'Global CDN', price: 199, fulfillmentMode: 'admin' },
  addon_database_sync: { id: 'addon_database_sync', name: 'Cloud Database', price: 1499, fulfillmentMode: 'admin' },
  addon_crm_sync: { id: 'addon_crm_sync', name: 'Unified CRM Sync', price: 899, fulfillmentMode: 'admin' },
  addon_email_nexus: { id: 'addon_email_nexus', name: 'Email Marketing Hub', price: 499, fulfillmentMode: 'admin' }
});

const getAddon = (id) => ADDONS[id] || null;

module.exports = { ADDONS, getAddon };
