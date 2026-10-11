// Delivery options, shared. Checkout charges them and the confirmation page
// reports them, and when each kept its own copy the two could disagree about
// what a shopper had just paid for.
export const DELIVERY = {
  standard: { label: 'Standard delivery', detail: '3–5 business days', cost: 50 },
  express: { label: 'Express delivery', detail: '1–2 business days', cost: 90 },
};

export const deliveryOf = (key) => DELIVERY[key] || DELIVERY.standard;
