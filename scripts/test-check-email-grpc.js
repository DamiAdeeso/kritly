const { credentials, loadPackageDefinition } = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { join } = require('path');

const PROTO_PATH = join(process.cwd(), 'libs/common/src/proto/auth.proto');

function call(loaderOptions) {
  return new Promise((resolve, reject) => {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, loaderOptions);
    const authProto = loadPackageDefinition(packageDefinition);
    const client = new authProto.auth.AuthService(
      'localhost:3001',
      credentials.createInsecure(),
    );

    client.checkEmailAvailability(
      { email: 'totallynew999@example.com' },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      },
    );
  });
}

(async () => {
  console.log('keepCase: true, defaults: true');
  console.log(JSON.stringify(await call({ keepCase: true, longs: String, enums: String, defaults: true, oneofs: true }), null, 2));

  console.log('\nkeepCase: false (Nest default-ish), defaults: false');
  console.log(JSON.stringify(await call({ keepCase: false, longs: String, enums: String, defaults: false, oneofs: true }), null, 2));
})().catch((err) => {
  console.error('ERR', err);
  process.exit(1);
});
