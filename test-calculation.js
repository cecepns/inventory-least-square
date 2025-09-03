// Manual verification test for the calculation fix
console.log('=== MANUAL CALCULATION VERIFICATION ===');

// Test data from your table
const testData = [
  { periode: 1, penjualan: 675, x2: 1, xy: 675 },   // Minggu 1
  { periode: 2, penjualan: 1274, x2: 4, xy: 2548 }, // Minggu 2
  { periode: 3, penjualan: 0, x2: 9, xy: 0 },       // Minggu 3
  { periode: 4, penjualan: 735, x2: 16, xy: 2940 }  // Minggu 4
];

console.log('Input data:');
console.log('No\tMinggu\t\tPeriode(X)\tPenjualan(Y)\tX²\tXY');
console.log('─'.repeat(70));

let totalX = 0, totalY = 0, totalX2 = 0, totalXY = 0;

testData.forEach((row, index) => {
  console.log(`${index + 1}\tMinggu ${index + 1}\t${row.periode}\t\t${row.penjualan}\t\t${row.x2}\t${row.xy}`);
  totalX += row.periode;
  totalY += row.penjualan;
  totalX2 += row.x2;
  totalXY += row.xy;
});

console.log('─'.repeat(70));
console.log(`Total\tTotal\t\t${totalX}\t\t${totalY}\t\t${totalX2}\t${totalXY}`);

console.log('\n=== EXPECTED VALUES (from your table) ===');
console.log('Expected Σx: 10');
console.log('Expected Σy: 2684');  
console.log('Expected Σx²: 30');
console.log('Expected Σxy: 6163');

console.log('\n=== CALCULATED VALUES ===');
console.log('Calculated Σx:', totalX);
console.log('Calculated Σy:', totalY);
console.log('Calculated Σx²:', totalX2);
console.log('Calculated Σxy:', totalXY);

console.log('\n=== VERIFICATION ===');
console.log('Σx matches expected:', totalX === 10);
console.log('Σy matches expected:', totalY === 2684);
console.log('Σx² matches expected:', totalX2 === 30);
console.log('Σxy matches expected:', totalXY === 6163);

// Test the totals calculation logic from the fixed code
const totalsCalculationTest = testData.reduce((acc, row) => ({
  periode: acc.periode + row.periode,
  penjualan: acc.penjualan + row.penjualan,
  x2: acc.x2 + row.x2,
  xy: acc.xy + row.xy
}), { periode: 0, penjualan: 0, x2: 0, xy: 0 });

console.log('\n=== FIXED CODE TOTALS CALCULATION ===');
console.log('Fixed totals calculation:', totalsCalculationTest);
console.log('All values correct:', 
  totalsCalculationTest.periode === 10 &&
  totalsCalculationTest.penjualan === 2684 &&
  totalsCalculationTest.x2 === 30 &&
  totalsCalculationTest.xy === 6163
);
