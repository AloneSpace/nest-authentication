import { TypeOrmModuleOptions } from '@nestjs/typeorm';
require('dotenv').config();

export const config: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: 3306,
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  entities: ['dist/**/*.entity.js'], // maybe you should also consider chage it to something like:  [__dirname + '/**/*.entity.ts', __dirname + '/src/**/*.entity.js']
  migrations: ['dist/migration/**/*.js'],
  cli: {
    migrationsDir: 'migration',
  },
  synchronize: true,
};
