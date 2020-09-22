const AWS = require('aws-sdk-mock');

const VALID_1ST_LINE = `latitude, ERROR! longitude,address
-43.58299805,146.89373497,"840 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58259635,146.89402117,"833 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58169878,146.89824631,"870 COCKLE CREEK RD, RECHERCHE TAS 7109"
`;

const VALID_4TH_LINE = `latitude,longitude,address
-43.58299805,146.89373497,"840 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58259635,146.89402117,"833 COCKLE CREEK RD, RECHERCHE TAS 7109"
-43.58169878,146.89824631,"870 &^% COCKLE CREEK RD, RECHERCHE TAS 7109"
`;

describe('Test csvAddressesHandler', function () { 

  it('TEST CASE 2:', async () => {
    const objectBody = VALID_4TH_LINE;
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

    expect(console.error).toHaveBeenCalled();
    AWS.restore('S3'); 
  });
});


