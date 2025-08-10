import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testBridgeServer() {
  console.log('🚀 Testing Vercel AI Bridge Server');
  console.log('=' * 50);
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: List models
    console.log('\n2. Testing models endpoint...');
    const modelsResponse = await fetch(`${BASE_URL}/models`);
    const modelsData = await modelsResponse.json();
    console.log(`✅ Found ${modelsData.total} models`);
    
    // Show models by provider
    Object.entries(modelsData.byProvider).forEach(([provider, models]) => {
      console.log(`   ${provider.toUpperCase()}: ${models.length} models`);
      models.slice(0, 2).forEach(model => {
        console.log(`     • ${model.id} (${model.context}) - ${model.pricing}`);
      });
    });
    
    // Test 3: Test a model (if we have API keys)
    console.log('\n3. Testing model generation...');
    const testModelResponse = await fetch(`${BASE_URL}/test-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo' // Safe default
      })
    });
    
    const testModelData = await testModelResponse.json();
    if (testModelData.success) {
      console.log('✅ Model test successful:', testModelData.text);
    } else {
      console.log('⚠️ Model test failed (likely missing API key):', testModelData.error);
    }
    
    // Test 4: Custom generation
    console.log('\n4. Testing custom generation...');
    const generateResponse = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        prompt: 'What is 2+2?',
        maxTokens: 50
      })
    });
    
    const generateData = await generateResponse.json();
    if (generateData.text) {
      console.log('✅ Generation successful:', generateData.text);
      console.log('   Usage:', generateData.usage);
    } else {
      console.log('⚠️ Generation failed:', generateData.error);
    }
    
    console.log('\n🎉 Bridge server test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the bridge server is running:');
    console.log('cd vercel-ai-bridge && npm start');
  }
}

testBridgeServer();
