# API

## NEEDED ENDPOINTS

Send a request with task, repository

### /api/analyze

curl 'http://127.0.0.1:5000/api/confirm' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'Referer: http://localhost:3000/' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'sec-ch-ua: "Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"' \
  -H 'Content-Type: application/json' \
  -H 'sec-ch-ua-mobile: ?0' \
  --data-raw '{"requestId":"dbd7297a-468e-4b85-b7d7-ecddc18ef856"}' ;

#### Returns

{"estimatedCost":0.075003,"estimatedTokens":1,"needsConfirmation":true,"requestId":"fac36a2e-1d87-4a24-96d6-3bd775b5234e","request_id":"fac36a2e-1d87-4a24-96d6-3bd775b5234e"}

### TO Confirm Request after you saw what it costs

/api/confirm


### Test if Hello World works
/ 