import { ApiCheck, AssertionBuilder, Frequency } from 'checkly/constructs';

// Lightweight uptime + warming ping. Cheap (API quota), frequent, alerting.
// Adjust the URL if production is not served from glasummit.org.
new ApiCheck('homepage-uptime', {
  name: 'Production homepage uptime',
  activated: true,
  frequency: Frequency.EVERY_10M,
  degradedResponseTime: 5000,
  maxResponseTime: 15000,
  request: {
    method: 'GET',
    url: 'https://glasummit.org/',
    followRedirects: true,
    skipSSL: false,
    assertions: [AssertionBuilder.statusCode().equals(200)]
  }
});
