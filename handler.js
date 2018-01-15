'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

module.exports.extractMetadata = (event, context, callback) => {
    var params = {
        TableName: 'serverless-challenge-dev',
        Item: {
            s3objectkey: '04',
            content_length: 40,
            date: '1111-01-01'
        }
    };

    params.Item.s3objectkey = event.Records[0].s3.object.key;
    params.Item.content_length = event.Records[0].s3.object.size;

    dynamoDb.put(params, function (err, data) {
        if (err) console.log(err);
        else console.log(data);
    });

    callback(null, { 'messagem': "Success" });
};

module.exports.getMetadata = (event, context, callback) => {
    var response = {
        "statusCode": 200,
        "body": "",
        "isBase64Encoded": false
    };

    var params = {
        TableName: 'serverless-challenge-dev',
        Key: {
            s3objectkey: event.pathParameters.s3objectkey
        }
    };

    dynamoDb.get(params, function (err, data) {
        if (err) {
            console.log(err);
            callback(err, null);
        }
        else { 
            response.body = JSON.stringify(data.Item);
            callback(null, response);
        }
    });

};