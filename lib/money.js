// One formatter for every price on screen. `toFixed(2)` printed $2815.96 —
// readable to a machine, a squint for a person comparing sofas.
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (n) => USD.format(Number(n) || 0);
