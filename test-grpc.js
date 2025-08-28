const { credentials } = require('@grpc/grpc-js');
const { loadPackageDefinition } = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load the proto file
const PROTO_PATH = path.join(__dirname, 'libs/common/src/proto/auth.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const authProto = loadPackageDefinition(packageDefinition);

// Create gRPC client
const client = new authProto.auth.AuthService(
  'localhost:3001',
  credentials.createInsecure()
);

// Test register method
const testRegister = () => {
  const registerRequest = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://example.com/avatar.jpg'
  };

  console.log('Testing gRPC Register method...');
  console.log('Request:', registerRequest);

  client.Register(registerRequest, (error, response) => {
    if (error) {
      console.error('gRPC Error:', error.message);
      console.error('Error Code:', error.code);
      console.error('Error Details:', error.details);
    } else {
      console.log('gRPC Response:', response);
    }
  });
};

// Test login method
const testLogin = () => {
  const loginRequest = {
    email: 'test@example.com',
    password: 'password123'
  };

  console.log('\nTesting gRPC Login method...');
  console.log('Request:', loginRequest);

  client.Login(loginRequest, (error, response) => {
    if (error) {
      console.error('gRPC Error:', error.message);
      console.error('Error Code:', error.code);
      console.error('Error Details:', error.details);
    } else {
      console.log('gRPC Response:', response);
    }
  });
};

// Run tests
console.log('🚀 Starting gRPC Tests...\n');

// Wait a bit for services to be ready
setTimeout(() => {
  testRegister();
  
  setTimeout(() => {
    testLogin();
  }, 2000);
}, 2000);
