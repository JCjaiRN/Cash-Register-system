const CLOSED = "CLOSED";
const INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS";
const OPEN = "OPEN";

const PENNY = 0;
const NICKEL = 1;
const DIME = 2;
const QUARTER = 3;
const ONE = 4;
const FIVE = 5;
const TEN = 6;
const TWENTY = 7;
const ONE_HUNDRED = 8;

const currUnits = [
  ["PENNY", 0.01], 
  ["NICKEL", 0.05], 
  ["DIME", 0.1], 
  ["QUARTER", 0.25], 
  ["ONE", 1], 
  ["FIVE", 5], 
  ["TEN", 10], 
  ["TWENTY", 20], 
  ["ONE HUNDRED", 100]
]

function checkCashRegister(price, cash, cid) {
  var change;
  let changeDue = cash - price;
  const drawerStatus = getDrawerStatus(changeDue, cid);

  switch(drawerStatus){
    case INSUFFICIENT_FUNDS:
      change = { status: INSUFFICIENT_FUNDS, change: [] }
      break;
    case CLOSED:
      change = { status: CLOSED, change: [...cid] }
      break;
    case OPEN:
      const changeCurrency = [...collectChange(changeDue, cid)];
      change = changeCurrency.length > 0 ? { status: OPEN, change: changeCurrency } : { status: INSUFFICIENT_FUNDS, change: [] }
  }
  
  // Here is your change, ma'am.
  return change;
}

function getDrawerStatus(changeDue, cashInDrawer){
  let totalCash = 0;
  let status;
  for(let i = 0; i < cashInDrawer.length; i++){
    totalCash += cashInDrawer[i][1];
  }
  if(totalCash > changeDue){
    status = "OPEN";
  }
  if(totalCash == changeDue){
    status = "CLOSED";
  }
  if(totalCash < changeDue){
    status = "INSUFFICIENT_FUNDS";
  }
  return status;
}

function collectChange(changeDue, cashInDrawer) {
  const changeBreakdown = splitChange(changeDue); 
  const { dollars, cents } = changeBreakdown;
  const billChange = getBillsFromDrawer(dollars, cashInDrawer).change;
  let coinChange = getCoinsFromDrawer(cents, cashInDrawer).change;
  return billChange.concat(coinChange);
}

function splitChange(change){
  const breakdown = change.toString().split(".");
  return { dollars: breakdown[0], cents: breakdown[1] }
}

function splitBillAmounts(amount){
  let digits = amount.toString().split('').reverse();
  
  for(let i = 0; i < digits.length; i++){
     digits[i] =  i >= 1 ? parseInt(digits[i]+'0'.repeat(i)) : parseInt(digits[i]);
  }
  return digits.reverse();  
}

function selectBillOrCoinChange(amount, cid, unit, change){
  let currency = cid[unit];
  if(unit < PENNY){
       return { change: [], cid }
  }
  else if(amount == 0){
    return { change, cid };
  }
  else if(amount <= currency[1]){
    if(amount%currUnits[unit][1] != 0){
      const amtToRemove = Math.floor(amount/currUnits[unit][1])*currUnits[unit][1];
      cid[unit] = [currency[0], currency[1] - amtToRemove]
      change.push([currency[0], amtToRemove])
      const remAmount = unit > QUARTER ? amount - amtToRemove : parseFloat((amount - amtToRemove).toFixed(2))
      return selectBillOrCoinChange(remAmount, cid, unit - 1, change)
    } else {
      cid[unit] = [currency[0], currency[1] - amount]  
      change.push([currency[0], amount])
    }
    
    return { change, cid }
  } 
  else if(amount > currency[1]){
      const remAmount = amount - currency[1];
      if(currency[1] != 0){     
        change.push(currency);
      }
      cid[unit] = [currency[0], 0]
      return selectBillOrCoinChange(remAmount, cid, unit - 1, change);
  }
}

function getBillsFromDrawer(amount, cid){
   const billAmounts = splitBillAmounts(amount);
   let result = [];
   
   let i = 0, change = [];
   while(i < billAmounts.length){
     if(billAmounts[i] >= 100) {
        result.push(selectBillOrCoinChange(billAmounts[i], cid, ONE_HUNDRED, change));
        i++
        continue;
     }
     if(billAmounts[i] >= 20){
       result.push(selectBillOrCoinChange(billAmounts[i], cid, TWENTY, change));
       i++
       continue;
     }
     
     if(billAmounts[i] >= 10){
       result.push(selectBillOrCoinChange(billAmounts[i], cid, TEN, change));
       i++
       continue;
     }
     if(billAmounts[i] >= 5){
       result.push(selectBillOrCoinChange(billAmounts[i], cid, FIVE, change));
       i++
       continue;
     }
     result.push(selectBillOrCoinChange(billAmounts[i], cid, ONE, change));
     i++;
   }
   result = result[result.length-1];
   result.change = arrangeChange(result.change);
   return result
}

function getCoinsFromDrawer(amount, cid){
  const coinAmounts = splitCoinAmounts(amount);
   let result = [];
   
   let i = 0, change = [];
   while(i < coinAmounts.length){
     if(coinAmounts[i] >= 0.25) {
        result.push(selectBillOrCoinChange(coinAmounts[i], cid, QUARTER, change));
        i++
        continue;
     }
     
     if(coinAmounts[i] >= 0.1) {
        result.push(selectBillOrCoinChange(coinAmounts[i], cid, DIME, change));
        i++
        continue;
     }
     
     if(coinAmounts[i] >= 0.5) {
        result.push(selectBillOrCoinChange(coinAmounts[i], cid, NICKEL, change));
        i++
        continue;
     }
     result.push(selectBillOrCoinChange(coinAmounts[i], cid, PENNY, change));
     i++
   }
   result = result[result.length-1];
   result.change = arrangeChange(result.change);
   return result
}

function splitCoinAmounts(amount) {
  let digits = amount.toString().split('');
  
  for(let i = 0; i < digits.length; i++){
     digits[i] =  i >= 1 ? parseFloat('0.'+'0'.repeat(i)+digits[i]) : parseFloat('0.'+digits[i]);
  }
  return digits;  
}

// Utility Functions
function arrangeChange(change){
  let arrangedChange = [];
  let copyChange = change;
  for(let i = 0; i < copyChange.length; i++){
    let currency = copyChange[i];
    if(existsInArr(arrangedChange, currency[0])) {
       continue; 
    }
    for(let j = 0; j < change.length; j++){
      if(i != j) {
        if(currency[0] == change[j][0]){
          currency[1] += change[j][1];
        }
      }
    }
    arrangedChange.push(currency)
  }
  return arrangedChange;
}

function existsInArr(haystack, needle) {
    for (var i = 0; i < haystack.length; ++i) {
        if (haystack[i][0] == needle) {
            return true;
        }
    }
    return false;
}


checkCashRegister(19.5, 19, [["PENNY", 1.01], ["NICKEL", 2.05], ["DIME", 3.1], ["QUARTER", 4.25], ["ONE", 90], ["FIVE", 55], ["TEN", 20], ["TWENTY", 60], ["ONE HUNDRED", 100]]);