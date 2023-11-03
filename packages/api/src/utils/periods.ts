export const calcPeriods = (balances: any[], orders: any[]) => {
  // predefine previous element
  let previous: (any | undefined) = undefined;
  let firstOrder: Date;
  // calculate periods
  return [...balances, undefined].map(balanceEntry => {
    // calculate start and end date
    let start = previous && previous.date.end;
    let end = balanceEntry && new Date(balanceEntry.date);
    // find orders in period
    let ordersInPeriod = orders
      .filter(o => {
        let date = new Date(o.date);
        return ((!end || date < end) && (!start || date >= start));
      })
      .reverse();
    // calculate sum of orders in period
    let sum = ordersInPeriod
      .map(o => -o.amount)
      .reduce((p, s) => p + s, 0.0);
    // calculate cumulated sum of periods until and including this period
    let invest = (previous?.invest || 0.0) + sum;
    // calculate sell and buy order sums
    const sell = ordersInPeriod.map(o => o.amount > 0 ? -o.amount : 0.0).reduce((p, s) => p + s, 0.0);
    const buy = ordersInPeriod.map(o => o.amount < 0 ? -o.amount : 0.0).reduce((p, s) => p + s, 0.0);
    // amount and return of invest
    const amount = balanceEntry ? balanceEntry.amount : 0.0;
    const balance = balanceEntry ? (balanceEntry.amount / invest - 1.0) : 0.0;
    // calculate return annual of invest
    let roi = 0.0;
    // save first order
    if (start === undefined)
      firstOrder = new Date(ordersInPeriod.at(-1)?.date || '');
    // calculate floating average annual roi
    if (end !== undefined) {
      const years = Math.floor((end.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24)) / 365;
      roi = (amount - invest) / (invest * years);
    }
    // iterate over orders
    let period = {
      date: {
        start,
        end
      },
      orders: ordersInPeriod.reverse(),
      sum,
      invest,
      sell,
      buy,
      amount,
      balance,
      roi,
      previous,
      entry: balanceEntry && {...balanceEntry},
    }
    // save last date and return
    previous = {...period};
    return period;
  }).reverse()
}
