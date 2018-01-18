'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const exif = require('exif-parser');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

module.exports.extractMetadata = (event, context, callback) => {

    let tableParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
            s3objectkey: '',
            content_length: 0,
            height: 0,
            width: 0
        }
    };

    for (var rec in event.Records) {
        const key = event.Records[rec].s3.object.key;
        const bucket = event.Records[rec].s3.bucket.name;

        let s3Params = {
            Bucket: bucket, 
            Key: key
        };

        s3.getObject(s3Params, function(err, data) {
            if (err) {
                console.log(err);
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
                });
            } // successful response
        });
    }

    callback(null, {"message": "Success"});
};

module.exports.getMetadata = (event, context, callback) => {  
    const path = event.resource.replace(/\{.+\}/g, '');
    const s3objectkey = event.path.replace(path, '');

    let params = {
        TableName: process.env.DYNAMODB_TABLE,
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

module.exports.getImage = (event, context, callback) => {  
    const path = event.resource.replace(/\{.+\}/g, '');
    const s3objectkey = event.path.replace(path, '');

    let s3Params = {
        Bucket: 'serverless-challenge-igor', 
        Key: s3objectkey
    };

    let response = {
        statusCode: 200,
        headers: {'Content-type' : 'image/jpeg'},
        body: '',
        isBase64Encoded : true,
      };

    s3.getObject(s3Params, function(err, data) {
        if (err) {
            console.log(err);
            callback(err, null);
        } // an error occurred
        else {
            response.body = data.Body.toString('base64');
            callback(null, response);
        } // successful response
    });

};