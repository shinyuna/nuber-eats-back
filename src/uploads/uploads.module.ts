import { DynamicModule, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { UploadsController } from './uploads.controller';
import { UploadModuleConfig } from './uploads.interfaces';

@Module({
  controllers: [UploadsController],
})
export class UploadsModule {
  static forRoot(options: UploadModuleConfig): DynamicModule {
    return {
      module: UploadsModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        UploadsModule,
      ],
      exports: [UploadsModule],
    };
  }
}
