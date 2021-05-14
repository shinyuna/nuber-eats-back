import * as AWS from 'aws-sdk';

import { Body, Controller, Inject, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { UploadModuleConfig } from './uploads.interfaces';
import UploadFileDto from './dtos/upload-file.dto';

@Controller('uploads')
export class UploadsController {
  constructor(@Inject(CONFIG_OPTIONS) private readonly config: UploadModuleConfig) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file, @Body() body: UploadFileDto) {
    AWS.config.update({
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
    try {
      if (!body.ownerId && !body.type) return 'No params';
      const objectName = `${body.ownerId}/${body.type}/${file.originalname}`;
      await new AWS.S3()
        .putObject({
          Body: file.buffer,
          Key: objectName,
          Bucket: this.config.bucketName,
          ACL: 'public-read',
        })
        .promise();
      const url = `https://${this.config.bucketName}.s3.amazonaws.com/${objectName}`;
      return {
        url,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
