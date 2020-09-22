const AWS = require('aws-sdk-mock');

const VALID_CSV_CONTENT = `latitude,longitude,address
-43.58299805,146.89373497,"840 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58259635,146.89402117,"833 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58169878,146.89824631,"870 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58095637,146.88651178,"810 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58079479,146.88701991,"812 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58074011,146.88635117,"808 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58056905,146.88637626,"806 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58037106,146.88647572,"804 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58010117,146.88671156,"800 COCKLE CREEK RD, RECHERCHE TAS 7109"
`;

describe('Test csvAddressesHandler', function () { 

  it('TEST CASE 1: a valid CSV should not print error:', async () => {
    const objectBody = VALID_CSV_CONTENT;
    const getObjectResp = {
      Body: objectBody
    };

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: "test-bucket"
            },
            object: {
              key: "addresses.csv"
            }
          }
        }
      ]
    };

    AWS.mock('S3', 'getObject', function(params, callback) {
      callback(null, getObjectResp);
    });

    console.error = jest.fn();
    let handler = require('../../../src/handlers/s3-csv-addresses-processor.js');

    await handler.csvAddressesHandler(event, null);

    expect(console.error).not.toHaveBeenCalled();
    AWS.restore('S3'); 
  });
});


