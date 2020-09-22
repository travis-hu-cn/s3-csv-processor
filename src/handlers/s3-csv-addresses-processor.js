const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ADDRESS_REGEXP = /^([-+]?\d{1,2}[.]\d+),\s*([-+]?\d{1,3}[.]\d+),\s*(\"[\w\s,]+\")$/;
const FIRST_LINE = 'latitude,longitude,address';


/**
 * A Lambda function that process CSV file received from S3.
 */
exports.csvAddressesHandler = async (event, context) => {
  const getObjectRequests = event.Records.map(record => {
    const params = {
      Bucket: record.s3.bucket.name,
      Key: record.s3.object.key
    };
    return s3.getObject(params).promise().then(data => {
      var lineNumber = 1;
      data.Body.toString().split(/\r?\n/).forEach(function(line) {
        console.debug(line);
        var isValid = true;

        if (lineNumber == 1) {
          if (line.trim().toLowerCase() !== FIRST_LINE){
            isValid = false;
          } else {
            console.info("OK: " + line);
            console.info(line.trim().toLowerCase() === FIRST_LINE);
          }
        } else if ( line.length > 0 
                    && (!ADDRESS_REGEXP.test(line)) ){
          isValid = false;
        }

        if (!isValid){
          var err = `Invalid format at line ${lineNumber} of file ${record.s3.object.key}`;
          console.error(err);
        }

        lineNumber++;
      });
    }).catch(err => {
      console.error("Error calling S3 getObject:", err);
      return Promise.reject(err);
    })
  });
  return Promise.all(getObjectRequests).then(() => {
    console.debug('Complete!');
  });
};