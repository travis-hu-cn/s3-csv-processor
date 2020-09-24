const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const ADDRESS_REGEXP = /^([-+]?\d{1,2}[.]\d+),\s*([-+]?\d{1,3}[.]\d+),\s*\"([\w\s,]+)\"$/;
const FIRST_LINE = 'latitude,longitude,address';
const TABLE_NAME = process.env.GEO_ADDRESS_TABLE;
const TOPIC_NAME = process.env.INVALID_GEO_ADDRESS_TOPIC;

const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();
const sns =  new AWS.SNS({apiVersion: '2010-03-31'});

/**
 * Publish message to SNS topic.
 * @param {*} message the text message
 */
function publishToTopic(message){
  console.debug(`Publishing ${message} to ${TOPIC_NAME}`);
  var params = {
    Message: message,
    TopicArn: TOPIC_NAME
  };
  return sns.publish(params);
}


/**
 * Extract latitude, longitude and address from given string.
 * @param {*} text current line of the csv file get from s3.
 */
function extractAddress(text){
  var matches = ADDRESS_REGEXP.exec(text)
  let addressEntry = {
    "latitude": matches[1],
    "longitude" : matches[2],
    "address" : matches[3]
  }
  return addressEntry
}

/**
 * Save the given entry to DyanmoDB table.
 * @param {*} addressEntry geocode and address in JSON format
 */
function saveAddress(addressEntry) {
  console.debug(`received: ${JSON.stringify(addressEntry)} to save to ${TABLE_NAME}.`);
  
  //final params to DynamoDB
  const params = {
      TableName: TABLE_NAME,
      Item: addressEntry
  }

  return docClient.put(params)
}


/**
 * A Lambda function that process CSV file received from S3.
 */
exports.csvAddressesHandler = async (event, context) => {

  // Download the content from the S3 source bucket.
  try {
    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey = event.Records[0].s3.object.key;

    const params = {
      Bucket: srcBucket,
      Key: srcKey
    };

    var data = await S3.getObject(params).promise();
    var addresses = data.Body.toString().split(/\r?\n/);
  } catch (err) {
    console.error(err);
    return;
  } 

  // process each address line by line
  var lineNumber = 1;
  for (let line of addresses) {
    console.debug(`Processing line: ${line}`);
    var isValid = true;

    // check the header, which is the first line.
    if (lineNumber == 1) {  
      if (line.trim().toLowerCase() !== FIRST_LINE){
        isValid = false;
      }
    }
    // check geocode and address
    else if ( line.length > 0) {
      if (!ADDRESS_REGEXP.test(line)){
        isValid = false;
      } else {  // save to dynamoDB if current line is valid
        // extract address entry from current line
        var addressEntry = extractAddress(line);
        // save the entry to dynamoDB table
        try {
          let result = await saveAddress(addressEntry).promise();
          console.debug(`save ${JSON.stringify(addressEntry)} to ${TABLE_NAME} successfully.`);
        } catch (err) {
          console.error(`error occurred :${err} when saving: line ${lineNumber} of file ${srcKey}.`);
        }
      }
    }

    if (!isValid){
      var err = `Invalid format at line ${lineNumber} of file ${srcKey}`;
      console.error(err);
      try {
        // invalid format entry should publish to a SNS topic.
        let result = await publishToTopic(err).promise();
        console.debug(`${err} published to ${TOPIC_NAME}`);
      } catch (error) {
        console.error(`error occurred :${error}.`);
      }
    }

    lineNumber++;
  }
}