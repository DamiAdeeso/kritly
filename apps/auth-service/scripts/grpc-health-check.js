const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { join } = require('path');

const port = process.env.AUTH_SERVICE_PORT || '3001';
const protoPath = join(process.cwd(), 'libs/common/src/proto/health.proto');

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const healthProto = grpc.loadPackageDefinition(packageDefinition).grpc.health.v1;
const client = new healthProto.Health(
  `127.0.0.1:${port}`,
  grpc.credentials.createInsecure(),
);

client.Check({ service: '' }, (error, response) => {
  if (error) {
    process.exit(1);
  }

  process.exit(response.status === 1 ? 0 : 1);
});
