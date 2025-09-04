import { generateTransactionCode, generateFallbackCode, isTransactionCodeExists } from '../utils/transactionCodeGenerator.js';

async function testTransactionCodeGeneration() {
  console.log('Testing Transaction Code Generation...\n');
  
  try {
    // Test Stock In code generation
    console.log('1. Testing Stock In code generation:');
    const stockInCode1 = await generateTransactionCode('IN', '2024-01-15');
    console.log(`Generated Stock In Code: ${stockInCode1}`);
    
    const stockInCode2 = await generateTransactionCode('IN', '2024-01-15');
    console.log(`Generated Stock In Code (same date): ${stockInCode2}`);
    
    // Test Stock Out code generation
    console.log('\n2. Testing Stock Out code generation:');
    const stockOutCode1 = await generateTransactionCode('OUT', '2024-01-15');
    console.log(`Generated Stock Out Code: ${stockOutCode1}`);
    
    const stockOutCode2 = await generateTransactionCode('OUT', '2024-01-15');
    console.log(`Generated Stock Out Code (same date): ${stockOutCode2}`);
    
    // Test different dates
    console.log('\n3. Testing different dates:');
    const todayCode = await generateTransactionCode('IN', new Date().toISOString().split('T')[0]);
    console.log(`Generated Code for Today: ${todayCode}`);
    
    // Test fallback codes
    console.log('\n4. Testing fallback codes:');
    const fallbackIn = generateFallbackCode('IN');
    const fallbackOut = generateFallbackCode('OUT');
    console.log(`Fallback Stock In Code: ${fallbackIn}`);
    console.log(`Fallback Stock Out Code: ${fallbackOut}`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTransactionCodeGeneration();
