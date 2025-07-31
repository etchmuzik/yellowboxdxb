import fetch from 'node-fetch';

async function assignRole(userId, email, role) {
  try {
    console.log(`\n🎯 Assigning ${role} role to ${email} (${userId})...`);
    
    // Cloud Function URL for yellowbox-8e0e6 project
    const functionUrl = 'https://us-central1-yellowbox-8e0e6.cloudfunctions.net/setUserRole';
    
    const payload = {
      data: {
        userId: userId,
        role: role
      }
    };
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      result = { message: responseText };
    }
    
    console.log(`✅ SUCCESS: ${result.result?.message || result.message || 'Role assigned successfully'}`);
    return result;
    
  } catch (error) {
    console.error(`❌ ERROR assigning ${role} to ${email}:`, error.message);
    throw error;
  }
}

async function assignAllAdminRoles() {
  try {
    console.log('🚀 Starting comprehensive admin role assignment...');
    
    // Key admin users from users.json
    const adminUsers = [
      {
        id: 'IwqPx9jFfHOVXj2RqlEZJCDxWpr1',
        email: 'admin@yellowboxdxb.com',
        role: 'Admin'
      },
      {
        id: '7UNPSV8tqzekcyVO5Submwi81eU2',
        email: 'operations@yellowbox.ae',
        role: 'Operations'
      },
      {
        id: 'T5L7kznpFcWTerh68aYZYfIqvHJ3',
        email: 'finance@yellowbox.ae',
        role: 'Finance'
      }
    ];
    
    console.log(`📋 Will assign roles to ${adminUsers.length} key admin users:`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} → ${user.role}`);
    });
    
    // Assign roles one by one
    for (const user of adminUsers) {
      await assignRole(user.id, user.email, user.role);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 All admin roles assigned successfully!');
    console.log('\n📋 Role Assignment Summary:');
    console.log('   ✅ admin@yellowbox.ae → Admin (completed earlier)');
    adminUsers.forEach(user => {
      console.log(`   ✅ ${user.email} → ${user.role}`);
    });
    
    console.log('\n🔄 Next steps:');
    console.log('   1. Users must log out and log back in to refresh their ID tokens');
    console.log('   2. Disable bootstrap mode for security');
    console.log('   3. Deploy final secured Firestore rules');
    console.log('   4. Test role-based access control');
    
    return true;
    
  } catch (error) {
    console.error('💥 Role assignment process failed:', error);
    throw error;
  }
}

// Run the assignment process
assignAllAdminRoles()
  .then(() => {
    console.log('\n🎯 Admin role assignment process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Admin role assignment process failed:', error);
    process.exit(1);
  });