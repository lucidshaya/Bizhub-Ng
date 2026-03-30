import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AuthService } from './src/auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  try {
    console.log('Testing login...');
    const res = await authService.login({ email: 'test500@example.com', password: 'password123' });
    console.log('Success:', res);
  } catch (err) {
    console.error('Error in login:', err);
  }
  await app.close();
}
bootstrap();
