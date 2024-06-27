const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const { default: OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const VERIFY_TOKEN = 'HerM0StudioMx2934I443';
const PAGE_ACCESS_TOKEN = 'EAAGpWIhPse4BOZCf8lvx3ZCs0ppJgMLVHbDVrjEnOBjXZBZC6ImRX5CeVvDfgKWQ289tyJgXStZCW336qyux3kNxMfm4AavucjZA6KTD3OHXZCfLzpjq7VYSlFs3xVXAj6lvNLE6DmuHiYWQG01xht6fD165MNH69qOQnBJXbnWG5ZACen5afRKU34w94WSsQLGTvgZDZD';
const OPENAI_API_KEY = 'sk-proj-MFHYk6jLpGefrZ4vhyO3T3BlbkFJVoiQ7QqEisZnXDWkwgS1';

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.post('/webhook', (req, res) => {
  let body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      let webhookEvent = entry.messaging[0];
      console.log(webhookEvent);

      let senderPsid = webhookEvent.sender.id;
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

async function handleMessage(senderPsid, receivedMessage) {
  let response;

  if (receivedMessage.text) {
    try {
      const axios = (await import('axios')).default;
      const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo-16k',
        prompt: receivedMessage.text,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ` + OPENAI_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      response = {
        'text': gptResponse.data.choices[0].text.trim()
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      response = {
        'text': 'Sorry, I could not process your request at this time.'
      };
    }
  }

  callSendAPI(senderPsid, response);
}

function callSendAPI(senderPsid, response) {
  let requestBody = {
    'recipient': {
      'id': senderPsid
    },
    'message': response
  };

  request({
    'uri': 'https://graph.facebook.com/v8.0/me/messages',
    'qs': { 'access_token': PAGE_ACCESS_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
