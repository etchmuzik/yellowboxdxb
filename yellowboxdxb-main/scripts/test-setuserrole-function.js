import fetch from 'node-fetch';

async function testSetUserRole() {
  try {
    console.log('🚀 Testing setUserRole Cloud Function via HTTP...');
    
    // Target admin user from users.json
    const targetUserId = '2n8OhW54aQUwvcLjNyjubsiYENu1'; // admin@yellowbox.ae
    const targetRole = 'Admin';
    
    console.log(`📧 Target User ID: ${targetUserId}`);
    console.log(`👑 Target Role: ${targetRole}`);
    
    // Cloud Function URL for yellowbox-8e0e6 project
    const functionUrl = 'https://us-central1-yellowbox-8e0e6.cloudfunctions.net/setUserRole';
    
    const payload = {
      data: {
        userId: targetUserId,
        role: targetRole
      }
    };
    
    console.log('📞 Calling setUserRole Cloud Function via HTTP...');
    console.log('🔗 Function URL:', functionUrl);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Raw Response:', responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.log('⚠️  Could not parse JSON, treating as text response');
      result = { message: responseText };
    }
    
    console.log('✅ SUCCESS! setUserRole function result:', result);
    console.log('🎉 Admin role assignment completed!');
    
    return result;
    
  } catch (error) {
    console.error('❌ ERROR calling setUserRole function:', error);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.message) {
      console.error('Error Message:', error.message);
    }
    if (error.stack) {
      console.error('Stack Trace:', error.stack);
    }
    
    throw error;
  }
}

// Run the test
testSetUserRole()
  .then(() => {
    console.log('🎯 Role assignment test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Role assignment test failed:', error);
    process.exit(1);
  });