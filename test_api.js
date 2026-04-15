const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Testing API...');
    
    const response = await fetch('http://localhost:5000/papers?exam=IPPB%20%2F%20Regional%20Rural%20Bank%20(RBI-linked)%20Recruitment&year=2023');
    const data = await response.json();
    
    console.log('📋 Response status:', response.status);
    console.log('📄 Response data:', JSON.stringify(data, null, 2));
    
    if (data.length > 0) {
      console.log('✅ SUCCESS: Papers found!');
      data.forEach((paper, index) => {
        console.log(`  ${index + 1}. ${paper.paper || paper._id}`);
      });
    } else {
      console.log('❌ FAILED: No papers found');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testAPI();
