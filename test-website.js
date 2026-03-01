// Simple test script to verify the website functionality
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Sitemendr Website...\n');

// Test 1: Check if key files exist
const requiredFiles = [
  'frontend/src/app/page.tsx',
  'frontend/src/app/dashboard/page.tsx',
  'frontend/src/app/admin/page.tsx',
  'frontend/src/app/blog/page.tsx',
  'frontend/src/app/payment/page.tsx',
  'backend/server.js',
  'backend/prisma/schema.prisma',
  'backend/.env'
];

console.log('📁 Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check if package.json files exist
console.log('\n📦 Checking package.json files...');
const packageFiles = ['frontend/package.json', 'backend/package.json'];
packageFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 3: Check if key components exist
console.log('\n🧩 Checking key components...');
const components = [
  'frontend/src/components/ClientDashboard.tsx',
  'frontend/src/components/AdminDashboard.tsx',
  'frontend/src/components/BlogComments.tsx',
  'frontend/src/components/BlogLike.tsx',
  'frontend/src/lib/api.ts'
];

components.forEach(component => {
  if (fs.existsSync(component)) {
    console.log(`✅ ${component}`);
  } else {
    console.log(`❌ ${component} - MISSING`);
    allFilesExist = false;
  }
});

// Test 4: Check if payment pages exist
console.log('\n💳 Checking payment pages...');
const paymentPages = [
  'frontend/src/app/payment/callback/page.tsx',
  'frontend/src/app/payment/success/page.tsx',
  'frontend/src/app/payment/reactivate/page.tsx'
];

paymentPages.forEach(page => {
  if (fs.existsSync(page)) {
    console.log(`✅ ${page}`);
  } else {
    console.log(`❌ ${page} - MISSING`);
    allFilesExist = false;
  }
});

// Test 5: Check if blog functionality exists
console.log('\n📝 Checking blog functionality...');
const blogFiles = [
  'backend/controllers/blogController.js',
  'backend/routes/blogRoutes.js',
  'frontend/src/app/blog/[slug]/page.tsx'
];

blogFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 6: Check database schema
console.log('\n🗄️ Checking database schema...');
if (fs.existsSync('backend/prisma/schema.prisma')) {
  const schemaContent = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
  const requiredModels = ['User', 'BlogPost', 'Comment', 'Subscription', 'Payment'];
  let schemaValid = true;
  
  requiredModels.forEach(model => {
    if (schemaContent.includes(`model ${model}`)) {
      console.log(`✅ ${model} model found`);
    } else {
      console.log(`❌ ${model} model missing`);
      schemaValid = false;
    }
  });
  
  if (schemaValid) {
    console.log('✅ Database schema looks complete');
  } else {
    console.log('❌ Database schema is incomplete');
    allFilesExist = false;
  }
} else {
  console.log('❌ schema.prisma file missing');
  allFilesExist = false;
}

// Test 7: Check environment configuration
console.log('\n⚙️ Checking environment configuration...');
if (fs.existsSync('backend/.env')) {
  const envContent = fs.readFileSync('backend/.env', 'utf8');
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PAYSTACK_SECRET_KEY',
    'OPENAI_API_KEY'
  ];
  
  let envValid = true;
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar} configured`);
    } else {
      console.log(`❌ ${envVar} missing`);
      envValid = false;
    }
  });
  
  if (envValid) {
    console.log('✅ Environment configuration looks complete');
  } else {
    console.log('❌ Environment configuration is incomplete');
    allFilesExist = false;
  }
} else {
  console.log('❌ .env file missing');
  allFilesExist = false;
}

// Final results
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 All tests passed! Website appears to be complete.');
  console.log('\n🚀 Next steps:');
  console.log('1. Run `npm install` in both frontend/ and backend/ directories');
  console.log('2. Set up your database and update DATABASE_URL in backend/.env');
  console.log('3. Configure your Paystack keys in backend/.env');
  console.log('4. Run database migrations: `cd backend && npx prisma migrate dev`');
  console.log('5. Start the backend: `cd backend && npm start`');
  console.log('6. Start the frontend: `cd frontend && npm run dev`');
} else {
  console.log('❌ Some tests failed. Please check the missing files above.');
}
console.log('='.repeat(50));