'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const exif = require('exif-parser');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

module.exports.extractMetadata = (event, context, callback) => {
    const key = event.Records[0].s3.object.key;
    const bucket = event.Records[0].s3.bucket.name;

    let tableParams = {
        TableName: 'serverless-challenge-dev',
        Item: {
            s3objectkey: '04',
            content_length: 40,
            height: 0,
            width: 0
        }
    };

    let s3Params = {
        Bucket: bucket, 
        Key: key
    };

    s3.getObject(s3Params, function(err, data) {
        if (err) {
            callback(err, null);
        } // an error occurred
        else {
            const parser = exif.create(data.Body);
            const result = parser.parse();
            tableParams.Item.s3objectkey = key;
            tableParams.Item.content_length = data.ContentLength;
            tableParams.Item.width = result.imageSize.width;
            tableParams.Item.height = result.imageSize.height;

            dynamoDb.put(tableParams, function (err, data) {
                if (err) {
                    console.log(err);
                    callback(err, null);
                }
                else {
                    callback(null, { 'message': "Success" });
                }
            });
        } // successful response
    });
};

module.exports.getMetadata = (event, context, callback) => {  
    const path = event.resource.replace(/\{.+\}/g, '');
    const s3objectkey = event.path.replace(path, '')

    let params = {
        TableName: 'serverless-challenge-dev',
        Key: {
            s3objectkey: s3objectkey
        }
    };

    dynamoDb.get(params, function (err, data) {
        if (err) {
            console.log(err);
            callback(err, null);
        }
        else { 
            callback(null, {"statusCode": 200, "body": JSON.stringify(data.Item)});
        }
    });

};